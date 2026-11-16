import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { VALIDATION_COMPLETE_TEMPLATE } from '../_shared/templates.ts';
import { checkCronAuth } from '../_shared/cron-auth.ts';

function scoreVerdict(score: number): string {
  if (score >= 9) return 'استثنائية';
  if (score >= 7) return 'إمكانات قوية';
  if (score >= 4) return 'واعدة';
  return 'تحتاج إلى عمل';
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

  const denied = checkCronAuth(req);
  if (denied) return denied;

  try {
    const { record } = await req.json() as {
      record: { user_idea_id: string; notes: string; type?: string; created_at?: string; amount?: number };
    };

    // Only the AI first read (type 'stress_test') produces this email. The app writes
    // "اختبار الفكرة — درجة الذكاء الاصطناعي: 7.5/10. <verdict>" (older rows: "AI Score: 7.5/10").
    if (record.type !== 'stress_test') return jsonResp({ skipped: 'not a stress test entry' });
    const scoreMatch = record.notes?.match(/(?:درجة الذكاء الاصطناعي|AI Score):\s*([\d.]+)\/10/i);
    if (!scoreMatch) return jsonResp({ skipped: 'no score in notes' });
    const score = parseFloat(scoreMatch[1]);

    const db = getServiceClient();

    // Get idea + user
    const { data: idea } = await db
      .from('user_ideas')
      .select('title, user_id')
      .eq('id', record.user_idea_id)
      .maybeSingle();
    if (!idea) return jsonResp({ skipped: 'idea not found' });

    // The same result can be logged twice (validate page + idea creation). Email once.
    if (record.created_at) {
      const { count } = await db
        .from('validation_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_idea_id', record.user_idea_id)
        .eq('type', 'stress_test')
        .lt('created_at', record.created_at)
        .gt('created_at', new Date(new Date(record.created_at).getTime() - 24 * 3600 * 1000).toISOString());
      if ((count ?? 0) > 0) return jsonResp({ skipped: 'already emailed for this idea' });
    }

    const [{ data: authUser }, { data: profile }] = await Promise.all([
      db.auth.admin.getUserById(idea.user_id),
      db.from('profiles').select('full_name, unsubscribe_token, validation_notifications').eq('user_id', idea.user_id).maybeSingle(),
    ]);
    // Settings → "نتائج التحقق". null (never set) means on.
    if (profile?.validation_notifications === false) return jsonResp({ skipped: 'validation notifications off' });
    const email = authUser?.user?.email;
    if (!email) return jsonResp({ skipped: 'no email' });

    const { data: suppressed } = await db
      .from('email_suppression_list')
      .select('email')
      .ilike('email', email)
      .limit(1);
    if (suppressed && suppressed.length > 0) return jsonResp({ skipped: 'recipient suppressed' });

    // The entry stores only the score and the verdict. The AI's per-idea strengths and
    // suggestions are not saved, so the email carries the verdict plus general next steps.
    const verdictText = record.notes.split('. ').slice(1).join('. ').trim() || scoreVerdict(score);

    const origin = 'https://bethra.co';
    const html = render(await resolveBody(db, 'validation-complete', VALIDATION_COMPLETE_TEMPLATE), {
      founder_name: (profile?.full_name ?? '').split(' ')[0] || 'صديقنا',
      idea_name: idea.title,
      score: String(score),
      verdict: verdictText || scoreVerdict(score),
      score_color: scoreColor(score),
      score_bg: scoreBg(score),
      strength_1: 'وضوح المشكلة والوعي بالسوق',
      strength_2: 'قابلية نموذج الإيراد للتطبيق',
      strength_3: 'تحديد العميل المستهدف',
      suggestion_1: 'أجرِ ٥ مقابلات مع عملاء محتملين هذا الأسبوع',
      suggestion_2: 'ابنِ صفحة هبوط بسيطة واجمع قائمة انتظار',
      suggestion_3: 'حدّد ما يميّزك عن البديل الحالي',
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
