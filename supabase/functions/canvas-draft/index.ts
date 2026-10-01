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
// canvas_data. It returns a draft for the client to review and apply (same
// return-and-review pattern as extract-document → DocumentsPage Apply buttons).
const SYSTEM_PROMPT = `You draft a Business Model Canvas for an Arabic-first startup platform.
You are given the founder's real idea, validation evidence, SWOT, and any existing canvas data.

HARD RULES:
- Draft ONLY blocks the founder has NOT already filled. If a block already has content,
  return it as-is (do not overwrite, improve, or comment on it).
- Ground every drafted block on the founder's REAL data. If the founder has validation
  interviews about café owners, the customer_segments draft must reference café owners,
  not a generic "SMEs."
- NEVER invent financial numbers. If monthly_revenue, monthly_costs, or break_even_month
  are 0 or absent AND no pricing/cost data appears in the founder's evidence, return 0
  and add a note: "لم تُحدَّد بعد — استخدم أدوات بذرة لتقديرها"
- NEVER fabricate partnerships, channels, or resources the founder hasn't mentioned or
  that can't be reasonably inferred from their evidence.
- If the founder has very little data (e.g. just a title, no validation), say so honestly
  in each block rather than generating a plausible-sounding canvas from nothing.
  A sparse honest draft is better than a rich fabricated one.
- All output VALUES in Arabic (فصحى ميسّرة).
- Strictly Modern Standard Arabic (فصحى ميسّرة) — NO regional dialect (no Gulf/Saudi/Egyptian/Levantine colloquialisms). NEVER use country flag emojis.

Return ONLY a JSON object, no markdown, no preamble:
{
  "key_partners": "string",
  "key_activities": "string",
  "value_proposition": "string",
  "customer_relationships": "string",
  "customer_segments": "string",
  "key_resources": "string",
  "channels": "string",
  "cost_structure": "string",
  "revenue_streams": "string",
  "monthly_revenue": number,
  "monthly_costs": number,
  "break_even_month": number
}`;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const CANVAS_TEXT_KEYS = [
  'key_partners', 'key_activities', 'value_proposition', 'customer_relationships',
  'customer_segments', 'key_resources', 'channels', 'cost_structure', 'revenue_streams',
] as const;
const CANVAS_NUMBER_KEYS = ['monthly_revenue', 'monthly_costs', 'break_even_month'] as const;

type CanvasTextKey = typeof CANVAS_TEXT_KEYS[number];
type CanvasNumberKey = typeof CANVAS_NUMBER_KEYS[number];

interface CanvasRow {
  key_partners: string | null;
  key_activities: string | null;
  value_proposition: string | null;
  customer_relationships: string | null;
  customer_segments: string | null;
  key_resources: string | null;
  channels: string | null;
  cost_structure: string | null;
  revenue_streams: string | null;
  monthly_revenue: number | null;
  monthly_costs: number | null;
  break_even_month: number | null;
}

