import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { guardUser } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// The AI-Coach readiness assessment: the 15-point AI component of the Bethra
// Score. Deliberately hard to impress and honest — it rates how much VALIDATED
// readiness the founder's REAL data shows, not how exciting the idea sounds.
// Same "honest, not a cheerleader" bar as the Coach itself. Rubric body stays
// English (translating it risks softening the bluntness); only the founder-
// facing rationale output is mandated Arabic — same split ai-coach and
// idea-stress-test already use.
const RUBRIC = `You are the Bethra readiness assessor. You are hard to impress and scrupulously honest — your job is to protect this founder from false confidence, not to flatter them.

Given the founder's REAL data below, rate how much VALIDATED READINESS the evidence actually shows — NOT how exciting the idea sounds — on a 0 to 15 integer scale:
- 0-3: just an idea, or only friends/family enthusiasm, or "would use it" future-tense talk. No real market signal.
- 4-7: some genuine signal from REAL potential customers (interviews about real past behavior, honest observations).
- 8-11: repeated real signals, including sign-ups, or strong evidence of a painful problem people already pay to solve.
- 12-15: real paid demand — pre-orders, deposits, paying customers or equivalent hard commitment — and repeatable.

Rules:
- Weight paid/committed evidence far above stated intent. "I'd totally use it" is a polite no, not a signal.
- Penalize thin evidence, hype words, and saturated-market ideas that show no differentiation.
- Judge only the evidence provided. Never invent facts, numbers, or competitors. Empty sections mean that work isn't done — score accordingly, don't assume.

Respond with ONLY a minified JSON object and nothing else: {"score": <integer 0-15>, "rationale": "<one honest sentence IN ARABIC (فصحى ميسّرة), max 180 chars, addressed to the founder>"}`;

function clip(s: unknown, n: number): string {
  return String(s ?? '').trim().slice(0, n);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const guard = await guardUser(req, 'assess-idea', corsHeaders);
    if (guard.response) return guard.response;
    const userId = guard.userId;

    const { idea_id } = await req.json() as { idea_id?: string };
    if (!idea_id) {
      return new Response(JSON.stringify({ error: 'idea_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Owner check — only assess the caller's own idea.
    // Bethra's user_ideas has no validation_score/validation_answers columns
    // (deliberately — see lib/pendingIdea.ts's top comment); IdeaIQ's SELECT
    // included them, ported without those two fields.
    const { data: idea, error: ideaErr } = await db.from('user_ideas')
      .select('id, title, problem, solution, sector, target_customer')
      .eq('id', idea_id).eq('user_id', userId).maybeSingle();
    if (ideaErr || !idea) {
      return new Response(JSON.stringify({ error: ideaErr?.message ?? 'Idea not found' }), { status: ideaErr ? 500 : 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const [valRes, canvasRes, swotRes, pitchRes, tasksRes] = await Promise.all([
      db.from('validation_entries').select('type, notes, sentiment, amount').eq('user_idea_id', idea_id),
      db.from('canvas_data').select('*').eq('user_idea_id', idea_id).maybeSingle(),
      db.from('swot_analyses').select('id', { count: 'exact', head: true }).eq('user_idea_id', idea_id),
      db.from('pitch_data').select('id', { count: 'exact', head: true }).eq('user_idea_id', idea_id),
      db.from('journey_tasks').select('id', { count: 'exact', head: true }).eq('user_idea_id', idea_id).eq('is_completed', true),
    ]);

    // Real customer signals only (exclude the AI stress-test audit rows).
    const entries = ((valRes.data as Array<{ type: string | null; notes: string | null; sentiment: string | null; amount: number | null }> | null) ?? [])
      .filter(e => (e.type ?? '').toLowerCase() !== 'stress_test');

    const digest: string[] = [];
    digest.push(`IDEA: "${clip(idea.title, 120) || 'Untitled'}" — ${clip(idea.solution || idea.problem, 300)}. Sector: ${clip(idea.sector, 60) || 'n/a'}. Target: ${clip(idea.target_customer, 120) || 'n/a'}.`);
    if (entries.length) {
      const lines = entries.slice(0, 20).map(e => {
        const amt = (e.type ?? '') === 'preorder' && Number(e.amount) > 0 ? `, $${e.amount}` : '';
        return `[${e.type ?? 'note'}${e.sentiment ? `, ${e.sentiment}` : ''}${amt}] ${clip(e.notes, 200)}`;
      });
      digest.push(`VALIDATION TRACKER — ${entries.length} real customer-contact entr${entries.length === 1 ? 'y' : 'ies'}:\n  - ${lines.join('\n  - ')}`);
    } else {
      digest.push('VALIDATION TRACKER: no real customer-contact entries logged.');
    }
    const canvas = canvasRes.data as Record<string, unknown> | null;
    digest.push(`Business Model Canvas: ${canvas ? 'started' : 'not started'}. Financials: ${canvas && (Number(canvas.monthly_revenue) > 0 || Number(canvas.monthly_costs) > 0) ? 'entered' : 'not entered'}.`);
    digest.push(`SWOT: ${(swotRes.count ?? 0) > 0 ? 'done' : 'not done'}. Funding pitch: ${(pitchRes.count ?? 0) > 0 ? 'done' : 'not done'}. 90-day tasks completed: ${tasksRes.count ?? 0}.`);

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 300,
      system: RUBRIC,
      messages: [{ role: 'user', content: `Assess this founder's readiness.\n\n${digest.join('\n')}` }],
    });

    const rawText = msg.content.map(b => (b.type === 'text' ? b.text : '')).join('');
    const match = rawText.match(/\{[\s\S]*\}/);
    let score = 0;
    let rationale = '';
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { score?: unknown; rationale?: unknown };
        score = Math.max(0, Math.min(15, Math.round(Number(parsed.score) || 0)));
        rationale = clip(parsed.rationale, 200);
      } catch { /* fall through with defaults */ }
    }

    // Persist the cached assessment (read by recomputeIqScore).
    await db.from('user_ideas').update({
      coach_assessment: score,
      coach_assessment_note: rationale || null,
      coach_assessment_at: new Date().toISOString(),
    }).eq('id', idea_id);

    return new Response(JSON.stringify({ score, rationale }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
