import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkCronAuth } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLAN_PRICES: Record<string, number> = {
  builder:     19,
  launch:      29,
  family:      49,
  pro:         49,
  growth:      79,
  accelerator: 149,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const denied = checkCronAuth(req);
  if (denied) return denied;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Fetch all paying profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, plan")
      .not("plan", "in", '("free","")')
      .not("plan", "is", null);

    if (error) throw error;

    const counts: Record<string, number> = {};
    let totalMrr = 0;
    let totalCustomers = 0;

    for (const p of profiles ?? []) {
      const price = PLAN_PRICES[p.plan] ?? 0;
      if (price === 0) continue;
      counts[p.plan] = (counts[p.plan] ?? 0) + 1;
      totalMrr += price;
      totalCustomers++;
    }

    // Calculate new/churned MRR for this month from revenue_events
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { data: newEvents } = await supabase
      .from("revenue_events")
      .select("amount")
      .eq("event_type", "subscription_created")
      .gte("created_at", monthStart);

    const { data: churnEvents } = await supabase
      .from("revenue_events")
      .select("amount")
      .eq("event_type", "subscription_cancelled")
      .gte("created_at", monthStart);

    const newMrr = (newEvents ?? []).reduce((s: number, e: { amount: number }) => s + (e.amount ?? 0), 0);
    const churnedMrr = (churnEvents ?? []).reduce((s: number, e: { amount: number }) => s + (e.amount ?? 0), 0);

    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    await supabase.from("mrr_snapshots").upsert({
      month,
      total_mrr: totalMrr,
      total_customers: totalCustomers,
      new_mrr: newMrr,
      churned_mrr: churnedMrr,
      builder_count:     counts["builder"]     ?? 0,
      launch_count:      counts["launch"]      ?? 0,
      pro_count:         counts["pro"]         ?? 0,
      growth_count:      counts["growth"]      ?? 0,
      family_count:      counts["family"]      ?? 0,
      accelerator_count: counts["accelerator"] ?? 0,
    }, { onConflict: "month" });

    return new Response(JSON.stringify({ success: true, mrr: totalMrr, customers: totalCustomers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
