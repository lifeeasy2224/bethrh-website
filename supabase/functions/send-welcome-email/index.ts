import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { WELCOME_TEMPLATE } from '../_shared/templates.ts';
import { checkCronAuth } from '../_shared/cron-auth.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  const denied = checkCronAuth(req);
  if (denied) return denied;

  try {
    const { record } = await req.json() as { record: { user_id: string; full_name: string; role: string; unsubscribe_token: string } };
    const db = getServiceClient();

    // Get email from auth.users
    const { data: authUser } = await db.auth.admin.getUserById(record.user_id);
    const email = authUser?.user?.email;
    if (!email) return jsonResp({ skipped: 'no email' });

    const firstName = (record.full_name ?? '').split(' ')[0] || 'there';
    const roleLabel = record.role === 'investor' ? 'Investor' : 'Founder';
    const dashboardPath = record.role === 'investor' ? '/investor/dashboard' : '/founder/dashboard';
    const origin = 'https://bethra.co';

    const html = render(await resolveBody(db, 'welcome-email', WELCOME_TEMPLATE), {
      first_name: firstName,
      role: roleLabel,
      dashboard_url: origin + dashboardPath,
      unsubscribe_url: `${origin}/unsubscribe?token=${record.unsubscribe_token ?? ''}`,
    });

    await sendViaResend(email, `أهلاً بك في بذرة — رحلتك تبدأ الآن`, html);
    return jsonResp({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
