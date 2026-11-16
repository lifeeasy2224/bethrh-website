import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { INVESTOR_INTERESTED_TEMPLATE } from '../_shared/templates.ts';
import { checkCronAuth } from '../_shared/cron-auth.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  const denied = checkCronAuth(req);
  if (denied) return denied;

  try {
    const { record } = await req.json() as { record: { id: string; investor_id: string; idea_id: string; status: string; message: string | null } };
    const db = getServiceClient();

    // Get idea + founder
    const { data: idea } = await db
      .from('user_ideas')
      .select('title, user_id')
      .eq('id', record.idea_id)
      .maybeSingle();
    if (!idea) return jsonResp({ skipped: 'idea not found' });

    // Get founder email + profile
    const [{ data: founderAuth }, { data: founderProfile }] = await Promise.all([
      db.auth.admin.getUserById(idea.user_id),
      db.from('profiles').select('full_name, unsubscribe_token').eq('user_id', idea.user_id).maybeSingle(),
    ]);
    const founderEmail = founderAuth?.user?.email;
    if (!founderEmail) return jsonResp({ skipped: 'no founder email' });

    const { data: suppressed } = await db
      .from('email_suppression_list')
      .select('email')
      .ilike('email', founderEmail)
      .limit(1);
    if (suppressed && suppressed.length > 0) return jsonResp({ skipped: 'founder suppressed' });

    // connection_requests.investor_id is an auth user id (= profiles.user_id, not profiles.id)
    const { data: investorProfile } = await db
      .from('profiles')
      .select('full_name, user_id')
      .eq('user_id', record.investor_id)
      .maybeSingle();

    const { data: investorDetails } = await db
      .from('investor_profiles')
      .select('investor_type, check_size, sectors_of_interest')
      .eq('user_id', investorProfile?.user_id ?? '')
      .maybeSingle();

    const origin = 'https://bethra.co';
    const html = render(await resolveBody(db, 'investor-interested', INVESTOR_INTERESTED_TEMPLATE), {
      founder_name: (founderProfile?.full_name ?? '').split(' ')[0] || 'صديقنا',
      investor_name: investorProfile?.full_name ?? 'مستثمر',
      idea_name: idea.title,
      investor_type: investorDetails?.investor_type ?? 'مستثمر',
      check_size: investorDetails?.check_size ?? 'غير معلن',
      investor_sectors: (investorDetails?.sectors_of_interest ?? []).join(', ') || 'متنوعة',
      message: record.message?.trim() || 'أودّ معرفة المزيد عن فكرتك.',
      connections_url: `${origin}/connections?request=${record.id}`,
      unsubscribe_url: `${origin}/unsubscribe?token=${founderProfile?.unsubscribe_token ?? ''}`,
    });

    await sendViaResend(founderEmail, `مستثمر مهتم بفكرتك «${idea.title}»!`, html);

    // The in-app notification is written by send-notification (called when the request is made).

    return jsonResp({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
