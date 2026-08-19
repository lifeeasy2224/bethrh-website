import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { guardUser } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// The 12-week backbone is FIXED — this function only adds a non-destructive
// adaptive recommendation layer on top of it. It never writes to journey_tasks.
const SYSTEM_PROMPT = `You advise a founder on their 90-day journey on an Arabic-first startup platform.
You see: their idea, validation evidence, journey progress, and a deterministic
unlock recommendation.

RULES:
- Explain WHY certain weeks are recommended next, grounded in their real evidence.
- If they have strong committed signals (preorders with real money), explain that
  revenue-focused weeks make sense because they have real demand to build on.
- If they have only interviews/observations, recommend staying on the validation track
  (don't skip ahead to revenue planning without evidence of willingness to pay).
- Be honest about gaps: "لديك مقابلات لكن بدون دفع فعلي — ركّز على تحويل الاهتمام
  إلى التزام مالي قبل الانتقال لأسابيع الإيرادات"
- 3-5 sentences. Practical, not motivational.
- All output in Arabic (فصحى ميسّرة).

Return ONLY the rationale text, no JSON, no markdown fences.`;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

type UnlockReason = 'strong_signals' | 'moderate_signals' | 'standard';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const guard = await guardUser(req, 'journey-plan', corsHeaders);
    if (guard.response) return guard.response;
    const userId = guard.userId;

    const { idea_id } = await req.json() as { idea_id?: string };
    if (!idea_id) return json({ error: 'idea_id is required' }, 400);

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Owner-scoped load — a caller can only plan their own idea's journey.
    const { data: idea, error: ideaErr } = await db.from('user_ideas')
      .select('title, problem, solution, target_customer, stage, iq_score')
      .eq('id', idea_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (ideaErr) console.error('journey-plan: user_ideas fetch failed', ideaErr.message);
    if (!idea) return json({ error: 'الفكرة غير موجودة' }, 404);

    type ValRow = { type: string; notes: string | null; sentiment: string | null; amount: number | null; created_at: string };
    type TaskRow = { week_number: number; task_key: string; is_completed: boolean };

    const [valEntries, tasks, canvas] = await Promise.all([
      db.from('validation_entries').select('type, notes, sentiment, amount, created_at')
        .eq('user_idea_id', idea_id).order('created_at', { ascending: false }).limit(15),
      db.from('journey_tasks').select('week_number, task_key, is_completed')
        .eq('user_idea_id', idea_id),
      db.from('canvas_data').select('value_proposition, customer_segments, revenue_streams, monthly_revenue, monthly_costs')
        .eq('user_idea_id', idea_id).maybeSingle(),
    ]);

    if (valEntries.error) console.error('journey-plan: validation_entries fetch failed', valEntries.error.message);
    if (tasks.error) console.error('journey-plan: journey_tasks fetch failed', tasks.error.message);
    if (canvas.error) console.error('journey-plan: canvas_data fetch failed', canvas.error.message);

    const valRows = (valEntries.data as ValRow[] | null) ?? [];
    const taskRows = (tasks.data as TaskRow[] | null) ?? [];
    const canvasRow = canvas.data as Record<string, unknown> | null;

    // ── Journey progress ──
    const completedWeeks = taskRows.filter(t => t.is_completed).map(t => t.week_number);
    const currentWeek = completedWeeks.length ? Math.max(...completedWeeks) : 1;
    const completedCount = taskRows.filter(t => t.is_completed).length;
    const totalTasks = taskRows.length;

    // ── Deterministic unlock logic — rules, not AI ──
    const strongSignals = valRows.filter(v =>
      (v.type === 'preorder' && Number(v.amount) > 0) || v.type === 'signup',
    ).length;
    const moderateSignals = valRows.filter(v =>
      v.type === 'interview' && v.sentiment === 'positive',
    ).length;

    let recommendedWeeks: number[];
    let unlockReason: UnlockReason;
    if (strongSignals >= 3) {
      recommendedWeeks = [7, 8, 9];
      unlockReason = 'strong_signals';
    } else if (strongSignals >= 1 && moderateSignals >= 5) {
      recommendedWeeks = [5, 6];
      unlockReason = 'moderate_signals';
    } else {
      recommendedWeeks = [currentWeek + 1 <= 12 ? currentWeek + 1 : currentWeek];
      unlockReason = 'standard';
    }

    // ── Context digest for the model ──
    const clip = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n);
    const digest: string[] = [];

    const ideaRow = idea as Record<string, unknown>;
    digest.push(`فكرة المؤسس: "${ideaRow.title || 'بدون عنوان'}". المرحلة: ${ideaRow.stage || 'غير محددة'}.`);
    if (ideaRow.problem) digest.push(`المشكلة: ${clip(ideaRow.problem, 300)}`);
    if (ideaRow.solution) digest.push(`الحل: ${clip(ideaRow.solution, 300)}`);
    if (ideaRow.target_customer) digest.push(`العميل المستهدف: ${clip(ideaRow.target_customer, 250)}`);
    if (ideaRow.iq_score != null) digest.push(`درجة IQ Score الحالية: ${ideaRow.iq_score}/100.`);

    if (valRows.length) {
      const TYPE_LABEL: Record<string, string> = {
        interview: 'مقابلة', signup: 'تسجيل', preorder: 'طلب مسبق',
        observation: 'ملاحظة', other: 'ملاحظة عامة', stress_test: 'اختبار ضغط بالذكاء الاصطناعي',
      };
      const lines = valRows.map(v => {
        const label = TYPE_LABEL[v.type] ?? v.type;
        const sent = v.sentiment ? `، ${v.sentiment}` : '';
        const amt = Number(v.amount) > 0 ? `، $${v.amount}` : '';
        return `[${label}${sent}${amt}] ${clip(v.notes, 200)}`;
      });
      digest.push(`أدلة التحقق — ${valRows.length} إدخال (الأحدث أولاً):\n  - ${lines.join('\n  - ')}`);
    } else {
      digest.push('أدلة التحقق: لا توجد أي إدخالات تحقق مسجّلة بعد.');
    }
    digest.push(`إشارات قوية (طلب مسبق مدفوع أو تسجيل): ${strongSignals}. إشارات متوسطة (مقابلات إيجابية): ${moderateSignals}.`);

    const canvasText = canvasRow
      ? Object.entries(canvasRow)
        .filter(([, v]) => v !== null && v !== '' && v !== 0)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${clip(v, 200)}`)
        .join('؛ ')
      : '';
    digest.push(canvasText ? `مخطط النموذج التجاري (جزئي): ${canvasText}` : 'مخطط النموذج التجاري: لا توجد بيانات مسجّلة بعد.');

    digest.push(`التقدم في الرحلة: الأسبوع الحالي ${currentWeek} من ١٢. مهام مكتملة: ${completedCount} من ${totalTasks}.`);
    digest.push(`التوصية الحتمية (محسوبة بقواعد ثابتة، ليست من الذكاء الاصطناعي): ${unlockReason === 'strong_signals' ? 'فتح أسابيع الإيرادات ٧-٩ مبكراً' : unlockReason === 'moderate_signals' ? 'فتح أسابيع ٥-٦ مبكراً' : 'الاستمرار بالترتيب القياسي للأسابيع'}. الأسابيع الموصى بها: ${recommendedWeeks.join('، ')}.`);

    const contextDigest = digest.join('\n\n');

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextDigest }],
    });

    let rationale = '';
    for (const block of completion.content) { if (block.type === 'text') rationale += block.text; }
    rationale = rationale.trim();

    if (!rationale) {
      console.error('journey-plan: model returned empty text');
      return json({ error: 'تعذّر إنشاء التوصية' }, 500);
    }

    return json({
      current_week: currentWeek,
      completed_count: completedCount,
      total_tasks: totalTasks,
      recommended_weeks: recommendedWeeks,
      unlock_reason: unlockReason,
      rationale,
    }, 200);
  } catch (err) {
    console.error('journey-plan: unhandled error', (err as Error).message);
    return json({ error: (err as Error).message }, 500);
  }
});
