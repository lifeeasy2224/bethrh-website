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

// Legacy admin_sessions guard (the CURRENT live Vite admin console authenticates
// this way: an opaque session_token, past 2FA, not expired). Kept alongside the
// newer Supabase-JWT + app_metadata.role='admin' path so BOTH the live Vite admin
// and a future Next.js admin can trigger sends. Returns the admin_users row or null.
async function resolveSession(supabase: ReturnType<typeof createClient>, token: string) {
  if (!token) return null;
  const { data } = await supabase
    .from("admin_sessions")
    .select("*, admin_users(*)")
    .eq("token", token)
    .eq("is_pending_2fa", false)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!data) return null;
  await supabase.from("admin_sessions").update({
    last_active: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }).eq("id", data.id);
  return data.admin_users as Record<string, unknown>;
}

// ── Segment rule evaluation ──────────────────────────────────────────────────
// Ported from the admin CRM segment engine so a server-side send matches the
// admin console's audience preview exactly. Smart-segment rules are combined
// with AND, evaluated against the enriched_users view.
interface SegmentRule { field: string; operator: string; value: unknown; }

interface EnrichedUser {
  user_id: string;
  full_name: string | null;
  role: string | null;
  tier: string | null;
  lead_score: number;
  lifecycle_stage: string | null;
  user_status: string | null;
  last_login_at: string | null;
  created_at: string | null;
  login_count: number;
  iq_score: number | null;
  ideas_count: number;
}

interface Recipient { user_id: string | null; email: string; full_name: string | null; }

