import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Benchmark data per sector/country
const BENCHMARKS: Record<string, Record<string, number>> = {
  'Agri-Food':  { Syria: 54, Jordan: 61, Palestine: 55, default: 58 },
  'Agri-Tech':  { Syria: 48, Jordan: 62, Palestine: 50, default: 55 },
  'Services':   { Syria: 60, Jordan: 65, Palestine: 62, default: 62 },
  'Export':     { Syria: 52, Jordan: 68, Palestine: 56, default: 60 },
  default:      { default: 58 },
};

function getBenchmark(sector: string | null, country: string | null): number {
  const sectorData = BENCHMARKS[sector ?? ''] ?? BENCHMARKS.default;
  return sectorData[country ?? ''] ?? sectorData.default ?? 58;
}

function ruleBasedScore(idea: {
  title: string | null;
  description: string | null;
  validation_score: number;
  sector: string | null;
}, tasks: { status: string }[], logs: { interviews: number; signups: number; preorders_usd: number }[]) {
  const desc = (idea.description ?? '').trim();
  const title = (idea.title ?? '').trim();

  // Value (0-20): description quality
  const valueScore = Math.min(20,
    (desc.length > 150 ? 12 : desc.length > 60 ? 8 : 4) +
    (title.length > 10 ? 4 : 2) +
    (idea.sector ? 4 : 0)
  );

  // Market (0-20): validation score proxy
  const marketScore = Math.min(20, Math.round(idea.validation_score * 0.20));

  // Validation (0-20): interviews + signups + preorders
  const totalInterviews = logs.reduce((s, l) => s + (l.interviews || 0), 0);
  const totalSignups = logs.reduce((s, l) => s + (l.signups || 0), 0);
  const totalRevenue = logs.reduce((s, l) => s + (l.preorders_usd || 0), 0);
  const validationScore = Math.min(20,
    Math.min(8, Math.round(totalInterviews / 2)) +
    Math.min(6, Math.round(totalSignups / 2)) +
    Math.min(6, totalRevenue > 0 ? 6 : 0)
  );

  // Feasibility (0-20): tasks completion
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const pct = totalTasks > 0 ? doneTasks / totalTasks : 0;
  const feasibilityScore = Math.min(20, Math.round(pct * 20));

  // Pitch (0-10): description structure
  const pitchScore = Math.min(10,
    (desc.length > 200 ? 5 : desc.length > 80 ? 3 : 1) +
    (title.length > 8 ? 3 : 1) +
    (idea.sector ? 2 : 0)
  );

  // Journey (0-10): tasks pct bonus
  const journeyScore = Math.min(10, Math.round(pct * 10));

  const total = valueScore + marketScore + validationScore + feasibilityScore + pitchScore + journeyScore;

  return { valueScore, marketScore, validationScore, feasibilityScore, pitchScore, journeyScore, total };
}

function buildRecommendations(scores: ReturnType<typeof ruleBasedScore>, total: number): string[] {
  const recs: string[] = [];
  if (scores.valueScore < 12) recs.push('اكتب وصفاً أكثر تفصيلاً يشرح المشكلة والحل بوضوح.');
  if (scores.marketScore < 10) recs.push('عزز نقاط التحقق بإجراء المزيد من مقابلات العملاء.');
  if (scores.validationScore < 10) recs.push('سجّل نتائج مقابلاتك وتسجيلاتك في صفحة التحقق.');
  if (scores.feasibilityScore < 12) recs.push('أكمل مهام مشوار الـ ٩٠ يوماً لرفع نقاط قابلية التنفيذ.');
  if (scores.pitchScore < 6) recs.push('طوّر عرضك التقديمي بإضافة أرقام وبيانات ملموسة.');
  if (total >= 80) recs.push('ممتاز! فكرتك جاهزة لعرضها على المستثمرين.');
  else if (total >= 60) recs.push('أنت على المسار الصحيح. أكمل نقاط الضعف للوصول لمستوى التمويل.');
  return recs;
}

