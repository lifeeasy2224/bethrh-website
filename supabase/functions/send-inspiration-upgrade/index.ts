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

    // Only trusted callers (service role / cron token) or the user themself may
    // trigger this — it used to email any user id for anyone with the anon key.
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const cron = Deno.env.get('CRON_BEARER_TOKEN');
    const trusted = !!token && ((!!service && token === service) || (!!cron && token === cron));
    if (!trusted) {
      const { data: { user } } = token ? await db.auth.getUser(token) : { data: { user: null } };
      if (!user || user.id !== user_id) return jsonResp({ error: 'Unauthorized' }, 401);
    }

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
      title: 'حافظ على رسائل إلهامك الأسبوعية',
      body: `أكملت ${weeksCompleted} أسابيع من الإلهام. رقِّ خطتك لتستمر.`,
      is_read: false,
    });

    return jsonResp({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
