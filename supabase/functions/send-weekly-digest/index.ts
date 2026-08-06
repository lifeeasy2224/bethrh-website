import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { WEEKLY_DIGEST_TEMPLATE } from '../_shared/templates.ts';
import { checkCronAuth } from '../_shared/cron-auth.ts';

const SECTOR_EMOJI: Record<string, string> = {
  'Food & Agriculture': '🌾', 'B2B SaaS': '💼', 'E-commerce': '🛒',
  'Fintech': '💰', 'EdTech': '📚', 'HealthTech': '🏥',
  'Logistics': '🚚', 'Services': '🔧',
};

function ideaCardHtml(name: string, sector: string, match: string, investment: string): string {
  const emoji = SECTOR_EMOJI[sector] ?? '💡';
  return `<div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:14px;margin-bottom:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <strong style="font-size:14px;color:#1B2A4A;">${emoji} ${name}</strong>
      <span style="background:#DBEAFE;color:#1D4ED8;font-size:11px;font-weight:700;padding:2px 8px;border-radius:100px;">${match}</span>
    </div>
    <div style="color:#6B7280;font-size:12px;">${sector} · ${investment}</div>
  </div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  const denied = checkCronAuth(req);
  if (denied) return denied;

  try {
    const db = getServiceClient();

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekDate = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const { data: profiles } = await db
      .from('profiles')
      .select('user_id, full_name, current_streak, unsubscribe_token, email_digest_enabled, role')
      .eq('email_digest_enabled', true);

    if (!profiles?.length) return jsonResp({ ok: true, sent: 0 });

    const origin = 'https://bethra.co';
    let sent = 0;

    for (const profile of profiles) {
      try {
        const { data: authUser } = await db.auth.admin.getUserById(profile.user_id);
        const email = authUser?.user?.email;
        if (!email) continue;

        const isInvestor = profile.role === 'investor';

        const [
          { data: idea },
          { count: msgCount },
          { count: matchCount },
          { count: newIdeasCount },
        ] = await Promise.all([
          db.from('user_ideas').select('iq_score').eq('user_id', profile.user_id).order('iq_score', { ascending: false }).limit(1).maybeSingle(),
          db.from('messages').select('*', { count: 'exact', head: true })
            .gte('created_at', weekStart.toISOString()),
          db.from('notifications').select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)
            .eq('type', 'investor_match')
            .gte('created_at', weekStart.toISOString()),
          db.from('user_ideas').select('*', { count: 'exact', head: true })
            .eq('in_marketplace', true)
            .gte('created_at', weekStart.toISOString()),
        ]);

        // Skip users with zero activity
        const totalActivity = (msgCount ?? 0) + (matchCount ?? 0) + (newIdeasCount ?? 0);
        if (totalActivity === 0) continue;

        const { count: journeyDone } = await db
          .from('journey_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_idea_id',
            (await db.from('user_ideas').select('id').eq('user_id', profile.user_id).limit(1).maybeSingle())?.data?.id ?? '',
          )
          .eq('is_completed', true);

        const journeyPct = Math.min(Math.round(((journeyDone ?? 0) / 48) * 100), 100);

        // Fetch top 3 ideas
        let topIdeas: Array<{ title: string; sector: string; check_size?: string; match?: string }> = [];

        if (isInvestor) {
          // For investors: top 3 new marketplace ideas matching their sectors
          const { data: investorProfile } = await db
            .from('investor_profiles')
            .select('sectors_of_interest, check_size')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          const sectors = investorProfile?.sectors_of_interest ?? [];
          const { data: matchedIdeas } = await db
            .from('user_ideas')
            .select('title, sector')
            .eq('in_marketplace', true)
            .in('sector', sectors.length ? sectors : ['__none__'])
            .order('created_at', { ascending: false })
            .limit(3);

          topIdeas = (matchedIdeas ?? []).map(i => ({
            title: i.title,
            sector: i.sector ?? 'General',
            match: '95%',
            check_size: investorProfile?.check_size ?? 'N/A',
          }));
        } else {
          // For founders: top 3 new marketplace ideas published this week
          const { data: newIdeas } = await db
            .from('user_ideas')
            .select('title, sector')
            .eq('in_marketplace', true)
            .gte('created_at', weekStart.toISOString())
            .order('created_at', { ascending: false })
            .limit(3);

          topIdeas = (newIdeas ?? []).map(i => ({
            title: i.title,
            sector: i.sector ?? 'General',
            match: 'New',
            check_size: 'Various',
          }));
        }

        const ideasSection = topIdeas.length
          ? topIdeas.map(i => ideaCardHtml(i.title, i.sector, i.match ?? 'New', i.check_size ?? 'N/A')).join('')
          : '<p style="color:#9CA3AF;font-size:14px;text-align:center;padding:16px 0;">No new ideas this week — check back next Monday.</p>';

        const html = render(await resolveBody(db, 'weekly-digest', WEEKLY_DIGEST_TEMPLATE), {
          first_name: (profile.full_name ?? '').split(' ')[0] || 'there',
          week_date: weekDate,
          iq_score: String((idea as { iq_score?: number } | null)?.iq_score ?? 0),
          streak: String(profile.current_streak ?? 0),
          journey_pct: String(journeyPct),
          new_ideas_count: String(newIdeasCount ?? 0),
          matches_count: String(matchCount ?? 0),
          messages_count: String(msgCount ?? 0),
          ideas_section: ideasSection,
          dashboard_url: `${origin}/${isInvestor ? 'investor' : 'founder'}/dashboard`,
          unsubscribe_url: `${origin}/unsubscribe?token=${profile.unsubscribe_token ?? ''}`,
        });

        await sendViaResend(email, `ملخصك الأسبوعي من بذرة — ${weekDate}`, html);
        sent++;
      } catch (e) {
        console.error(`Failed for ${profile.user_id}:`, e);
      }
    }

    return jsonResp({ ok: true, sent });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
