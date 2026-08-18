import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { guardUser } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// NON-DESTRUCTIVE: this function only ever READS. It never writes to
// pitch_data. It returns a draft for the client to review and apply (same
// return-and-review pattern as canvas-draft / extract-document).
const SYSTEM_PROMPT = `You draft a Funding Pitch for an Arabic-first startup platform.
You are given the founder's real idea, validation evidence, SWOT, canvas, and any existing
pitch content.

HARD RULES:
- Draft ONLY pitch fields the founder has NOT already filled. If a field already has content,
  return it as-is.
- Ground every section on the founder's REAL data. Reference their actual validation evidence
  (interviews, preorders, signups) by content, not generically.
- NEVER invent financial projections. If the founder has no revenue/cost data in their canvas
  or validation evidence:
    * For revenue_model: state what pricing the founder has set (if any) or say
      "لم يُحدَّد نموذج الإيراد بعد"
    * For break_even_summary: say "لا تتوفر بيانات مالية كافية لتقدير نقطة التعادل"
    * For investment_amount: say "لم يُحدَّد المبلغ المطلوب بعد"
    * NEVER generate a plausible ROI, revenue forecast, or break-even estimate from nothing.
      Any ROI claim without real data would be fabricated.
- elevator_pitch must be 2-3 sentences max, grounded in the real problem/solution.
- If the founder has very little data, produce a sparse honest draft and flag what's missing
  rather than filling gaps with plausible fiction.
- All output VALUES in Arabic (فصحى ميسّرة).

Return ONLY a JSON object, no markdown, no preamble:
{
  "elevator_pitch": "string",
  "pitch_problem": "string",
  "pitch_solution": "string",
  "target_market": "string",
  "revenue_model": "string",
  "break_even_summary": "string",
  "investment_amount": "string",
  "use_of_funds": "string"
}`;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const PITCH_KEYS = [
  'elevator_pitch', 'pitch_problem', 'pitch_solution', 'target_market',
  'revenue_model', 'break_even_summary', 'investment_amount', 'use_of_funds',
] as const;
type PitchKey = typeof PITCH_KEYS[number];

type PitchRow = Record<PitchKey, string | number | null>;
type PitchDraft = Record<PitchKey, string>;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

