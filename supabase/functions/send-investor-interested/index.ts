import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { INVESTOR_INTERESTED_TEMPLATE } from '../_shared/templates.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { record } = await req.json() as { record: { id: string; investor_id: string; idea_id: string; status: string } };
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

    // Get investor profile (record.investor_id is a profiles.id)
    const { data: investorProfile } = await db
      .from('profiles')
      .select('full_name, user_id')
      .eq('id', record.investor_id)
      .maybeSingle();

    const { data: investorDetails } = await db
      .from('investor_profiles')
      .select('investor_type, check_size, sectors_of_interest')
      .eq('user_id', investorProfile?.user_id ?? '')
      .maybeSingle();

    const origin = 'https://bethra.co';
    const html = render(await resolveBody(db, 'investor-interested', INVESTOR_INTERESTED_TEMPLATE), {
      founder_name: (founderProfile?.full_name ?? '').split(' ')[0] || 'there',
      investor_name: investorProfile?.full_name ?? 'An investor',
      idea_name: idea.title,
      investor_type: investorDetails?.investor_type ?? 'Angel Investor',
      check_size: investorDetails?.check_size ?? 'Undisclosed',
      investor_sectors: (investorDetails?.sectors_of_interest ?? []).join(', ') || 'Various',
      message: 'I am interested in learning more about your idea.',
      connections_url: `${origin}/connections?request=${record.id}`,
      unsubscribe_url: `${origin}/unsubscribe?token=${founderProfile?.unsubscribe_token ?? ''}`,
    });

    await sendViaResend(founderEmail, `مستثمر مهتم بفكرتك «${idea.title}»!`, html);

    // Notification for founder
    await db.from('notifications').insert({
      user_id: idea.user_id,
      type: 'investor_interested',
      title: 'Investor Interested',
      body: `${investorProfile?.full_name ?? 'An investor'} is interested in "${idea.title}"`,
      link: `/connections?request=${record.id}`,
      is_read: false,
    });

    return jsonResp({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
