import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { INSPIRATION_UPGRADE_TEMPLATE } from '../_shared/templates.ts';

const TOTAL_TIPS = 60;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { user_id } = await req.json() as { user_id: string };
    if (!user_id) return jsonResp({ error: 'user_id required' }, 400);

    const db = getServiceClient();

    const [{ data: authUser }, { data: profile }] = await Promise.all([
      db.auth.admin.getUserById(user_id),
      db.from('profiles')
        .select('full_name, inspiration_week_number, unsubscribe_token')
        .eq('user_id', user_id)
        .maybeSingle(),
    ]);

    const email = authUser?.user?.email;
    if (!email) return jsonResp({ skipped: 'no email' });

    const { count: tipsReceived } = await db
      .from('user_inspiration_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile?.id ?? user_id);

    const weeksCompleted = profile?.inspiration_week_number ?? 8;

    const html = render(await resolveBody(db, 'inspiration-upgrade', INSPIRATION_UPGRADE_TEMPLATE), {
      first_name: (profile?.full_name ?? '').split(' ')[0] || 'there',
      weeks_completed: String(weeksCompleted),
      tips_received: String(tipsReceived ?? weeksCompleted),
      total_tips: String(TOTAL_TIPS),
      unsubscribe_url: `https://bethra.co/unsubscribe?token=${profile?.unsubscribe_token ?? ''}`,
    });

    await sendViaResend(
      email,
      `رسائل إلهامك الأسبوعية ستتوقف — إليك كيف تُبقيها`,
      html,
    );

    // Create upgrade_prompt notification
    await db.from('notifications').insert({
      user_id,
      type: 'upgrade_prompt',
      title: 'Keep your weekly insights',
      body: `You've completed ${weeksCompleted} weeks of inspiration. Upgrade to continue.`,
      is_read: false,
    });

    return jsonResp({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
