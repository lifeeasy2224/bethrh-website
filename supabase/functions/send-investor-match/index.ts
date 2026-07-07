import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { INVESTOR_MATCH_TEMPLATE } from '../_shared/templates.ts';

const SECTOR_EMOJI: Record<string, string> = {
  'Food & Agriculture': '🌾', 'B2B SaaS': '💼', 'E-commerce': '🛒',
  'Fintech': '💰', 'EdTech': '📚', 'HealthTech': '🏥',
  'Logistics': '🚚', 'Services': '🔧',
};

// Related sectors map — partial credit when sectors are adjacent
const RELATED_SECTORS: Record<string, string[]> = {
  'B2B SaaS': ['EdTech', 'HealthTech', 'Fintech', 'Logistics'],
  'EdTech': ['B2B SaaS', 'Services'],
  'HealthTech': ['B2B SaaS', 'Services'],
  'Fintech': ['B2B SaaS', 'E-commerce'],
  'E-commerce': ['Fintech', 'Food & Agriculture', 'Logistics'],
  'Food & Agriculture': ['E-commerce', 'Services'],
  'Logistics': ['B2B SaaS', 'E-commerce'],
  'Services': ['B2B SaaS', 'EdTech', 'HealthTech'],
};

interface IdeaRecord {
  id: string;
  user_id: string;
  title: string;
  sector: string;
  problem: string;
  in_marketplace: boolean;
  iq_score: number;
}

interface InvestorProfile {
  user_id: string;
  sectors_of_interest: string[];
  check_size?: string;
  check_size_min?: number;
  check_size_max?: number;
}

interface CanvasRow {
  monthly_revenue?: number;
  monthly_costs?: number;
  break_even_month?: number;
  key_partners?: string;
  key_activities?: string;
  value_proposition?: string;
  customer_relationships?: string;
  customer_segments?: string;
  key_resources?: string;
  channels?: string;
  cost_structure?: string;
  revenue_streams?: string;
}

interface PitchRow {
  investment_amount?: number;
}

/**
 * Weighted 100-point match score:
 *   Sector alignment  : 40 pts (exact=40, related=20, none=0)
 *   Budget fit        : 25 pts
 *   IQ quality        : 20 pts (score/100 * 20)
 *   Completeness      : 15 pts (canvas blocks filled / 9 * 15)
 */
function computeMatchScore(params: {
  ideaSector: string;
  investorSectors: string[];
  investmentAmount: number | null;
  checkSizeMin: number | null;
  checkSizeMax: number | null;
  iqScore: number;
  canvasFilledBlocks: number;
}): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let pts = 0;

  // Sector alignment (40 pts)
  const exactMatch = params.investorSectors.includes(params.ideaSector);
  const relatedMatch = !exactMatch && params.investorSectors.some(
    s => RELATED_SECTORS[s]?.includes(params.ideaSector),
  );
  if (exactMatch) {
    pts += 40;
    reasons.push(`Sector match (${params.ideaSector})`);
  } else if (relatedMatch) {
    pts += 20;
    reasons.push(`Related sector (${params.ideaSector})`);
  }

  // Budget fit (25 pts)
  const min = params.checkSizeMin ?? 0;
  const max = params.checkSizeMax ?? Infinity;
  const ask = params.investmentAmount ?? 0;
  if (ask > 0 && min <= ask && ask <= max) {
    pts += 25;
    reasons.push('Investment range aligns');
  } else if (ask === 0 || (min === 0 && max === Infinity)) {
    pts += 12; // no info — partial credit
  }

  // IQ quality (20 pts)
  const iqPts = Math.round((params.iqScore / 100) * 20);
  pts += iqPts;
  if (params.iqScore >= 80) reasons.push(`High IQ Score (${params.iqScore}/100)`);

  // Completeness (15 pts)
  const completePts = Math.round((params.canvasFilledBlocks / 9) * 15);
  pts += completePts;
  if (params.canvasFilledBlocks >= 7) reasons.push('Complete business model');

  return { score: Math.min(pts, 100), reasons };
}

function matchLabel(score: number): string {
  if (score >= 85) return 'تطابق ممتاز';
  if (score >= 70) return 'تطابق قوي';
  if (score >= 55) return 'تطابق جيد';
  return 'تطابق محتمل';
}

