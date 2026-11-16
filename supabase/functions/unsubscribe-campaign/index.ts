import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { verifyUnsub } from '../_shared/unsub-token.ts';

// Public endpoint behind the /unsubscribe page for campaign emails. record_campaign_unsubscribe
// is service_role-only, so this is the only way in, and it only honours:
//   - a link carrying a valid signature (every link sent from now on), or
//   - a legacy unsigned link (campaigns already sent) whose email + campaign id match a
//     real recipient row. The campaign id is a random uuid, so it is not guessable.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResp({ error: 'Method not allowed' }, 405);

  try {
    const { email, campaign, sig } = await req.json() as { email?: string; campaign?: string; sig?: string };
    const em = (email ?? '').trim().toLowerCase();
    if (!EMAIL.test(em) || em.length > 254 || !campaign || !UUID.test(campaign)) {
      return jsonResp({ error: 'invalid' }, 400);
    }

    const db = getServiceClient();

    if (sig) {
      if (!(await verifyUnsub(em, campaign, sig))) return jsonResp({ error: 'invalid' }, 400);
    } else {
      const { count } = await db
        .from('campaign_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign)
        .ilike('email', em);
      if (!count) return jsonResp({ error: 'invalid' }, 400);
    }

    const { error } = await db.rpc('record_campaign_unsubscribe', { p_email: em, p_campaign: campaign });
    if (error) {
      console.error('record_campaign_unsubscribe failed:', error.message);
      return jsonResp({ error: 'failed' }, 500);
    }
    return jsonResp({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: 'failed' }, 500);
  }
});
