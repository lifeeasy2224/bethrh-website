import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WINDOW_MS = 35 * 60 * 1000; // ±35 min window around target time (hourly CRON)
const FROM_EMAIL = "noreply@bethra.co";
const FROM_NAME = "IdeaVault";

interface Automation {
  id: string;
  name: string;
  trigger_type: string;
  delay_hours: number;
  template_id: string | null;
  segment_id: string | null;
  frequency_cap: number;
  times_triggered: number;
  marketing_templates: { subject: string; body_html: string } | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  plan: string | null;
  visited_pricing: boolean | null;
  created_at: string | null;
}

function replacePlaceholders(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const now = new Date();
  let totalSent = 0;

  try {
    // Load all active automations with their template
    const { data: automations, error: autoErr } = await supabase
      .from("marketing_automations")
      .select("id, name, trigger_type, delay_hours, template_id, segment_id, frequency_cap, times_triggered, marketing_templates(subject, body_html)")
      .eq("status", "active");

    if (autoErr) throw autoErr;
    if (!automations?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No active automations" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load auth users once
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const userMap = new Map((authUsers ?? []).map(u => [u.id, u]));

    // Load profiles once
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, plan, visited_pricing, created_at");
    const profileMap = new Map(((profiles ?? []) as Profile[]).map(p => [p.user_id, p]));

    for (const automation of (automations as Automation[])) {
      if (!automation.template_id || !automation.marketing_templates) continue;

      const targetTime = new Date(now.getTime() - automation.delay_hours * 3600000);
      const windowStart = new Date(targetTime.getTime() - WINDOW_MS);
      const windowEnd = new Date(targetTime.getTime() + WINDOW_MS);

      let candidateIds: string[] = [];

      switch (automation.trigger_type) {
        case "signup": {
          candidateIds = (authUsers ?? [])
            .filter(u => {
              const t = new Date(u.created_at);
              return t >= windowStart && t <= windowEnd;
            })
            .map(u => u.id);
          break;
        }

        case "inactive_7_days":
        case "inactive_14_days":
        case "inactive_30_days": {
          const days = automation.trigger_type === "inactive_7_days" ? 7
            : automation.trigger_type === "inactive_14_days" ? 14 : 30;
          const threshold = new Date(now.getTime() - days * 86400000);
          candidateIds = (authUsers ?? [])
            .filter(u => {
              const lastSeen = u.last_sign_in_at ? new Date(u.last_sign_in_at) : new Date(u.created_at);
              return lastSeen <= threshold;
            })
            .map(u => u.id);
          break;
        }

        case "pricing_page_visited": {
          const PAYING = ["builder", "launch", "family", "pro", "growth", "accelerator"];
          candidateIds = ((profiles ?? []) as Profile[])
            .filter(p => p.visited_pricing && !PAYING.includes(p.plan ?? ""))
            .map(p => p.user_id);
          break;
        }

        case "plan_upgraded":
        case "plan_cancelled": {
          const eventType = automation.trigger_type === "plan_upgraded"
            ? "subscription_created" : "subscription_cancelled";
          const { data: events } = await supabase
            .from("revenue_events")
            .select("user_id")
            .eq("event_type", eventType)
            .gte("created_at", windowStart.toISOString())
            .lte("created_at", windowEnd.toISOString());
          candidateIds = (events ?? []).map((e: { user_id: string }) => e.user_id);
          break;
        }

        case "first_idea_created": {
          const { data: recentIdeas } = await supabase
            .from("user_ideas")
            .select("user_id")
            .gte("created_at", windowStart.toISOString())
            .lte("created_at", windowEnd.toISOString());
          const recentUsers = [...new Set((recentIdeas ?? []).map((i: { user_id: string }) => i.user_id))];
          for (const userId of recentUsers) {
            const { count } = await supabase
              .from("user_ideas")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId);
            if ((count ?? 0) === 1) candidateIds.push(userId);
          }
          break;
        }

        case "milestone_completed": {
          const { data: milestones } = await supabase
            .from("milestone_logs")
            .select("user_id")
            .gte("created_at", windowStart.toISOString())
            .lte("created_at", windowEnd.toISOString());
          candidateIds = [...new Set((milestones ?? []).map((m: { user_id: string }) => m.user_id))];
          break;
        }

        case "canvas_completed": {
          // Find canvas_data updated in window where all 9 blocks are filled
          const { data: canvases } = await supabase
            .from("canvas_data")
            .select("user_id, data")
            .gte("updated_at", windowStart.toISOString())
            .lte("updated_at", windowEnd.toISOString());
          for (const c of (canvases ?? []) as Array<{ user_id: string; data: unknown }>) {
            const blocks = c.data as Record<string, string> | null;
            if (blocks && Object.values(blocks).filter(v => v?.trim()).length >= 9) {
              candidateIds.push(c.user_id);
            }
          }
          break;
        }

        case "review_request": {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
          candidateIds = (authUsers ?? [])
            .filter(u => new Date(u.created_at) <= thirtyDaysAgo && u.last_sign_in_at)
            .map(u => u.id);
          break;
        }

        default:
          continue;
      }

      if (!candidateIds.length) continue;

      // Apply segment filter if set
      let allowedIds = new Set(candidateIds);
      if (automation.segment_id) {
        const { data: members } = await supabase
          .from("segment_members")
          .select("user_id")
          .eq("segment_id", automation.segment_id);
        const segIds = new Set((members ?? []).map((m: { user_id: string }) => m.user_id));
        allowedIds = new Set([...allowedIds].filter(id => segIds.has(id)));
      }

      if (!allowedIds.size) continue;

      // Check frequency cap
      const { data: logs } = await supabase
        .from("automation_logs")
        .select("user_id")
        .eq("automation_id", automation.id)
        .in("user_id", [...allowedIds]);

      const sendCounts: Record<string, number> = {};
      for (const log of (logs ?? []) as Array<{ user_id: string }>) {
        sendCounts[log.user_id] = (sendCounts[log.user_id] ?? 0) + 1;
      }

      const eligibleIds = [...allowedIds].filter(id => (sendCounts[id] ?? 0) < automation.frequency_cap);
      if (!eligibleIds.length) continue;

      const template = automation.marketing_templates;
      let sentCount = 0;

      for (const userId of eligibleIds) {
        const authUser = userMap.get(userId);
        if (!authUser?.email) continue;

        const profile = profileMap.get(userId);
        const firstName = profile?.full_name?.split(" ")[0] ?? "";
        const vars: Record<string, string> = {
          first_name: firstName,
          full_name: profile?.full_name ?? "",
          email: authUser.email,
          app_name: "IdeaVault",
          cta_url: "https://bethra.co",
        };

        const subject = replacePlaceholders(template.subject, vars);
        const html = replacePlaceholders(template.body_html, vars);

        if (!RESEND_API_KEY) {
          await supabase.from("automation_logs").insert({
            automation_id: automation.id,
            user_id: userId,
            email: authUser.email,
            status: "skipped",
            reason: "RESEND_API_KEY not configured",
          });
          continue;
        }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [authUser.email],
            subject,
            html,
            tags: [{ name: "automation_id", value: automation.id }],
          }),
        });

        await supabase.from("automation_logs").insert({
          automation_id: automation.id,
          user_id: userId,
          email: authUser.email,
          status: res.ok ? "sent" : "failed",
          reason: res.ok ? null : `HTTP ${res.status}`,
        });

        if (res.ok) sentCount++;
      }

      if (sentCount > 0) {
        await supabase.from("marketing_automations").update({
          times_triggered: (automation.times_triggered ?? 0) + sentCount,
          last_triggered_at: now.toISOString(),
          updated_at: now.toISOString(),
        }).eq("id", automation.id);
      }

      totalSent += sentCount;
    }

    return new Response(JSON.stringify({ success: true, sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