const CANVAS_KEYS = ['key_partners', 'key_activities', 'value_proposition', 'customer_relationships', 'customer_segments', 'key_resources', 'channels', 'cost_structure', 'revenue_streams'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json() as { record?: IdeaRecord; idea_id?: string };

    // Support both DB webhook trigger (record) and manual invocation (idea_id)
    let record: IdeaRecord | null = body.record ?? null;
    if (!record && body.idea_id) {
      const db = getServiceClient();
      const { data } = await db.from('user_ideas').select('*').eq('id', body.idea_id).maybeSingle();
      record = data as IdeaRecord | null;
    }

    if (!record) return jsonResp({ error: 'no idea record provided' }, 400);
    if (!record.in_marketplace) return jsonResp({ skipped: 'not in marketplace' });

    const db = getServiceClient();

    // Find investors whose sectors overlap (exact or related)
    const allRelated = [record.sector, ...(RELATED_SECTORS[record.sector] ?? [])];
    const { data: investors } = await db
      .from('investor_profiles')
      .select('user_id, sectors_of_interest, check_size, check_size_min, check_size_max')
      .overlaps('sectors_of_interest', allRelated);

    if (!investors?.length) return jsonResp({ ok: true, sent: 0 });

    // Get canvas + pitch data for scoring
    const [{ data: canvas }, { data: pitch }] = await Promise.all([
      db.from('canvas_data').select('*').eq('user_idea_id', record.id).maybeSingle(),
      db.from('pitch_data').select('investment_amount').eq('user_idea_id', record.id).maybeSingle(),
    ]);

    const canvasRow = canvas as CanvasRow | null;
    const pitchRow = pitch as PitchRow | null;
    const canvasFilledBlocks = canvasRow
      ? CANVAS_KEYS.filter(k => (canvasRow as Record<string, string>)[k]?.length >= 20).length
      : 0;

    const roi = canvasRow?.monthly_revenue && canvasRow?.monthly_costs
      ? `${Math.round(((canvasRow.monthly_revenue - canvasRow.monthly_costs) / Math.max(canvasRow.monthly_costs, 1)) * 100)}%`
      : 'TBD';

    const origin = 'https://bethra.co';
    let sent = 0;

    for (const investor of investors as InvestorProfile[]) {
      const { score: matchScore, reasons } = computeMatchScore({
        ideaSector: record.sector,
        investorSectors: investor.sectors_of_interest ?? [],
        investmentAmount: pitchRow?.investment_amount ?? null,
        checkSizeMin: investor.check_size_min ?? null,
        checkSizeMax: investor.check_size_max ?? null,
        iqScore: record.iq_score ?? 0,
        canvasFilledBlocks,
      });

      // Only notify for meaningful matches
      if (matchScore < 40) continue;

      const { data: authUser } = await db.auth.admin.getUserById(investor.user_id);
      const email = authUser?.user?.email;
      if (!email) continue;

      const { data: profile } = await db
        .from('profiles')
        .select('full_name, unsubscribe_token, email_digest_enabled')
        .eq('user_id', investor.user_id)
        .maybeSingle();

      if (!profile?.email_digest_enabled) continue;

      const html = render(await resolveBody(db, 'investor-match', INVESTOR_MATCH_TEMPLATE), {
        investor_name: (profile?.full_name ?? '').split(' ')[0] || 'there',
        match_score: `${matchScore} — ${matchLabel(matchScore)}`,
        sector: record.sector,
        sector_emoji: SECTOR_EMOJI[record.sector] ?? '💡',
        idea_name: record.title,
        idea_description: (record.problem ?? '').slice(0, 160),
        investment_range: investor.check_size ?? 'N/A',
        roi,
        breakeven: canvasRow?.break_even_month ? `Month ${canvasRow.break_even_month}` : 'TBD',
        match_reasons: reasons.join(' · '),
        idea_url: `${origin}/investor/idea/${record.id}`,
        unsubscribe_url: `${origin}/unsubscribe?token=${profile?.unsubscribe_token ?? ''}`,
      });

      await sendViaResend(email, `${matchLabel(matchScore)}: ${record.title}`, html);

      await db.from('notifications').insert({
        user_id: investor.user_id,
        type: 'match',
        title: `${matchLabel(matchScore)}: ${record.title}`,
        body: `"${record.title}" scored ${matchScore}/100 match — ${reasons[0] ?? ''}`,
        link: `/investor/idea/${record.id}`,
        is_read: false,
      });

      sent++;
    }

    return jsonResp({ ok: true, sent });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
