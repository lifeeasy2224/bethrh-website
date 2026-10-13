// One-time blast: sends survey email to all existing users who haven't submitted yet.
// Call once from admin panel or via curl with service role key.
// POST /functions/v1/send-survey-blast  (no body required)

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { getServiceClient, jsonResp, corsHeaders } from '../_shared/email-helper.ts';

const BATCH_DELAY_MS = 200; // ~5 emails/sec — stays well within Resend free tier

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  // Require service role auth
  const auth = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!auth.includes(serviceKey)) {
    return jsonResp({ error: 'unauthorized' }, 401);
  }

  const db = getServiceClient();

  // Get all users who haven't submitted the survey
  const { data: { users: allUsers }, error: usersErr } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (usersErr) return jsonResp({ error: usersErr.message }, 500);

  const { data: submitted } = await db
    .from('survey_responses')
    .select('user_id')
    .not('submitted_at', 'is', null);

  const submittedIds = new Set((submitted ?? []).map((r: { user_id: string }) => r.user_id));

  // Get profiles for names
  const { data: profiles } = await db.from('profiles').select('user_id, full_name');
  const profileMap = new Map((profiles ?? []).map((p: { user_id: string; full_name: string }) => [p.user_id, p]));

  const targets = (allUsers ?? []).filter(u => u.email && !submittedIds.has(u.id));

  let sent = 0;
  let failed = 0;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  for (const user of targets) {
    try {
      const profile = profileMap.get(user.id);
      const res = await fetch(`${supabaseUrl}/functions/v1/send-survey-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          full_name: profile?.full_name ?? '',
        }),
      });
      if (res.ok) sent++; else failed++;
    } catch {
      failed++;
    }
    // Rate limit
    await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
  }

  return jsonResp({ ok: true, total: targets.length, sent, failed });
});
