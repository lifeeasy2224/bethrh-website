import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, render, resolveBody, sendViaResend, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { SURVEY_TEMPLATE } from '../_shared/templates.ts';

const ORIGIN = 'https://bethra.co';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { user_id, email, full_name } = await req.json() as {
      user_id: string;
      email: string;
      full_name?: string;
    };

    if (!email) return jsonResp({ error: 'email required' }, 400);

    const db = getServiceClient();
    const firstName = (full_name ?? '').split(' ')[0] || 'صديقنا';

    // Create or retrieve survey token
    const token = crypto.randomUUID();

    // Upsert survey row (one per user)
    const { error: upsertErr } = await db
      .from('survey_responses')
      .upsert({ user_id: user_id || null, token }, { onConflict: 'user_id', ignoreDuplicates: true });

    if (upsertErr) console.error('survey upsert error:', upsertErr);

    // Get the actual token (may already exist)
    const { data: row } = await db
      .from('survey_responses')
      .select('token')
      .eq('user_id', user_id)
      .maybeSingle();

    const surveyToken = row?.token ?? token;
    const surveyUrl = `${ORIGIN}/survey?t=${surveyToken}`;

    const html = render(await resolveBody(db, 'survey-email', SURVEY_TEMPLATE), {
      first_name: firstName,
      survey_url: surveyUrl,
      unsubscribe_url: `${ORIGIN}/unsubscribe`,
    });

    const ok = await sendViaResend(email, 'رأيك يبني المستقبل — 3 دقائق فقط 🌱', html);
    return jsonResp({ ok, survey_url: surveyUrl });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
