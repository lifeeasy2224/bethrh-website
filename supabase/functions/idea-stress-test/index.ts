import Anthropic from 'npm:@anthropic-ai/sdk';
import { guardIp } from '../_shared/rate-limit.ts';
import { render, sendViaResend, getServiceClient } from '../_shared/email-helper.ts';
import { VALIDATION_FIRST_READ_TEMPLATE, escapeHtml } from '../_shared/validation-email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AnalysisResult {
  score: number;
  coherent: boolean;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

function scoreColors(score: number): { color: string; bg: string } {
  if (score >= 7) return { color: '#2A8A52', bg: '#F0F5F1' };
  if (score >= 5) return { color: '#D08A28', bg: '#FAF5E9' };
  return { color: '#C0392B', bg: '#FAF0EE' };
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Emails a signed-in caller their own first read. The recipient comes from the caller's
// JWT, never from the request body, so this cannot be used to mail someone else.
// Best effort: a failure here must never fail the analysis itself.
async function emailResultsToCaller(req: Request, idea: string, result: AnalysisResult): Promise<void> {
  try {
    if (!result.coherent) return;
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) return;

    const db = getServiceClient();
    // The anon key is a JWT too but has no user, so getUser rejects it (anonymous visitors).
    const { data: { user } } = await db.auth.getUser(token);
    if (!user?.email) return;

    const { data: profile } = await db
      .from('profiles')
      .select('full_name, unsubscribe_token, validation_notifications')
      .eq('user_id', user.id)
      .maybeSingle();
    // Settings → "نتائج التحقق". null (never set) means on.
    if (profile?.validation_notifications === false) return;

    const { data: suppressed } = await db
      .from('email_suppression_list').select('email').ilike('email', user.email).limit(1);
    if (suppressed && suppressed.length > 0) return;

    // At most one email per idea per day. "Same idea" = same text (case and spacing ignored),
    // remembered per user in ai_usage under the fn name 'first-read-email'. The marker is
    // written only after a successful send, so a failed send can be retried.
    const dedupeSubject = `first-read:${user.id}:${(await sha256Hex(idea.trim().toLowerCase().replace(/\s+/g, ' '))).slice(0, 32)}`;
    const { count: sentToday } = await db
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('fn', 'first-read-email')
      .eq('subject', dedupeSubject)
      .gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    if ((sentToday ?? 0) > 0) return;

    const title = idea.trim().slice(0, 80) || 'فكرتك';
    const { color, bg } = scoreColors(result.score);
    const pick = (arr: string[] | undefined, i: number) => escapeHtml(arr?.[i] ?? '');
    const origin = 'https://bethra.co';
    const html = render(VALIDATION_FIRST_READ_TEMPLATE, {
      founder_name: escapeHtml((profile?.full_name ?? '').split(' ')[0] || 'صديقنا'),
      idea_name: escapeHtml(title),
      score: String(result.score),
      score_color: color,
      score_bg: bg,
      verdict: escapeHtml(result.verdict || ''),
      strength_1: pick(result.strengths, 0), strength_2: pick(result.strengths, 1), strength_3: pick(result.strengths, 2),
      weakness_1: pick(result.weaknesses, 0), weakness_2: pick(result.weaknesses, 1), weakness_3: pick(result.weaknesses, 2),
      suggestion_1: pick(result.suggestions, 0), suggestion_2: pick(result.suggestions, 1), suggestion_3: pick(result.suggestions, 2),
      next_url: `${origin}/journey/validation`,
      unsubscribe_url: `${origin}/unsubscribe?token=${profile?.unsubscribe_token ?? ''}`,
    });
    const sent = await sendViaResend(user.email, `قراءتك الأولى بالذكاء الاصطناعي: ${result.score}/10 — ${title}`, html);
    if (sent) await db.from('ai_usage').insert({ subject: dedupeSubject, fn: 'first-read-email' });
  } catch (e) {
    console.error('emailResultsToCaller failed:', e);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Public tool — rate-limit by IP to cap anonymous abuse (no login required).
    const limited = await guardIp(req, 'idea-stress-test', corsHeaders);
    if (limited) return limited;

    const body = await req.json() as {
      idea: string;
      target_customer: string;
      acquisition_channel?: string;
      can_get_paid_in_30_days?: string;
      biggest_blocker?: string;
      // Legacy names, still sent by browser bundles loaded before this change. They were
      // never what they say: the quiz has no problem / revenue-model / competitors question.
      problem_solved?: string;
      revenue_model?: string;
      competitors?: string;
    };
    const { idea, target_customer } = body;
    // What the five quiz questions actually ask (see QUESTIONS in ValidatePage.tsx):
    //   3 "كيف ستصل إلى أول ١٠ عملاء؟"
    //   4 "هل يمكن أن يدفع لك أحد خلال ٣٠ يوماً؟"
    //   5 "ما أكبر عائق يواجهك الآن؟"
    // They used to reach the model labeled "Problem solved", "Revenue model" and
    // "Competitors", so it marked founders down for things they were never asked.
    const acquisitionChannel = body.acquisition_channel ?? body.problem_solved ?? '';
    const canGetPaidIn30Days = body.can_get_paid_in_30_days ?? body.revenue_model ?? '';
    const biggestBlocker = body.biggest_blocker ?? body.competitors ?? '';

    // Cap every field — the prompt is sent to the most expensive model.
    const MAX = 1500;
    for (const [k, v] of Object.entries({ idea, target_customer, acquisitionChannel, canGetPaidIn30Days, biggestBlocker })) {
      if (v != null && (typeof v !== 'string' || v.length > MAX)) {
        return new Response(JSON.stringify({ error: `الحقل ${k} طويل جداً (الحد ${MAX} حرف)` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!idea) {
      return new Response(JSON.stringify({ error: 'idea is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const prompt = `You are a startup analyst for Bethra (بذرة), a platform for Arab entrepreneurs in the MENA region. Give an "AI first read" of this startup idea: an AI opinion that helps the founder decide what to test next with real customers. It is NOT validation and it is NOT customer evidence.

What the founder told us:
- Idea (one sentence): ${idea}
- Who would pay for it (their pick): ${target_customer || '(not given)'}
- How they would reach their first 10 customers: ${acquisitionChannel || '(not given)'}
- Could someone pay them within 30 days (their own guess): ${canGetPaidIn30Days || '(not given)'}
- Their biggest blocker right now: ${biggestBlocker || '(not given)'}

Those are the only questions the founder was asked. They were NOT asked about the problem they solve, a revenue model, pricing or competitors, so do not treat missing detail on those as a weakness and do not say that research has not been done. You may suggest them as next steps.

Coherence check (do this FIRST): The "Idea" text may be garbage — keyboard-mashing (e.g. "asdfghjkl"), random or repeated words, a test string ("test test test"), or anything that is not an understandable product or service. If so, do NOT fabricate an analysis. Instead return "coherent": false, "score": 1, a "verdict" in Arabic that politely asks the founder to describe a real idea in a full sentence, set "strengths": [], "weaknesses": ["الوصف غير واضح أو غير مكتمل"] and "suggestions": ["صف فكرتك بجملة مفهومة: ما المنتج أو الخدمة؟ لمن؟ وما المشكلة التي يحلّها؟"]. Only when the idea is a genuine, coherent business concept, set "coherent": true and perform the full analysis below.

Analysis requirements:
- Judge only what the founder wrote. Where it helps, consider the MENA context: local demand, regulations and licensing, payment and delivery habits (WhatsApp-first, cash on delivery). Say what to check; do not state facts about the market that you cannot support.
- The "verdict" is ONE sentence naming the single biggest risk the founder should test first with real customers. It is not a recommendation to proceed or to stop.
- Write ALL text values (verdict, strengths, weaknesses, suggestions) in clear, modern Arabic (فصحى ميسّرة). Keep common startup terms (MVP, SaaS) in Latin script when natural.
- The score (1-10) is how well this first read thinks the idea and the answers hold up. Be honest and hard to impress; do not inflate it.

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "score": <number 1-10>,
  "coherent": <true if the idea is a genuine business concept, false if garbage/incoherent>,
  "verdict": "<جملة واحدة: أكبر خطر ينبغي أن تختبره أولاً مع عملاء حقيقيين>",
  "strengths": ["<نقطة قوة 1>", "<نقطة قوة 2>", "<نقطة قوة 3>"],
  "weaknesses": ["<خطر 1>", "<خطر 2>", "<خطر 3>"],
  "suggestions": ["<خطوة عملية 1>", "<خطوة عملية 2>", "<خطوة عملية 3>"]
}

Do not invent numbers, market sizes or statistics.`;

    const completion = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    let raw = '';
    for (const block of completion.content) {
      if (block.type === 'text') { raw = block.text; break; }
    }

    // Extract JSON from response (handle any wrapping text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }

    const result: AnalysisResult = JSON.parse(jsonMatch[0]);
    // The field is gone from the contract; drop it if the model still returns one.
    delete (result as unknown as Record<string, unknown>).market_size;

    // Clamp score to 1-10
    result.score = Math.max(1, Math.min(10, Math.round(result.score * 10) / 10));
    // Normalize the coherence flag — only an explicit false counts as incoherent.
    result.coherent = result.coherent !== false;

    await emailResultsToCaller(req, idea, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
