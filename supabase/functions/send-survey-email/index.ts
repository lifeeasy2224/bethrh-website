import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { SURVEY_TEMPLATE } from '../_shared/survey-template.ts';

const ORIGIN = 'https://bethra.co';

// Internal only: called by process-automations (service role key) and by
// send-survey-blast. Browsers and anonymous callers are rejected.
function isInternalCaller(req: Request): boolean {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
  if (!token) return false;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const cron = Deno.env.get('CRON_BEARER_TOKEN');
  return (!!service && token === service) || (!!cron && token === cron);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  if (!isInternalCaller(req)) return jsonResp({ error: 'Unauthorized' }, 401);

  try {
    const { user_id, email, full_name } = await req.json() as {
      user_id: string;
      email: string;
      full_name?: string;
    };

    if (!email || !user_id) return jsonResp({ error: 'user_id and email required' }, 400);

    const db = getServiceClient();
    const firstName = (full_name ?? '').split(' ')[0] || 'صديقنا';

    // One survey row per user (unique on user_id). Reuse its token if it
    // exists; never email a link whose token is not stored, or answers are lost.
    const { data: existing, error: readErr } = await db
      .from('survey_responses')
      .select('token, submitted_at')
      .eq('user_id', user_id)
      .maybeSingle();
    if (readErr) return jsonResp({ error: `survey lookup failed: ${readErr.message}` }, 500);
    if (existing?.submitted_at) return jsonResp({ ok: true, skipped: 'already_submitted' });

    let surveyToken = existing?.token as string | undefined;
    if (!surveyToken) {
      surveyToken = crypto.randomUUID();
      const { error: insErr } = await db.from('survey_responses').insert({ user_id, token: surveyToken });
      if (insErr) return jsonResp({ error: `survey token not saved: ${insErr.message}` }, 500);
    }

    const surveyUrl = `${ORIGIN}/survey?t=${surveyToken}`;
    const html = render(await resolveBody(db, 'survey-email', SURVEY_TEMPLATE), {
      first_name: firstName,
      survey_url: surveyUrl,
      unsubscribe_url: `${ORIGIN}/unsubscribe`,
    });

    const ok = await sendViaResend(email, 'رأيك يبني المستقبل — 3 دقائق فقط 🌱', html);
    return jsonResp({ ok }, ok ? 200 : 502);
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
