import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { checkCronAuth } from '../_shared/cron-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

interface ScheduledCampaign {
  id: string;
  name: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  // Cron/DB-trigger auth only — never called by a founder or admin browser
  // session directly, same shared bearer-token gate as cleanup-expired-documents.
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const CRON_BEARER_TOKEN = Deno.env.get('CRON_BEARER_TOKEN')!;

  const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  try {
    const { data: dueCampaigns, error: fetchErr } = await supabase
      .from('marketing_campaigns')
      .select('id, name')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());

    if (fetchErr) {
      console.error('process-scheduled-campaigns: fetch failed', fetchErr.message);
      return json({ processed: 0, failed: 0, errors: [`fetch failed: ${fetchErr.message}`] }, 200);
    }

    for (const campaign of (dueCampaigns as ScheduledCampaign[] | null) ?? []) {
      try {
        // send-campaign accepts the shared cron bearer secret on a dedicated
        // header (x-cron-token) as a third auth path alongside the admin
        // session/JWT paths — Authorization here just needs to be a valid JWT
        // to pass the function gateway's verify_jwt check.
        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-campaign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'x-cron-token': CRON_BEARER_TOKEN,
          },
          body: JSON.stringify({ campaign_id: campaign.id }),
        });

        if (res.ok) {
          await supabase.from('marketing_campaigns').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          }).eq('id', campaign.id);
          processed++;
        } else {
          const errText = await res.text();
          console.error(`process-scheduled-campaigns: send-campaign failed for ${campaign.id}`, errText);
          await supabase.from('marketing_campaigns').update({ status: 'failed' }).eq('id', campaign.id);
          errors.push(`campaign ${campaign.id} (${campaign.name}): send failed (${res.status}) ${errText}`);
          failed++;
        }
      } catch (err) {
        console.error(`process-scheduled-campaigns: unhandled error for ${campaign.id}`, (err as Error).message);
        await supabase.from('marketing_campaigns').update({ status: 'failed' }).eq('id', campaign.id);
        errors.push(`campaign ${campaign.id} (${campaign.name}): ${(err as Error).message}`);
        failed++;
      }
    }

    return json({ processed, failed, errors }, 200);
  } catch (err) {
    console.error('process-scheduled-campaigns: unhandled error', (err as Error).message);
    errors.push((err as Error).message);
    return json({ processed, failed, errors }, 200);
  }
});