interface CanvasDraft {
  key_partners: string;
  key_activities: string;
  value_proposition: string;
  customer_relationships: string;
  customer_segments: string;
  key_resources: string;
  channels: string;
  cost_structure: string;
  revenue_streams: string;
  monthly_revenue: number;
  monthly_costs: number;
  break_even_month: number;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// Missing keys default to ""/0 rather than being left undefined.
function sanitizeDraft(raw: unknown): CanvasDraft {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out = {} as CanvasDraft;
  for (const k of CANVAS_TEXT_KEYS) out[k] = str(r[k]);
  for (const k of CANVAS_NUMBER_KEYS) out[k] = num(r[k]);
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const guard = await guardUser(req, 'canvas-draft', corsHeaders);
    if (guard.response) return guard.response;
    const userId = guard.userId;

    const { idea_id } = await req.json() as { idea_id?: string };
    if (!idea_id) return json({ error: 'idea_id is required' }, 400);

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Owner-scoped load — a caller can only draft a canvas for their own idea.
    const IDEA_COLS = 'title, sector, problem, solution, target_customer, differentiator, advantage, business_name, stage';
    const { data: idea, error: ideaErr } = await db.from('user_ideas')
      .select(IDEA_COLS)
      .eq('id', idea_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (ideaErr) console.error('canvas-draft: user_ideas fetch failed', ideaErr.message);
    if (!idea) return json({ error: 'الفكرة غير موجودة' }, 404);

    type ValRow = { type: string; notes: string | null; sentiment: string | null; amount: number | null; created_at: string };

    const [valEntries, canvas, swot] = await Promise.all([
      db.from('validation_entries').select('type, notes, sentiment, amount, created_at')
        .eq('user_idea_id', idea_id).order('created_at', { ascending: false }).limit(15),
      db.from('canvas_data').select('key_partners, key_activities, value_proposition, customer_relationships, customer_segments, key_resources, channels, cost_structure, revenue_streams, monthly_revenue, monthly_costs, break_even_month')
        .eq('user_idea_id', idea_id).maybeSingle(),
      db.from('swot_analyses').select('strengths, weaknesses, opportunities, threats')
        .eq('user_idea_id', idea_id).maybeSingle(),
    ]);

    if (valEntries.error) console.error('canvas-draft: validation_entries fetch failed', valEntries.error.message);
    if (canvas.error) console.error('canvas-draft: canvas_data fetch failed', canvas.error.message);
    if (swot.error) console.error('canvas-draft: swot_analyses fetch failed', swot.error.message);

    const valRows = (valEntries.data as ValRow[] | null) ?? [];
    const canvasRow = canvas.data as CanvasRow | null;
    const swotRow = swot.data as { strengths: unknown; weaknesses: unknown; opportunities: unknown; threats: unknown } | null;

    // Which of the 12 canvas fields already have real content vs are empty —
    // the model must know which blocks to draft and which to leave alone.
    const isTextFilled = (k: CanvasTextKey) => !!canvasRow && !!String(canvasRow[k] ?? '').trim();
    const isNumberFilled = (k: CanvasNumberKey) => !!canvasRow && Number(canvasRow[k] ?? 0) !== 0;
    const filledKeys: string[] = [
      ...CANVAS_TEXT_KEYS.filter(isTextFilled),
      ...CANVAS_NUMBER_KEYS.filter(isNumberFilled),
    ];
    const emptyKeys: string[] = [
      ...CANVAS_TEXT_KEYS.filter(k => !isTextFilled(k)),
      ...CANVAS_NUMBER_KEYS.filter(k => !isNumberFilled(k)),
    ];

    // ── Context digest — summarize only non-empty fields, quote validation
    //    entries by content, and state filled vs empty blocks explicitly. ──
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
      const filledText = filledKeys.map(k => {
        if ((CANVAS_NUMBER_KEYS as readonly string[]).includes(k)) return `${k}: ${canvasRow![k as CanvasNumberKey]}`;
        return `${k}: ${clip(canvasRow![k as CanvasTextKey], 300)}`;
      }).join('؛ ');
      digest.push(`الكتل الممتلئة بالفعل (أعدها كما هي بدون تعديل): ${filledText}`);
    }
    digest.push(`الكتل الفارغة (يجب صياغتها الآن): ${emptyKeys.length ? emptyKeys.join('، ') : 'لا توجد — كل الكتل ممتلئة بالفعل'}`);

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
      console.error('canvas-draft: model output failed to parse as JSON', raw.slice(0, 500));
      return json({ error: 'تعذّر إنشاء المسودة' }, 500);
    }

    const draft = sanitizeDraft(parsed);

    // Defense in depth: never let a filled block be overwritten, regardless of
    // whether the model honored the instruction — restore the founder's own
    // value for any block that already had content before this call.
    for (const k of CANVAS_TEXT_KEYS) if (isTextFilled(k)) draft[k] = String(canvasRow![k] ?? '');
    for (const k of CANVAS_NUMBER_KEYS) if (isNumberFilled(k)) draft[k] = Number(canvasRow![k] ?? 0);

    return json({
      draft,
      idea_id,
      blocks_drafted: emptyKeys,
      blocks_kept: filledKeys,
    }, 200);
  } catch (err) {
    console.error('canvas-draft: unhandled error', (err as Error).message);
    return json({ error: (err as Error).message }, 500);
  }
});
