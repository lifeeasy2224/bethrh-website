import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, getServiceClient, jsonResp } from '../_shared/email-helper.ts';

// Consolidated writer for cross-user notifications. The caller is
// authenticated from their JWT, and the recipient + title + body are all
// derived server-side from a trusted connection_requests row keyed by
// request_id — the client cannot set user_id, title, or body directly.
// This closes the spoofing vector of the previous client-side inserts and
// lets the notifications INSERT policy be locked to the service role.
type NotifType = 'connection_accepted' | 'connection_declined' | 'connection_request';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    // 1. Authenticate the caller from the JWT supabase-js attaches to invoke().
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await caller.auth.getUser();
    if (authErr || !user) return jsonResp({ error: 'Unauthorized' }, 401);

    const { type, request_id } = await req.json() as { type: NotifType; request_id: string };
    if (!type || !request_id) return jsonResp({ error: 'Missing type or request_id' }, 400);

    const db = getServiceClient();

    // 2. Load the referenced connection request (service role).
    const { data: reqRow } = await db
      .from('connection_requests')
      .select('id, investor_id, founder_id, idea_id')
      .eq('id', request_id)
      .maybeSingle();
    if (!reqRow) return jsonResp({ error: 'Connection request not found' }, 404);

    // 3. Authorize the caller and derive recipient + content per type.
    let recipient: string;
    let title: string;
    let body: string;

    if (type === 'connection_accepted' || type === 'connection_declined') {
      // Only the founder on the request may accept/decline it.
      if (user.id !== reqRow.founder_id) return jsonResp({ error: 'Forbidden' }, 403);
      recipient = reqRow.investor_id;
      title = type === 'connection_accepted' ? 'Connection Accepted' : 'Connection Declined';
      body = type === 'connection_accepted'
        ? 'A founder accepted your connection request.'
        : 'A founder declined your connection request.';
    } else if (type === 'connection_request') {
      // Only the investor who created the request may notify the founder.
      if (user.id !== reqRow.investor_id) return jsonResp({ error: 'Forbidden' }, 403);
      recipient = reqRow.founder_id;
      const { data: idea } = await db
        .from('user_ideas')
        .select('title')
        .eq('id', reqRow.idea_id)
        .maybeSingle();
      title = 'New Connection Request';
      body = `An investor is interested in "${idea?.title ?? 'your idea'}"`;
    } else {
      return jsonResp({ error: `Unknown type: ${type}` }, 400);
    }

    // 4. Insert the notification (service role — the sole writer post-lockdown).
    const { error: insErr } = await db.from('notifications').insert({
      user_id: recipient,
      type,
      title,
      body,
      link: `/connections?request=${request_id}`,
      is_read: false,
    });
    if (insErr) return jsonResp({ error: insErr.message }, 500);

    return jsonResp({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
