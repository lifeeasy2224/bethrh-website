import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { WEEKLY_INSPIRATION_TEMPLATE } from '../_shared/templates.ts';
import { checkCronAuth } from '../_shared/cron-auth.ts';

const PAID_TIERS = new Set(['pro', 'growth', 'accelerator']);
const FREE_MAX_WEEKS = 8;
const TOTAL_MESSAGES = 100;

const CATEGORY_STYLES: Record<string, { color: string; bg: string }> = {
  'QUICK TIP':     { color: '#1D4ED8', bg: '#DBEAFE' },
  'MOTIVATION':    { color: '#7C3AED', bg: '#EDE9FE' },
  'EDUCATION':     { color: '#065F46', bg: '#D1FAE5' },
  'ACTION':        { color: '#92400E', bg: '#FDE68A' },
  'SUCCESS STORY': { color: '#9F1239', bg: '#FFE4E6' },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  const denied = checkCronAuth(req);
  if (denied) return denied;

  try {
    const db = getServiceClient();

    const { data: profiles } = await db
      .from('profiles')
      .select('id, user_id, full_name, tier, inspiration_enabled, inspiration_week_number, unsubscribe_token')
      .eq('inspiration_enabled', true);

    if (!profiles?.length) return jsonResp({ ok: true, sent: 0 });

    const { data: allMessages } = await db
      .from('inspiration_messages')
      .select('*')
      .order('message_number');

    if (!allMessages?.length) return jsonResp({ skipped: 'no inspiration messages' });

    const origin = 'https://bethra.co';
    let sent = 0;

    for (const profile of profiles) {
      try {
        const isPaid = PAID_TIERS.has(profile.tier ?? 'free');
        const weekNumber = (profile.inspiration_week_number ?? 0) + 1;

        // Free users: stop at week 8, trigger upgrade email
        if (!isPaid && weekNumber > FREE_MAX_WEEKS) {
          // Call upgrade function fire-and-forget
          fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-inspiration-upgrade`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
              body: JSON.stringify({ user_id: profile.user_id }),
            },
          ).catch(() => null);

          await db.from('profiles').update({ inspiration_enabled: false }).eq('id', profile.id);
          continue;
        }

        // Get messages this user has already received
        const { data: sentLog } = await db
          .from('user_inspiration_log')
          .select('message_id')
          .eq('user_id', profile.id);

        const sentIds = new Set((sentLog ?? []).map((r: { message_id: string }) => r.message_id));
        let available = allMessages.filter(m => !sentIds.has(m.id));

        // Paid users loop after all 60 are sent
        if (!available.length) {
          if (!isPaid) continue;
          await db.from('user_inspiration_log').delete().eq('user_id', profile.id);
          available = [...allMessages];
        }

        const msg = available[Math.floor(Math.random() * available.length)];

        const { data: authUser } = await db.auth.admin.getUserById(profile.user_id);
        const email = authUser?.user?.email;
        if (!email) continue;

        const style = CATEGORY_STYLES[msg.category] ?? CATEGORY_STYLES['QUICK TIP'];
        const tipsReceived = sentIds.size;

        const html = render(await resolveBody(db, 'weekly-inspiration', WEEKLY_INSPIRATION_TEMPLATE), {
          first_name: (profile.full_name ?? '').split(' ')[0] || 'there',
          category_label: msg.category,
          category_color: style.color,
          category_bg: style.bg,
          main_title: msg.main_title,
          main_content: msg.main_content,
          action_prompt: msg.action_prompt,
          tip_number: String(tipsReceived + 1),
          total_tips: String(TOTAL_MESSAGES),
          week_number: String(weekNumber),
          dashboard_url: `${origin}/founder/dashboard`,
          unsubscribe_url: `${origin}/unsubscribe?token=${profile.unsubscribe_token ?? ''}`,
        });

        await sendViaResend(email, msg.subject_line, html);

        await Promise.all([
          db.from('user_inspiration_log').insert({ user_id: profile.id, message_id: msg.id, week_number: weekNumber }),
          db.from('profiles').update({ inspiration_week_number: weekNumber }).eq('id', profile.id),
        ]);

        sent++;
      } catch (e) {
        console.error(`Inspiration failed for ${profile.user_id}:`, e);
      }
    }

    return jsonResp({ ok: true, sent });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
