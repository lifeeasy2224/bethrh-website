// Survey blast: sends the survey email to every user who hasn't submitted it yet.
// Internal only — call with the service role key or the cron bearer token
// (e.g. from SQL via pg_net using the Vault secret `cron_bearer_token`).
// POST /functions/v1/send-survey-blast   body: { "dry_run": true } to preview counts only

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { getServiceClient, jsonResp, corsHeaders } from '../_shared/email-helper.ts';

const BATCH_DELAY_MS = 200; // ~5 emails/sec

function bearer(req: Request): string {
  return (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const cron = Deno.env.get('CRON_BEARER_TOKEN') ?? '';
  const token = bearer(req);
  if (!token || !((serviceKey && token === serviceKey) || (cron && token === cron))) {
    return jsonResp({ error: 'unauthorized' }, 401);
  }

  const { dry_run = false } = await req.json().catch(() => ({})) as { dry_run?: boolean };
  const db = getServiceClient();

  const { data: { users: allUsers }, error: usersErr } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (usersErr) return jsonResp({ error: usersErr.message }, 500);

  const { data: submitted } = await db
    .from('survey_responses')
    .select('user_id')
    .not('submitted_at', 'is', null);
  const submittedIds = new Set((submitted ?? []).map((r: { user_id: string }) => r.user_id));

  // Never email addresses that unsubscribed, bounced or complained.
  const { data: suppressed } = await db.from('email_suppression_list').select('email');
  const suppressedSet = new Set((suppressed ?? []).map((s: { email: string }) => s.email.toLowerCase()));

  const { data: profiles } = await db.from('profiles').select('user_id, full_name');
  const profileMap = new Map((profiles ?? []).map((p: { user_id: string; full_name: string }) => [p.user_id, p]));

  const targets = (allUsers ?? []).filter(u =>
    u.email && !submittedIds.has(u.id) && !suppressedSet.has(u.email.toLowerCase()));

  if (dry_run) return jsonResp({ ok: true, dry_run: true, total: targets.length });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  for (const user of targets) {
    try {
      const profile = profileMap.get(user.id);
      const res = await fetch(`${supabaseUrl}/functions/v1/send-survey-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({ user_id: user.id, email: user.email, full_name: profile?.full_name ?? '' }),
      });
      if (res.ok) sent++;
      else { failed++; if (errors.length < 5) errors.push(`${res.status}: ${(await res.text()).slice(0, 160)}`); }
    } catch (e) {
      failed++;
      if (errors.length < 5) errors.push((e as Error).message);
    }
    await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
  }

  return jsonResp({ ok: failed === 0, total: targets.length, sent, failed, errors });
});