async function scoreWithGPT(idea: { title: string | null; description: string | null; sector: string | null }, baseScores: ReturnType<typeof ruleBasedScore>): Promise<{ summary: string; adjusted: Partial<typeof baseScores> }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: `فكرة "${idea.title}" تُقيّم على أساس القيمة المقدمة، حجم السوق، التحقق الميداني، قابلية التنفيذ، وجودة العرض. التحسين المستمر للنموذج هو مفتاح الوصول لمرحلة التمويل.`,
      adjusted: {},
    };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: 'أنت مقيّم متخصص في ريادة الأعمال. قيّم الفكرة وأعط ملخصاً عربياً موجزاً (جملتان) وتعديلات على النقاط بصيغة JSON فقط.',
          },
          {
            role: 'user',
            content: `الفكرة: ${idea.title}\nالوصف: ${idea.description}\nالقطاع: ${idea.sector}\nالنقاط الحالية: ${JSON.stringify(baseScores)}\nأجب بـ JSON فقط: {"summary":"...","value_adj":0,"market_adj":0,"pitch_adj":0}`,
          },
        ],
      }),
    });
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    return {
      summary: parsed.summary ?? '',
      adjusted: {
        valueScore: Math.min(20, Math.max(0, baseScores.valueScore + (parsed.value_adj ?? 0))),
        marketScore: Math.min(20, Math.max(0, baseScores.marketScore + (parsed.market_adj ?? 0))),
        pitchScore: Math.min(10, Math.max(0, baseScores.pitchScore + (parsed.pitch_adj ?? 0))),
      },
    };
  } catch {
    return { summary: '', adjusted: {} };
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ideaId } = await req.json();
  if (!ideaId) return NextResponse.json({ error: 'ideaId required' }, { status: 400 });

  // Fetch idea
  const { data: idea } = await supabase
    .from('ideas').select('*').eq('id', ideaId).eq('user_id', user.id).maybeSingle();
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

  // Fetch tasks and validation logs
  const [{ data: tasks }, { data: logs }, { data: userProfile }] = await Promise.all([
    supabase.from('tasks').select('status').eq('idea_id', ideaId),
    supabase.from('validation_logs').select('interviews, signups, preorders_usd').eq('idea_id', ideaId),
    supabase.from('users').select('country').eq('id', user.id).maybeSingle(),
  ]);

  const country = userProfile?.country ?? null;
  const base = ruleBasedScore(idea, tasks ?? [], logs ?? []);

  // GPT adjustment
  const { summary, adjusted } = await scoreWithGPT(idea, base);
  const final = { ...base, ...adjusted };
  const total = (final.valueScore ?? base.valueScore) +
    (final.marketScore ?? base.marketScore) +
    (final.validationScore ?? base.validationScore) +
    (final.feasibilityScore ?? base.feasibilityScore) +
    (final.pitchScore ?? base.pitchScore) +
    (final.journeyScore ?? base.journeyScore);

  const benchmarkAvg = getBenchmark(idea.sector, country);

  // Get version
  const { data: prevScores } = await supabase
    .from('idea_scores')
    .select('version')
    .eq('idea_id', ideaId)
    .order('version', { ascending: false })
    .limit(1);
  const version = (prevScores?.[0]?.version ?? 0) + 1;

  const recs = buildRecommendations(final as typeof base, total);

  const { data: inserted, error: insertErr } = await supabase
    .from('idea_scores')
    .insert({
      idea_id: ideaId,
      user_id: user.id,
      total_score: total,
      value_score: final.valueScore ?? base.valueScore,
      market_score: final.marketScore ?? base.marketScore,
      validation_score: final.validationScore ?? base.validationScore,
      feasibility_score: final.feasibilityScore ?? base.feasibilityScore,
      pitch_score: final.pitchScore ?? base.pitchScore,
      journey_score: final.journeyScore ?? base.journeyScore,
      benchmark_sector: idea.sector ?? '',
      benchmark_country: country ?? '',
      benchmark_avg: benchmarkAvg,
      recommendations: recs,
      gpt_summary: summary,
      version,
    })
    .select()
    .maybeSingle();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json(inserted);
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
    .from('idea_scores')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json(data ?? null);
}
