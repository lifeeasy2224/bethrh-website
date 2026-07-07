import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { NEW_MESSAGE_TEMPLATE } from '../_shared/templates.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { record } = await req.json() as { record: { connection_id: string; sender_id: string; content: string; created_at: string } };
    const db = getServiceClient();

    // Get connection to find recipient
    const { data: conn } = await db
      .from('connections')
      .select('investor_id, founder_id, idea_id')
      .eq('id', record.connection_id)
      .maybeSingle();
    if (!conn) return jsonResp({ skipped: 'connection not found' });

    const recipientUserId = conn.investor_id === record.sender_id ? conn.founder_id : conn.investor_id;

    // Check if recipient was active in last 5 minutes — skip if so
    const { data: recipientProfile } = await db
      .from('profiles')
      .select('full_name, user_id, last_active, unsubscribe_token')
      .eq('user_id', recipientUserId)
      .maybeSingle();

    if (recipientProfile?.last_active) {
      const diffMs = Date.now() - new Date(recipientProfile.last_active).getTime();
      if (diffMs < 5 * 60 * 1000) return jsonResp({ skipped: 'recipient is online' });
    }

    const { data: recipientAuth } = await db.auth.admin.getUserById(recipientUserId);
    const recipientEmail = recipientAuth?.user?.email;
    if (!recipientEmail) return jsonResp({ skipped: 'no recipient email' });

    // Get sender name and idea title
    const [{ data: senderProfile }, { data: idea }] = await Promise.all([
      db.from('profiles').select('full_name').eq('user_id', record.sender_id).maybeSingle(),
      conn.idea_id
        ? db.from('user_ideas').select('title').eq('id', conn.idea_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const msgTime = new Date(record.created_at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });

    const origin = 'https://bethra.co';
    const html = render(await resolveBody(db, 'new-message', NEW_MESSAGE_TEMPLATE), {
      recipient_name: (recipientProfile?.full_name ?? '').split(' ')[0] || 'there',
      sender_name: senderProfile?.full_name ?? 'Your contact',
      idea_name: (idea as { title?: string } | null)?.title ?? 'your idea',
      message_preview: record.content.slice(0, 150) + (record.content.length > 150 ? '…' : ''),
      message_time: msgTime,
      chat_url: `${origin}/investor/connections/${record.connection_id}`,
      unsubscribe_url: `${origin}/unsubscribe?token=${recipientProfile?.unsubscribe_token ?? ''}`,
    });

    await sendViaResend(
      recipientEmail,
      `رسالة جديدة من ${senderProfile?.full_name ?? 'جهة تواصلك'}`,
      html,
    );
    return jsonResp({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
