import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { checkCronAuth } from '../_shared/cron-auth.ts';

// Called by the on_validation_entry_insert trigger for every validation entry.
//
// It no longer sends an email. The results email ("قراءتك الأولى بالذكاء الاصطناعي") is sent
// by idea-stress-test, because only that function has the model's real strengths, risks and
// next steps; a validation entry stores just the score and the verdict, so an email built
// here could only carry canned text. What stays: flagging profiles.stress_test_completed,
// which the admin automations segment on.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  const denied = checkCronAuth(req);
  if (denied) return denied;

  try {
    const { record } = await req.json() as { record: { user_idea_id: string; type?: string } };
    if (record.type !== 'stress_test') return jsonResp({ skipped: 'not a stress test entry' });

    const db = getServiceClient();
    const { data: idea } = await db
      .from('user_ideas')
      .select('user_id')
      .eq('id', record.user_idea_id)
      .maybeSingle();
    if (!idea) return jsonResp({ skipped: 'idea not found' });

    await db.from('profiles').update({ stress_test_completed: true }).eq('user_id', idea.user_id);
    return jsonResp({ ok: true, emailed: false });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
