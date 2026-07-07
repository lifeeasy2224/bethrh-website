import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  segment_id: string | null;
  ab_enabled: boolean;
  ab_variants: Array<{ label: string; subject: string; split: number }> | null;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
}

interface SuppressionRow {
  email: string;
}

interface AuthUser {
  id: string;
  email: string;
}

function replacePlaceholders(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

async function getUserEmails(
  supabase: ReturnType<typeof createClient>,
  segmentId: string | null
): Promise<Array<{ user_id: string; email: string; full_name: string | null }>> {
  if (!segmentId) return [];

  const { data: segData } = await supabase
    .from("marketing_segments")
    .select("type, rules")
    .eq("id", segmentId)
    .single();

  if (!segData) return [];

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authUsers: AuthUser[] = users ?? [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", authUsers.map((u) => u.id));

  const profileMap = new Map<string, ProfileRow>(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.user_id, p])
  );

  if (segData.type === "manual") {
    const { data: members } = await supabase
      .from("segment_members")
      .select("user_id")
      .eq("segment_id", segmentId);

    const memberIds = new Set(((members ?? []) as { user_id: string }[]).map((m) => m.user_id));

    return authUsers
      .filter((u) => u.email && memberIds.has(u.id))
      .map((u) => ({
        user_id: u.id,
        email: u.email!,
        full_name: profileMap.get(u.id)?.full_name ?? null,
      }));
  }

  // Smart segment — return all users (rule evaluation happens client-side in campaigns page for counts)
  return authUsers
    .filter((u) => u.email)
    .map((u) => ({
      user_id: u.id,
      email: u.email!,
      full_name: profileMap.get(u.id)?.full_name ?? null,
    }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { campaign_id } = await req.json() as { campaign_id: string };
  if (!campaign_id) {
    return new Response(JSON.stringify({ error: "campaign_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load campaign
  const { data: campaign } = await supabase
    .from("marketing_campaigns")
    .select("id,name,subject,body_html,from_name,from_email,reply_to,segment_id,ab_enabled,ab_variants")
    .eq("id", campaign_id)
    .single<CampaignRow>();

  if (!campaign) {
    return new Response(JSON.stringify({ error: "Campaign not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load suppression list
  const { data: suppList } = await supabase.from("email_suppression_list").select("email");
  const suppressed = new Set(((suppList ?? []) as SuppressionRow[]).map((s) => s.email.toLowerCase()));

  // Get recipients
  const recipients = await getUserEmails(supabase, campaign.segment_id);
  const eligible = recipients.filter((r) => !suppressed.has(r.email.toLowerCase()));

  let sentCount = 0;

  for (const recipient of eligible) {
    // Determine A/B variant subject
    let subject = campaign.subject;
    let abVariant: string | null = null;

    if (campaign.ab_enabled && campaign.ab_variants?.length) {
      const rand = Math.random() * 100;
      let cumulative = 0;
      for (const variant of campaign.ab_variants) {
        cumulative += variant.split;
        if (rand <= cumulative) {
          subject = variant.subject;
          abVariant = variant.label;
          break;
        }
      }
    }

    const firstName = recipient.full_name?.split(" ")[0] ?? "";
    const appUrl = SUPABASE_URL.replace(/\.supabase\.co.*$/, ".app") ?? "https://bethra.co";
    const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(recipient.email)}&campaign=${campaign.id}`;

    const vars: Record<string, string> = {
      first_name: firstName,
      full_name: recipient.full_name ?? "",
      email: recipient.email,
      app_name: "IdeaVault",
      cta_url: appUrl,
      unsubscribe_url: unsubscribeUrl,
    };

    const personalizedSubject = replacePlaceholders(subject, vars);
    const bodyWithUnsubscribe = campaign.body_html +
      `\n<p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:32px;">` +
      `You're receiving this because you signed up for IdeaVault. ` +
      `<a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a></p>`;
    const personalizedBody = replacePlaceholders(bodyWithUnsubscribe, vars);

    const emailPayload: Record<string, unknown> = {
      from: `${campaign.from_name} <${campaign.from_email}>`,
      to: [recipient.email],
      subject: personalizedSubject,
      html: personalizedBody,
      tags: [{ name: "campaign_id", value: campaign.id }],
    };

    if (campaign.reply_to) emailPayload.reply_to = campaign.reply_to;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(emailPayload),
    });

    const recipientStatus = res.ok ? "sent" : "failed";

    await supabase.from("campaign_recipients").insert({
      campaign_id: campaign.id,
      user_id: recipient.user_id,
      email: recipient.email,
      full_name: recipient.full_name,
      status: recipientStatus,
      ab_variant: abVariant,
      sent_at: res.ok ? new Date().toISOString() : null,
    });

    if (res.ok) sentCount++;
  }

  // Update campaign stats
  await supabase.from("marketing_campaigns").update({
    status: "sent",
    sent_at: new Date().toISOString(),
    total_recipients: eligible.length,
    sent_count: sentCount,
  }).eq("id", campaign_id);

  return new Response(JSON.stringify({ success: true, sent: sentCount, total: eligible.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