// Missing keys default to "" rather than being left undefined.
function sanitizeDraft(raw: unknown): PitchDraft {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out = {} as PitchDraft;
  for (const k of PITCH_KEYS) out[k] = str(r[k]);
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const guard = await guardUser(req, 'pitch-draft', corsHeaders);
    if (guard.response) return guard.response;
    const userId = guard.userId;

    const { idea_id } = await req.json() as { idea_id?: string };
    if (!idea_id) return json({ error: 'idea_id is required' }, 400);

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Owner-scoped load — a caller can only draft a pitch for their own idea.
    const IDEA_COLS = 'title, sector, problem, solution, target_customer, differentiator, advantage, business_name, stage, iq_score';
    const { data: idea, error: ideaErr } = await db.from('user_ideas')
      .select(IDEA_COLS)
      .eq('id', idea_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (ideaErr) console.error('pitch-draft: user_ideas fetch failed', ideaErr.message);
    if (!idea) return json({ error: 'الفكرة غير موجودة' }, 404);

    type ValRow = { type: string; notes: string | null; sentiment: string | null; amount: number | null; created_at: string };

    const [valEntries, canvas, swot, pitch] = await Promise.all([
      db.from('validation_entries').select('type, notes, sentiment, amount, created_at')
        .eq('user_idea_id', idea_id).order('created_at', { ascending: false }).limit(15),
      db.from('canvas_data').select('key_partners, key_activities, value_proposition, customer_relationships, customer_segments, key_resources, channels, cost_structure, revenue_streams, monthly_revenue, monthly_costs, break_even_month')
        .eq('user_idea_id', idea_id).maybeSingle(),
      db.from('swot_analyses').select('strengths, weaknesses, opportunities, threats')
        .eq('user_idea_id', idea_id).maybeSingle(),
      db.from('pitch_data').select('elevator_pitch, pitch_problem, pitch_solution, target_market, revenue_model, break_even_summary, investment_amount, use_of_funds')
        .eq('user_idea_id', idea_id).maybeSingle(),
    ]);

    if (valEntries.error) console.error('pitch-draft: validation_entries fetch failed', valEntries.error.message);
    if (canvas.error) console.error('pitch-draft: canvas_data fetch failed', canvas.error.message);
    if (swot.error) console.error('pitch-draft: swot_analyses fetch failed', swot.error.message);
    if (pitch.error) console.error('pitch-draft: pitch_data fetch failed', pitch.error.message);

    const valRows = (valEntries.data as ValRow[] | null) ?? [];
    const canvasRow = canvas.data as Record<string, unknown> | null;
    const swotRow = swot.data as { strengths: unknown; weaknesses: unknown; opportunities: unknown; threats: unknown } | null;
    const pitchRow = pitch.data as PitchRow | null;

    // Which of the 8 pitch fields already have real content vs are empty —
    // the model must know which fields to draft and which to leave alone.
    const isFilled = (k: PitchKey) => {
      if (!pitchRow) return false;
      const v = pitchRow[k];
      return v !== null && v !== undefined && String(v).trim() !== '' && v !== 0;
    };
    const filledKeys: string[] = PITCH_KEYS.filter(isFilled);
    const emptyKeys: string[] = PITCH_KEYS.filter(k => !isFilled(k));

    // ── Context digest — summarize only non-empty fields, quote validation
    //    entries by content, and state filled vs empty fields explicitly. ──
    const clip = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n);
    const digest: string[] = [];

    const ideaRow = idea as Record<string, unknown>;
    digest.push(`فكرة المؤسس: "${ideaRow.title || 'بدون عنوان'}". القطاع: ${ideaRow.sector || 'غير محدد'}. المرحلة: ${ideaRow.stage || 'غير محددة'}.`);
    if (ideaRow.business_name) digest.push(`اسم المشروع: ${ideaRow.business_name}.`);
    if (ideaRow.problem) digest.push(`المشكلة: ${clip(ideaRow.problem, 400)}`);
    if (ideaRow.solution) digest.push(`الحل: ${clip(ideaRow.solution, 400)}`);
    if (ideaRow.target_customer) digest.push(`العميل المستهدف: ${clip(ideaRow.target_customer, 300)}`);
    if (ideaRow.differentiator) digest.push(`الميزة التنافسية: ${clip(ideaRow.differentiator, 300)}`);
    if (ideaRow.advantage) digest.push(`الأفضلية غير العادلة: ${clip(ideaRow.advantage, 300)}`);
    if (ideaRow.iq_score != null) digest.push(`درجة IQ Score الحالية: ${ideaRow.iq_score}/100.`);

    if (valRows.length) {
      const TYPE_LABEL: Record<string, string> = {
        interview: 'مقابلة', signup: 'تسجيل', preorder: 'طلب مسبق',
        observation: 'ملاحظة', other: 'ملاحظة عامة', stress_test: 'اختبار ضغط بالذكاء الاصطناعي',
      };
      const lines = valRows.map(v => {
        const label = TYPE_LABEL[v.type] ?? v.type;
        const sent = v.sentiment ? `، ${v.sentiment}` : '';
        const amt = v.type === 'preorder' && Number(v.amount) > 0 ? `، ${v.amount}$` : '';
        return `[${label}${sent}${amt}] ${clip(v.notes, 240)}`;
      });
      digest.push(`أدلة التحقق — ${valRows.length} إدخال (الأحدث أولاً)، استشهد بمحتواها فعلياً:\n  - ${lines.join('\n  - ')}`);
    } else {
      digest.push('أدلة التحقق: لا توجد أي إدخالات تحقق مسجّلة بعد.');
    }

    // Generic serializer for fixed-shape rows: only non-empty/non-zero fields.
    const summarize = (row: Record<string, unknown> | null, perField = 220, max = 1800) => {
      if (!row) return '';
      return Object.entries(row)
        .filter(([, v]) => v !== null && v !== '' && v !== 0)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v).trim().slice(0, perField)}`)
        .join('؛ ')
        .slice(0, max);
    };

    const canvasText = summarize(canvasRow);
    if (canvasText) digest.push(`مخطط النموذج التجاري والتوقعات المالية (بكلمات المؤسس): ${canvasText}`);
    else digest.push('مخطط النموذج التجاري: لا توجد بيانات مسجّلة بعد.');

    if (swotRow) {
      const listify = (v: unknown) => Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()).join('، ') : '';
      const parts = [
        listify(swotRow.strengths) && `نقاط القوة: ${listify(swotRow.strengths)}`,
        listify(swotRow.weaknesses) && `نقاط الضعف: ${listify(swotRow.weaknesses)}`,
        listify(swotRow.opportunities) && `الفرص: ${listify(swotRow.opportunities)}`,
        listify(swotRow.threats) && `التهديدات: ${listify(swotRow.threats)}`,
      ].filter(Boolean).join('؛ ');
      if (parts) digest.push(`تحليل SWOT: ${parts.slice(0, 1800)}`);
    }

    if (filledKeys.length) {
      const filledText = filledKeys.map(k => `${k}: ${clip(pitchRow![k as PitchKey], 300)}`).join('؛ ');
      digest.push(`حقول العرض التمويلي الممتلئة بالفعل (أعدها كما هي بدون تعديل): ${filledText}`);
    }
    digest.push(`حقول العرض التمويلي الفارغة (يجب صياغتها الآن): ${emptyKeys.length ? emptyKeys.join('، ') : 'لا توجد — كل الحقول ممتلئة بالفعل'}`);

    const contextDigest = digest.join('\n\n');

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
    const completion = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextDigest }],
    });

    let raw = '';
    for (const block of completion.content) { if (block.type === 'text') raw += block.text; }
    raw = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch { parsed = null; }
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('pitch-draft: model output failed to parse as JSON', raw.slice(0, 500));
      return json({ error: 'تعذّر إنشاء المسودة' }, 500);
    }

    const draft = sanitizeDraft(parsed);

    // Defense in depth: never let a filled field be overwritten, regardless of
    // whether the model honored the instruction — restore the founder's own
    // value for any field that already had content before this call.
    for (const k of PITCH_KEYS) if (isFilled(k)) draft[k] = String(pitchRow![k] ?? '');

    return json({
      draft,
      idea_id,
      fields_drafted: emptyKeys,
      fields_kept: filledKeys,
    }, 200);
  } catch (err) {
    console.error('pitch-draft: unhandled error', (err as Error).message);
    return json({ error: (err as Error).message }, 500);
  }
});
