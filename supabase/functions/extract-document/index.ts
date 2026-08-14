import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { PDFDocument } from 'npm:pdf-lib';
import { encodeBase64 } from 'jsr:@std/encoding/base64';
import { guardUser } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const BUCKET = 'idea-documents';
const MAX_PAGES = 5;

// Anti-fabrication is the whole point: extract only what's actually in the
// document, translate faithfully into Arabic, and leave everything else at
// its empty default rather than guess. This is a PROPOSAL only — the caller
// (DocumentsPage) reviews and applies each pillar; this function never writes
// to user_ideas/canvas_data/validation_entries/swot_analyses itself.
const SYSTEM = `You extract structured startup data from an uploaded document for an Arabic-first platform.
HARD RULES:
- Extract ONLY information explicitly stated in the document. Never infer, invent, embellish,
  or add plausible-sounding content. This is an anti-fabrication requirement.
- If a field is not addressed in the document, return "" (string), [] (array), or 0 (number).
  An empty field is correct and expected — do not fill it to look complete.
- Output all VALUES in Modern Standard Arabic (فصحى ميسّرة). If the source is English, translate
  faithfully without adding meaning.
- validation[]: include an entry ONLY if the document describes real evidence (an actual interview,
  preorder, signup, or observation). amount = money actually committed (0 if none). Never fabricate.
- financials: fill only if explicit numbers appear in the document; otherwise 0.
Return ONLY a JSON object matching this exact shape, no markdown, no preamble:
{idea:{title,sector,problem,solution,target_customer,differentiator,advantage},
 canvas:{key_partners,key_activities,value_proposition,customer_relationships,customer_segments,
         key_resources,channels,cost_structure,revenue_streams},
 financials:{monthly_revenue,monthly_costs,break_even_month},
 swot:{strengths:[],weaknesses:[],opportunities:[],threats:[]},
 validation:[{type,notes,amount,sentiment}]}
Enum clamps: validation.type ∈ interview|preorder|signup|observation|other;
validation.sentiment ∈ positive|neutral|negative. Coerce all money/month fields to numbers.`;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

interface ExtractedValidation { type: string; notes: string; amount: number; sentiment: string }
interface Extraction {
  idea: { title: string; sector: string; problem: string; solution: string; target_customer: string; differentiator: string; advantage: string };
  canvas: {
    key_partners: string; key_activities: string; value_proposition: string; customer_relationships: string;
    customer_segments: string; key_resources: string; channels: string; cost_structure: string; revenue_streams: string;
  };
  financials: { monthly_revenue: number; monthly_costs: number; break_even_month: number };
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  validation: ExtractedValidation[];
}

const VALIDATION_TYPES = new Set(['interview', 'preorder', 'signup', 'observation', 'other']);
const SENTIMENTS = new Set(['positive', 'neutral', 'negative']);

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
function clampEnum(v: unknown, allowed: Set<string>, fallback: string): string {
  const s = String(v ?? '').toLowerCase().trim();
  return allowed.has(s) ? s : fallback;
}

// Builds a complete, shape-safe Extraction from whatever the model returned —
// missing keys default to ""/[]/0 rather than being left undefined, and enum
// fields are clamped to their allowed set.
function sanitizeExtraction(raw: unknown): Extraction {
  const r = (raw ?? {}) as Record<string, unknown>;
  const idea = (r.idea ?? {}) as Record<string, unknown>;
  const canvas = (r.canvas ?? {}) as Record<string, unknown>;
  const financials = (r.financials ?? {}) as Record<string, unknown>;
  const swot = (r.swot ?? {}) as Record<string, unknown>;
  const validationRaw = Array.isArray(r.validation) ? r.validation : [];

  return {
    idea: {
      title: str(idea.title),
      sector: str(idea.sector),
      problem: str(idea.problem),
      solution: str(idea.solution),
      target_customer: str(idea.target_customer),
      differentiator: str(idea.differentiator),
      advantage: str(idea.advantage),
    },
    canvas: {
      key_partners: str(canvas.key_partners),
      key_activities: str(canvas.key_activities),
      value_proposition: str(canvas.value_proposition),
      customer_relationships: str(canvas.customer_relationships),
      customer_segments: str(canvas.customer_segments),
      key_resources: str(canvas.key_resources),
      channels: str(canvas.channels),
      cost_structure: str(canvas.cost_structure),
      revenue_streams: str(canvas.revenue_streams),
    },
    financials: {
      monthly_revenue: num(financials.monthly_revenue),
      monthly_costs: num(financials.monthly_costs),
      break_even_month: num(financials.break_even_month),
    },
    swot: {
      strengths: arr(swot.strengths),
      weaknesses: arr(swot.weaknesses),
      opportunities: arr(swot.opportunities),
      threats: arr(swot.threats),
    },
    validation: validationRaw.map((v) => {
      const vv = (v ?? {}) as Record<string, unknown>;
      return {
        type: clampEnum(vv.type, VALIDATION_TYPES, 'other'),
        notes: str(vv.notes),
        amount: num(vv.amount),
        sentiment: clampEnum(vv.sentiment, SENTIMENTS, 'neutral'),
      };
    }),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const guard = await guardUser(req, 'extract-document', corsHeaders);
    if (guard.response) return guard.response;
    const userId = guard.userId;

    const { document_id } = await req.json() as { document_id?: string };
    if (!document_id) return json({ error: 'document_id is required' }, 400);

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Owner-scoped load — a caller can only extract their own document.
    const { data: doc } = await db.from('idea_documents')
      .select('*')
      .eq('id', document_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (!doc) return json({ error: 'الملف غير موجود' }, 404);

    const row = doc as Record<string, unknown>;

    // Idempotency — an already-extracted document returns its cached result
    // instead of spending another model call.
    if (row.status === 'extracted' && row.extraction) {
      return json(row.extraction, 200);
    }

    const { data: blob, error: dlErr } = await db.storage.from(BUCKET).download(row.file_path as string);
    if (dlErr || !blob) return json({ error: 'تعذّرت قراءة الملف' }, 500);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    // Page-count gate (authoritative) — before any model call is spent.
    let pageCount = 0;
    try {
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pageCount = pdf.getPageCount();
    } catch {
      const msg = 'تعذّر قراءة الملف كملف PDF صالح';
      await db.from('idea_documents').update({ status: 'failed', error: msg }).eq('id', document_id);
      return json({ error: msg }, 400);
    }

    if (pageCount > MAX_PAGES) {
      const msg = 'الملف يتجاوز الحد الأقصى وهو 5 صفحات';
      await db.from('idea_documents').update({ status: 'failed', error: msg }).eq('id', document_id);
      return json({ error: msg }, 400);
    }

    await db.from('idea_documents').update({ status: 'processing', error: null }).eq('id', document_id);

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
    const completion = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: encodeBase64(bytes) } },
          { type: 'text', text: 'استخرج بيانات هذا المستند الآن وفق البنية المطلوبة تماماً، بالعربية الفصحى الميسّرة.' },
        ],
      }],
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
      const msg = 'تعذّر تحليل المستند';
      await db.from('idea_documents').update({ status: 'failed', error: msg, page_count: pageCount }).eq('id', document_id);
      return json({ error: msg }, 500);
    }

    const extraction = sanitizeExtraction(parsed);

    await db.from('idea_documents').update({
      extraction,
      page_count: pageCount,
      status: 'extracted',
      extracted_at: new Date().toISOString(),
      error: null,
    }).eq('id', document_id);

    return json(extraction, 200);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