function daysBetween(date: string | null): number {
  if (!date) return 9999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function evaluateRule(user: EnrichedUser, rule: SegmentRule): boolean {
  const { field, operator, value } = rule;
  switch (field) {
    case "role":
      if (operator === "is") return user.role === value;
      if (operator === "is_not") return user.role !== value;
      break;
    case "tier":
      if (operator === "is") return (user.tier ?? "free") === value;
      if (operator === "is_not") return (user.tier ?? "free") !== value;
      if (operator === "in") return Array.isArray(value) && value.includes(user.tier ?? "free");
      if (operator === "not_in") return Array.isArray(value) && !value.includes(user.tier ?? "free");
      break;
    case "user_status": {
      const status = user.user_status ?? "inactive";
      if (operator === "is") return status === value;
      break;
    }
    case "lifecycle_stage": {
      const stage = user.lifecycle_stage ?? "new";
      if (operator === "is") return stage === value;
      break;
    }
    case "lead_score": {
      const s = user.lead_score ?? 0;
      if (operator === "gte") return s >= Number(value);
      if (operator === "lte") return s <= Number(value);
      if (operator === "equals") return s === Number(value);
      break;
    }
    case "iq_score": {
      const iq = user.iq_score ?? 0;
      if (operator === "gte") return iq >= Number(value);
      if (operator === "lte") return iq <= Number(value);
      if (operator === "equals") return iq === Number(value);
      break;
    }
    case "login_count": {
      const lc = user.login_count ?? 0;
      if (operator === "gte") return lc >= Number(value);
      if (operator === "lte") return lc <= Number(value);
      if (operator === "equals") return lc === Number(value);
      break;
    }
    case "ideas_count": {
      const ic = user.ideas_count ?? 0;
      if (operator === "gte") return ic >= Number(value);
      if (operator === "lte") return ic <= Number(value);
      if (operator === "equals") return ic === Number(value);
      break;
    }
    case "last_login_at": {
      const d = daysBetween(user.last_login_at);
      if (operator === "within_days") return d <= Number(value);
      if (operator === "more_than_days") return d > Number(value);
      break;
    }
    case "created_at": {
      const d = daysBetween(user.created_at);
      if (operator === "within_days") return d <= Number(value);
      if (operator === "more_than_days") return d > Number(value);
      break;
    }
  }
  return false;
}

function applyRules(users: EnrichedUser[], rules: SegmentRule[]): EnrichedUser[] {
  if (!rules?.length) return users;
  return users.filter((u) => rules.every((r) => evaluateRule(u, r)));
}

async function getRecipients(
  supabase: ReturnType<typeof createClient>,
  segmentId: string | null,
): Promise<{ recipients: Recipient[]; ruleCount: number; segmentType: string | null }> {
  if (!segmentId) return { recipients: [], ruleCount: 0, segmentType: null };

  const { data: seg } = await supabase
    .from("marketing_segments")
    .select("type, rules")
    .eq("id", segmentId)
    .single();
  if (!seg) return { recipients: [], ruleCount: 0, segmentType: null };

  const rules = (seg.rules ?? []) as SegmentRule[];

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authUsers: AuthUser[] = users ?? [];
  const emailById = new Map<string, string>();
  for (const u of authUsers) if (u.email) emailById.set(u.id, u.email);

  const out: Recipient[] = [];

  if (seg.type === "manual") {
    const { data: members } = await supabase
      .from("segment_members")
      .select("user_id")
      .eq("segment_id", segmentId);
    const memberIds = ((members ?? []) as { user_id: string }[]).map((m) => m.user_id);

    if (memberIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", memberIds);
      const nameById = new Map(
        ((profiles ?? []) as ProfileRow[]).map((p) => [p.user_id, p.full_name]),
      );
      for (const id of memberIds) {
        const email = emailById.get(id);
        if (email) out.push({ user_id: id, email, full_name: nameById.get(id) ?? null });
      }
    }

    const { data: memberships } = await supabase
      .from("contact_segments")
      .select("crm_contacts(email, full_name)")
      .eq("segment_id", segmentId);
    for (const m of ((memberships ?? []) as { crm_contacts: { email: string; full_name: string | null } | null }[])) {
      const c = m.crm_contacts;
      if (c?.email) out.push({ user_id: null, email: c.email, full_name: c.full_name ?? null });
    }
  } else {
    const { data: enriched } = await supabase.from("enriched_users").select("*");
    const matched = applyRules(((enriched ?? []) as EnrichedUser[]), rules);
    for (const u of matched) {
      const email = emailById.get(u.user_id);
      if (email) out.push({ user_id: u.user_id, email, full_name: u.full_name });
    }
  }

  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  for (const r of out) {
    const key = r.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push(r);
  }

  return { recipients, ruleCount: rules.length, segmentType: seg.type };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { campaign_id, session_token } = await req.json() as {
    campaign_id: string;
    session_token?: string;
  };

  // Admin guard — accept EITHER the legacy admin_sessions token (current live
  // Vite admin) OR a Supabase JWT with app_metadata.role='admin' (future Next.js
  // admin). Runs with the service-role key, so an unauthenticated caller must
  // never reach the send loop.
  let adminUserId: string | null = null;
  const legacyAdmin = await resolveSession(supabase, session_token ?? "");
  if (legacyAdmin) {
    adminUserId = legacyAdmin.id as string;
  } else {
    const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role;
    if (user && role === "admin") adminUserId = user.id;
  }
  if (!adminUserId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!campaign_id) {
    return new Response(JSON.stringify({ error: "campaign_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

  const { data: suppList } = await supabase.from("email_suppression_list").select("email");
  const suppressed = new Set(((suppList ?? []) as SuppressionRow[]).map((s) => s.email.toLowerCase()));

  const { recipients, ruleCount, segmentType } = await getRecipients(supabase, campaign.segment_id);
  const eligible = recipients.filter((r) => !suppressed.has(r.email.toLowerCase()));

  let sentCount = 0;

  for (const recipient of eligible) {
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
    const appUrl = "https://bethra.co";
    const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(recipient.email)}&campaign=${campaign.id}`;

    const vars: Record<string, string> = {
      first_name: firstName,
      full_name: recipient.full_name ?? "",
      email: recipient.email,
      app_name: "بذرة",
      cta_url: appUrl,
      unsubscribe_url: unsubscribeUrl,
    };

    const personalizedSubject = replacePlaceholders(subject, vars);
    // Single compliant footer (RTL): honest reason line, one working unsubscribe
    // link (→ bethra.co), and the physical mailing address. Campaign bodies must
    // not include their own footer/address.
    const bodyWithUnsubscribe = campaign.body_html +
      `\n<p dir="rtl" style="font-size:11px;color:#94a3b8;text-align:center;line-height:1.7;margin-top:32px;">` +
      `وصلتك هذه الرسالة من بذرة (Life Easy LLC). إن كنت تفضّل عدم استقبال رسائلنا، ` +
      `<a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">يمكنك إلغاء الاشتراك من هنا</a>.<br>` +
      `Life Easy LLC · 44887 W Bahia Dr · Maricopa, AZ 85139</p>`;
    const personalizedBody = replacePlaceholders(bodyWithUnsubscribe, vars);

    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const textBody = stripHtml(personalizedBody);

    const emailPayload: Record<string, unknown> = {
      from: `${campaign.from_name} <${campaign.from_email}>`,
      to: [recipient.email],
      subject: personalizedSubject,
      html: personalizedBody,
      text: textBody,
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

  await supabase.from("marketing_campaigns").update({
    status: "sent",
    sent_at: new Date().toISOString(),
    total_recipients: eligible.length,
    sent_count: sentCount,
  }).eq("id", campaign_id);

  // Audit trail: record which admin (auth user) triggered the send. Best-effort.
  await supabase.from("admin_action_log").insert({
    admin_user_id: adminUserId,
    action: "send_campaign",
    metadata: {
      campaign_id,
      segment_type: segmentType,
      rules_applied: ruleCount,
      matched: recipients.length,
      eligible: eligible.length,
      sent: sentCount,
    },
  });

  return new Response(JSON.stringify({ success: true, sent: sentCount, total: eligible.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
