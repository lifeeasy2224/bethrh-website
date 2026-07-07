import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { VALIDATION_COMPLETE_TEMPLATE } from '../_shared/templates.ts';

function scoreVerdict(score: number): string {
  if (score >= 9) return 'Exceptional';
  if (score >= 7) return 'Strong Potential';
  if (score >= 4) return 'Promising';
  return 'Needs Work';
}
function scoreColor(score: number): string {
  if (score >= 7) return '#10B981';
  if (score >= 4) return '#D97706';
  return '#EF4444';
}
function scoreBg(score: number): string {
  if (score >= 7) return '#F0FDF4';
  if (score >= 4) return '#FFFBEB';
  return '#FEF2F2';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { record } = await req.json() as {
      record: { user_idea_id: string; notes: string; amount?: number };
    };

    // Parse data embedded in notes: "Idea Stress Test — AI Score: 7.5/10. <verdict>"
    const scoreMatch = record.notes?.match(/AI Score:\s*([\d.]+)\/10/i);
    if (!scoreMatch) return jsonResp({ skipped: 'not a stress test entry' });
    const score = parseFloat(scoreMatch[1]);

    const db = getServiceClient();

    // Get idea + user
    const { data: idea } = await db
      .from('user_ideas')
      .select('title, user_id')
      .eq('id', record.user_idea_id)
      .maybeSingle();
    if (!idea) return jsonResp({ skipped: 'idea not found' });

    const [{ data: authUser }, { data: profile }] = await Promise.all([
      db.auth.admin.getUserById(idea.user_id),
      db.from('profiles').select('full_name, unsubscribe_token').eq('user_id', idea.user_id).maybeSingle(),
    ]);
    const email = authUser?.user?.email;
    if (!email) return jsonResp({ skipped: 'no email' });

    // Extract strengths/suggestions from notes if present (best effort)
    // Notes format: "Idea Stress Test — AI Score: X/10. <verdict>"
    const verdictText = record.notes.split('. ').slice(1).join('. ').trim() || scoreVerdict(score);

    const origin = 'https://bethra.co';
    const html = render(await resolveBody(db, 'validation-complete', VALIDATION_COMPLETE_TEMPLATE), {
      founder_name: (profile?.full_name ?? '').split(' ')[0] || 'there',
      idea_name: idea.title,
      score: String(score),
      verdict: verdictText || scoreVerdict(score),
      score_color: scoreColor(score),
      score_bg: scoreBg(score),
      strength_1: 'Problem clarity and market awareness',
      strength_2: 'Revenue model viability',
      strength_3: 'Target customer definition',
      suggestion_1: 'Run 5 customer discovery interviews this week',
      suggestion_2: 'Build a simple landing page and collect waitlist signups',
      suggestion_3: 'Define your unique differentiator vs. the status quo',
      validate_url: `${origin}/validate`,
      unsubscribe_url: `${origin}/unsubscribe?token=${profile?.unsubscribe_token ?? ''}`,
    });

    await sendViaResend(email, `درجة فكرتك: ${score}/10 — ${idea.title}`, html);

    // Mark stress_test_completed on profile
    await db.from('profiles').update({ stress_test_completed: true }).eq('user_id', idea.user_id);

    return jsonResp({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
