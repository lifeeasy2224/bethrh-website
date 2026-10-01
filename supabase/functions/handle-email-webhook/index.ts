import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Webhook } from "npm:svix@1.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, svix-id, svix-timestamp, svix-signature",
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

  // ── Verify the event really came from Resend ──────────────────────────────
  // Resend signs webhooks with Svix. Without this check anyone could POST a fake
  // "bounced" event and add arbitrary addresses to the suppression list, silently
  // blocking real users' email.
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (!secret) {
    console.error("handle-email-webhook: RESEND_WEBHOOK_SECRET is not set — rejecting");
    return new Response("Webhook not configured", { status: 500, headers: corsHeaders });
  }

  const raw = await req.text();
  let event: ResendWebhookEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(raw, {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    }) as ResendWebhookEvent;
  } catch (_err) {
    return new Response("Invalid signature", { status: 401, headers: corsHeaders });
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
