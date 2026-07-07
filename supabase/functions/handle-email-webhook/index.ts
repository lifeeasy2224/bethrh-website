import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ResendWebhookEvent {
  type: string;
  data: {
    email_id?: string;
    to?: string | string[];
    tags?: Array<{ name: string; value: string }>;
  };
  tags?: Array<{ name: string; value: string }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let event: ResendWebhookEvent;
  try {
    event = await req.json() as ResendWebhookEvent;
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  // Extract email and campaign_id from Resend event
  const toField = event.data?.to;
  const email = Array.isArray(toField) ? toField[0] : toField;
  const tags = event.tags ?? event.data?.tags ?? [];
  const campaignTag = tags.find((t) => t.name === "campaign_id");
  const campaignId = campaignTag?.value;

  // If not a tracked campaign email, silently acknowledge
  if (!campaignId || !email) {
    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  const now = new Date().toISOString();

  try {
    switch (event.type) {
      case "email.delivered":
        await supabase
          .from("campaign_recipients")
          .update({ status: "delivered", delivered_at: now })
          .eq("campaign_id", campaignId)
          .eq("email", email);

        await incrementCampaignStat(supabase, campaignId, "deliver_count");
        break;

      case "email.opened":
        await supabase
          .from("campaign_recipients")
          .update({ status: "opened", opened_at: now })
          .eq("campaign_id", campaignId)
          .eq("email", email)
          .neq("status", "clicked"); // don't downgrade from clicked

        await incrementCampaignStat(supabase, campaignId, "open_count");
        break;

      case "email.clicked":
        await supabase
          .from("campaign_recipients")
          .update({ status: "clicked", clicked_at: now })
          .eq("campaign_id", campaignId)
          .eq("email", email);

        await incrementCampaignStat(supabase, campaignId, "click_count");
        break;

      case "email.bounced":
        await supabase
          .from("campaign_recipients")
          .update({ status: "bounced", bounced_at: now })
          .eq("campaign_id", campaignId)
          .eq("email", email);

        await incrementCampaignStat(supabase, campaignId, "bounce_count");

        // Auto-suppress bounced emails
        await supabase
          .from("email_suppression_list")
          .upsert({ email: email.toLowerCase(), reason: "bounced", source: campaignId }, { onConflict: "email" });
        break;

      case "email.complained":
        // Spam complaint — suppress immediately
        await supabase
          .from("email_suppression_list")
          .upsert({ email: email.toLowerCase(), reason: "complaint", source: campaignId }, { onConflict: "email" });
        break;

      default:
        // Unknown event type — acknowledge and move on
        break;
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Still return 200 to prevent Resend from retrying indefinitely
  }

  return new Response("OK", { status: 200, headers: corsHeaders });
});

async function incrementCampaignStat(
  supabase: ReturnType<typeof createClient>,
  campaignId: string,
  field: string
): Promise<void> {
  const { data } = await supabase
    .from("marketing_campaigns")
    .select(field)
    .eq("id", campaignId)
    .single<Record<string, number>>();

  if (data) {
    await supabase
      .from("marketing_campaigns")
      .update({ [field]: (data[field] ?? 0) + 1 })
      .eq("id", campaignId);
  }
}
