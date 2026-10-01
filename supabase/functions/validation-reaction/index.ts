import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { guardUser } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// One-shot, inline reaction — NOT a draft. The client has already inserted
// the validation_entries row before calling this; this function only reads
// and reacts, it never writes.
const SYSTEM_PROMPT = `You react to a founder's validation evidence on an Arabic-first startup platform.
You see: the new entry they just logged, their idea context, and a summary of their
existing evidence (count + total committed amount).

RULES:
- Be SHORT (2-4 sentences). This appears inline right after they log the entry.
- Be HONEST, not encouraging. Your job is signal quality, not motivation.
- WEAK evidence patterns to challenge (not exhaustively):
  * "Friend/family said it's a great idea" → politeness ≠ validation
  * "People showed interest" / "أبدوا اهتماماً" → interest is free, payment is proof
  * Interview with no behavioral question → opinions ≠ purchase intent
  * Observation with no specifics → vague observation ≠ evidence
- STRONG evidence patterns to affirm:
  * Real payment / preorder with money received → strongest signal, say so
  * Signup with email/commitment → real but weaker than payment
  * Interview with specific behavioral data → good if sample > 5
- If amount > 0 and type is preorder/signup, ask: "هل وصل المبلغ فعلاً لحسابك؟"
  (Did the money actually reach your account?) — the distinction matters.
- Reference the founder's ACTUAL idea (problem/solution/customer) to ground the reaction.
- State their evidence tally: "لديك الآن X إدخال تحقق، بإجمالي $Y ملتزم به"
- All output in Arabic (فصحى ميسّرة).
- Strictly Modern Standard Arabic (فصحى ميسّرة) — NO regional dialect (no Gulf/Saudi/Egyptian/Levantine colloquialisms). NEVER use country flag emojis.

Return ONLY the reaction text, no JSON, no markdown fences.`;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

interface Entry {
  type: string;
  notes?: string;
  sentiment?: string;
  amount?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const guard = await guardUser(req, 'validation-reaction', corsHeaders);
    if (guard.response) return guard.response;
    const userId = guard.userId;

    const { idea_id, entry } = await req.json() as { idea_id?: string; entry?: Entry };
    if (!idea_id) return json({ error: 'idea_id is required' }, 400);
    if (!entry || !entry.type) return json({ error: 'entry is required' }, 400);

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Owner-scoped load — a caller can only react to their own idea's evidence.
    const { data: idea, error: ideaErr } = await db.from('user_ideas')
      .select('title, problem, solution, target_customer')
      .eq('id', idea_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (ideaErr) console.error('validation-reaction: user_ideas fetch failed', ideaErr.message);
    if (!idea) return json({ error: 'الفكرة غير موجودة' }, 404);

    // Lightweight tally only — no notes, no full rows. Fast on purpose.
    type TallyRow = { type: string; sentiment: string | null; amount: number | null };
    const { data: tallyRows, error: tallyErr } = await db.from('validation_entries')
      .select('type, sentiment, amount')
      .eq('user_idea_id', idea_id);
    if (tallyErr) console.error('validation-reaction: validation_entries fetch failed', tallyErr.message);

    const existing = (tallyRows as TallyRow[] | null) ?? [];
    const entryCount = existing.length; // the client already inserted the new entry
    const totalCommitted = existing.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const ideaRow = idea as Record<string, unknown>;
    const clip = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n);

    const TYPE_LABEL: Record<string, string> = {
      interview: 'مقابلة', signup: 'تسجيل', preorder: 'طلب مسبق',
      observation: 'ملاحظة', other: 'ملاحظة عامة', stress_test: 'اختبار ضغط بالذكاء الاصطناعي',
    };
    const entryLabel = TYPE_LABEL[entry.type] ?? entry.type;

    const digest = [
      `فكرة المؤسس: "${ideaRow.title || 'بدون عنوان'}". المشكلة: ${clip(ideaRow.problem, 300)}. الحل: ${clip(ideaRow.solution, 300)}. العميل المستهدف: ${clip(ideaRow.target_customer, 200)}.`,
      `الإدخال الجديد الذي سجّله المؤسس الآن: [${entryLabel}${entry.sentiment ? `، ${entry.sentiment}` : ''}${entry.amount ? `، $${entry.amount}` : ''}] ${clip(entry.notes, 400)}`,
      `إجمالي أدلة التحقق بعد هذا الإدخال: ${entryCount} إدخال، بإجمالي $${totalCommitted} ملتزم به.`,
    ].join('\n\n');

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: digest }],
    });

    let reaction = '';
    for (const block of completion.content) { if (block.type === 'text') reaction += block.text; }
    reaction = reaction.trim();

    if (!reaction) {
      console.error('validation-reaction: model returned empty text');
      return json({ error: 'تعذّر إنشاء الرد' }, 500);
    }

    return json({
      reaction,
      entry_count: entryCount,
      total_committed: totalCommitted,
    }, 200);
  } catch (err) {
    console.error('validation-reaction: unhandled error', (err as Error).message);
    return json({ error: (err as Error).message }, 500);
  }
});
