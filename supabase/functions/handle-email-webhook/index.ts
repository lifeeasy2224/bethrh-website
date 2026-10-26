import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Webhook } from "npm:svix@1.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, svix-id, svix-timestamp, svix-signature",
};

// Resend sends tags as an object ({ campaign_id: "..." }) in webhook payloads,
// but as an array ([{ name, value }]) in some other contexts. Accept both.
type TagShape = Array<{ name: string; value: string }> | Record<string, string> | null | undefined;

interface ResendWebhookEvent {
  type: string;
  data: {
    email_id?: string;
    to?: string | string[];
    tags?: TagShape;
  };
  tags?: TagShape;
}

function readTag(tags: TagShape, key: string): string | undefined {
  if (!tags) return undefined;
  if (Array.isArray(tags)) return tags.find((t) => t?.name === key)?.value;
  if (typeof tags === "object") {
    const v = (tags as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
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

  // Verify the event really came from Resend (Svix signature).
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

  try {
    const toField = event.data?.to;
    const email = (Array.isArray(toField) ? toField[0] : toField)?.toLowerCase();
    const now = new Date().toISOString();

    // One-off emails sent through the admin approval queue (outbound-email).
    const outboundId = readTag(event.data?.tags, "outbound_id") ?? readTag(event.tags, "outbound_id");
    if (outboundId) {
      const label = event.type.replace(/^email\./, "");
      await supabase.from("outbound_emails")
        .update({ last_event: label, last_event_at: now })
        .eq("id", outboundId);
      if (email && (event.type === "email.bounced" || event.type === "email.complained")) {
        await supabase.from("email_suppression_list").upsert(
          { email, reason: event.type === "email.bounced" ? "bounced" : "complaint", source: `outbound:${outboundId}` },
          { onConflict: "email" },
        );
      }
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const campaignId = readTag(event.data?.tags, "campaign_id") ?? readTag(event.tags, "campaign_id");

    // Not a tracked campaign email — acknowledge.
    if (!campaignId || !email) {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    switch (event.type) {
      case "email.delivered":
        await supabase.from("campaign_recipients")
          .update({ status: "delivered", delivered_at: now })
          .eq("campaign_id", campaignId).ilike("email", email)
          .in("status", ["pending", "sent"]);
        await incrementCampaignStat(supabase, campaignId, "deliver_count");
        break;

      case "email.opened":
        await supabase.from("campaign_recipients")
          .update({ status: "opened", opened_at: now })
          .eq("campaign_id", campaignId).ilike("email", email)
          .neq("status", "clicked");
        await incrementCampaignStat(supabase, campaignId, "open_count");
        break;

      case "email.clicked":
        await supabase.from("campaign_recipients")
          .update({ status: "clicked", clicked_at: now })
          .eq("campaign_id", campaignId).ilike("email", email);
        await incrementCampaignStat(supabase, campaignId, "click_count");
        break;

      case "email.bounced":
        await supabase.from("campaign_recipients")
          .update({ status: "bounced", bounced_at: now })
          .eq("campaign_id", campaignId).ilike("email", email);
        await incrementCampaignStat(supabase, campaignId, "bounce_count");
        await supabase.from("email_suppression_list")
          .upsert({ email, reason: "bounced", source: campaignId }, { onConflict: "email" });
        break;

      case "email.complained":
        await supabase.from("email_suppression_list")
          .upsert({ email, reason: "complaint", source: campaignId }, { onConflict: "email" });
        break;

      default:
        break;
    }
  } catch (err) {
    // Log and still acknowledge, so Resend does not retry forever or disable the endpoint.
    console.error("handle-email-webhook: processing error", err);
  }

  return new Response("OK", { status: 200, headers: corsHeaders });
});

async function incrementCampaignStat(
  supabase: ReturnType<typeof createClient>,
  campaignId: string,
  field: string,
): Promise<void> {
  const { data } = await supabase
    .from("marketing_campaigns")
    .select(field)
    .eq("id", campaignId)
    .single<Record<string, number>>();
  if (data) {
    await supabase.from("marketing_campaigns")
      .update({ [field]: (data[field] ?? 0) + 1 })
      .eq("id", campaignId);
  }
}
