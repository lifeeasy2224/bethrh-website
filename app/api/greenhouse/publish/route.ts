import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function calcIro(financialItems: { type: string; amount: number }[]): number {
  const totalCost = financialItems
    .filter(i => i.type === 'cost')
    .reduce((s, i) => s + (i.amount || 0), 0);
  const totalRevenue = financialItems
    .filter(i => i.type === 'revenue')
    .reduce((s, i) => s + (i.amount || 0), 0);
  if (totalCost <= 0) return 0;
  return Math.round(((totalRevenue - totalCost) / totalCost) * 100);
}

function calcBreakeven(financialItems: { type: string; amount: number }[]): number {
  const monthlyCost = financialItems
    .filter(i => i.type === 'cost')
    .reduce((s, i) => s + (i.amount || 0), 0);
  const monthlyRevenue = financialItems
    .filter(i => i.type === 'revenue')
    .reduce((s, i) => s + (i.amount || 0), 0);
  if (monthlyRevenue <= 0) return 0;
  return Math.ceil(monthlyCost / monthlyRevenue);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ideaId, brandName, logo, tagline } = await req.json();
  if (!ideaId || !brandName?.trim()) {
    return NextResponse.json({ error: 'ideaId and brandName required' }, { status: 400 });
  }

  // 1. Verify idea ownership
  const { data: idea } = await supabase
    .from('ideas')
    .select('id, sector')
    .eq('id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

  // 2. Get latest score — must be >= 75
  const { data: scoreRow } = await supabase
    .from('idea_scores')
    .select('total_score')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const score = scoreRow?.total_score ?? 0;
  if (score < 75) {
    return NextResponse.json({
      error: 'score_too_low',
      message: `النقاط الحالية ${score}/100. يجب أن تكون ٧٥ على الأقل للنشر في المشتل.`
    }, { status: 422 });
  }

  // 3. Get canvas for financial data
  const { data: canvas } = await supabase
    .from('canvas_drafts')
    .select('id, financial_items')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle();

  const financialItems: { type: string; amount: number }[] = canvas?.financial_items ?? [];
  const iro = calcIro(financialItems);
  const breakevenMonths = calcBreakeven(financialItems);
  const level = score >= 85 ? 'مثمر' : 'متجذر';

  // 4. Upsert listing
  const { data: listing, error: insertErr } = await supabase
    .from('greenhouse_listings')
    .upsert({
      idea_id: ideaId,
      canvas_id: canvas?.id ?? null,
      user_id: user.id,
      brand_name: brandName.trim(),
      logo: logo?.trim() || null,
      tagline: tagline?.trim().slice(0, 60) || null,
      sector: idea.sector ?? '',
      iro,
      breakeven_months: breakevenMonths,
      score,
      level,
      status: 'active',
      published_at: new Date().toISOString(),
    }, { onConflict: 'idea_id' })
    .select()
    .maybeSingle();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json(listing);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ideaId = new URL(req.url).searchParams.get('ideaId');
  if (!ideaId) return NextResponse.json({ error: 'ideaId required' }, { status: 400 });

  const { data } = await supabase
    .from('greenhouse_listings')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json(data ?? null);
}
