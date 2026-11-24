import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// RFC 8058 one-click unsubscribe, the target of the List-Unsubscribe header on the founder
// welcome series. Mail clients POST here without a browser session, so it is public
// (verify_jwt = false). The token is the profile's unsubscribe_token (an unguessable uuid);
// unsubscribe_by_token does the work server-side: stops all marketing, stops the welcome
// series and suppresses the address. Account emails (password reset, security) are never
// affected. Safe to call twice.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = { 'Content-Type': 'application/json' };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = new URL(req.url).searchParams.get('p') ?? '';
  if (!UUID.test(token)) return json({ error: 'Invalid token' }, 400);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data, error } = await supabase.rpc('unsubscribe_by_token', { p_token: token });
  if (error) return json({ error: 'Could not process request' }, 500);
  return data ? json({ ok: true }) : json({ error: 'Unknown token' }, 404);
});
