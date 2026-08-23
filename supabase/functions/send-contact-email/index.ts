import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2.110.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Admin-session guard — same pattern as admin-db / send-campaign.
async function resolveSession(supabase: SupabaseClient<any>, token: string) {
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

// CAN-SPAM applies to commercial email regardless of volume — a one-off follow-up
// to an institutional contact still needs a working unsubscribe link and the
// sender's physical postal address in the body. Bulk gets these via the campaign
// footer (send-campaign); this single-send path includes them explicitly.
const SITE = "https://bethra.co";
const MAILING_ADDRESS = "Life Easy LLC · 44887 W Bahia Dr · Maricopa, AZ 85139";

// Brand shell for one-to-one outreach: deep-green background, بذرة wordmark in
// gold, light message text, Noto Kufi Arabic (Bethra's brand font) with a clean
// sans-serif fallback, RTL. The unsubscribe link + physical mailing address are
// appended exactly as IdeaIQ's version does, restyled to Bethra's palette.
const FONT = "'Noto Kufi Arabic',-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Arial,sans-serif";

function buildHtml(messageHtml: string, email: string): string {
  const unsubscribeUrl = `${SITE}/unsubscribe?email=${encodeURIComponent(email)}`;
  return `<div dir="rtl" style="margin:0;padding:0;background:#0F3D24;">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0F3D24;border-collapse:collapse;">`
    + `<tr><td align="center" style="padding:36px 16px;">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-collapse:collapse;">`
    + `<tr><td style="padding-bottom:22px;font-family:${FONT};font-size:26px;font-weight:700;letter-spacing:-0.3px;text-align:right;">`
    + `<span style="color:#D4A653;">بذرة</span>`
    + `</td></tr>`
    + `<tr><td style="font-family:${FONT};font-size:15px;line-height:1.65;color:#E8EDF5;text-align:right;">`
    + messageHtml
    + `</td></tr>`
    + `<tr><td style="padding-top:28px;">`
    + `<hr style="border:none;border-top:1px solid #1B6B3E;margin:0 0 12px;">`
    + `<p style="font-family:${FONT};font-size:11px;line-height:1.6;color:#8FA898;margin:0;text-align:right;">`
    + `وصلتك هذه الرسالة من بذرة. `
    + `<a href="${unsubscribeUrl}" style="color:#8FA898;text-decoration:underline;">إلغاء الاشتراك</a>.<br>`
    + `${MAILING_ADDRESS}`
    + `</p>`
    + `</td></tr>`
    + `</table></td></tr></table></div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabase = createClient<any>(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => ({}));

  // Admin-only.
  const admin = await resolveSession(supabase, body.session_token ?? "");
  if (!admin) return json({ error: "Unauthorized" }, 401);

  const email = String(body.email ?? "").trim().toLowerCase();
  const subject = String(body.subject ?? "").trim();
  const messageHtml = String(body.message ?? "").trim();
  const preview = body.preview === true;

  if (!email || !subject || !messageHtml) {
    return json({ error: "email, subject and message are required" }, 400);
  }

  // 1. CAN-SPAM: never send to a suppressed (unsubscribed) address — same block the
  //    bulk send-campaign applies. Checked BEFORE composing/sending.
  const { data: supp } = await supabase
    .from("email_suppression_list")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (supp) {
    return json({ error: "This address has unsubscribed and cannot be emailed.", blocked: true }, 409);
  }

  // 2. Compose with the required unsubscribe link + physical address.
  const html = buildHtml(messageHtml, email);

  // Preview mode: return the composed body without sending (used to confirm the
  // compliance elements are present before a real send).
  if (preview) {
    return json({ preview: true, to: email, subject, html });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY not configured" }, 500);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "بذرة <info@bethra.co>",
      to: [email],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return json({ error: `Send failed (${res.status}): ${errText}` }, 502);
  }

  return json({ success: true });
});
