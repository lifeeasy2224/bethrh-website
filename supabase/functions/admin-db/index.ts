import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function ok(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Tables the admin console is permitted to reach through this function.
// Anything not listed here is rejected before a query is built.
const ALLOWED_TABLES = new Set<string>([
  "admin_crm_notes",
  "admin_crm_tags",
  "admin_user_tags",
  "campaign_recipients",
  "crm_contacts",
  "email_suppression_list",
  "enriched_users",
  "marketing_automations",
  "marketing_campaigns",
  "marketing_segments",
  "marketing_templates",
  "marketing_uploads",
  "mrr_snapshots",
  "profiles",
  "revenue_events",
  "sectors",
  "segment_members",
  "subscriptions",
  "user_activity_log",
  "user_ideas",
]);

// Mirrors admin-auth's session check: valid token, past 2FA, not expired.
async function resolveSession(supabase: SupabaseClient, token: string) {
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

interface DbBody {
  session_token?: string;
  table?: string;
  action?: string;
  columns?: string;
  match?: Record<string, unknown>;
  values?: Record<string, unknown> | Record<string, unknown>[];
  order?: { column: string; ascending?: boolean } | { column: string; ascending?: boolean }[];
  limit?: number;
  count?: "exact";
  head?: boolean;
  in?: Record<string, unknown[]>;
  notIn?: Record<string, unknown[]>;
  single?: boolean;
  returning?: string;
  onConflict?: string;
  ignoreDuplicates?: boolean;
  page?: number;
  perPage?: number;
}

// deno-lint-ignore no-explicit-any
function applyFilters(query: any, body: DbBody) {
  if (body.match) {
    for (const [col, val] of Object.entries(body.match)) query = query.eq(col, val);
  }
  if (body.in) {
    for (const [col, vals] of Object.entries(body.in)) query = query.in(col, vals);
  }
  if (body.notIn) {
    for (const [col, vals] of Object.entries(body.notIn)) {
      query = query.not(col, "in", `(${vals.map((v) => JSON.stringify(v)).join(",")})`);
    }
  }
  return query;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("Method not allowed", 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = (await req.json()) as DbBody;

    // Every call is gated on a valid admin session, server-side.
    const admin = await resolveSession(supabase, body.session_token ?? "");
    if (!admin) return err("Unauthorized", 401);

    const action = body.action;

    // ── Auth Admin API: list users (not a table query) ──────────────────────
    if (action === "list-users") {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: body.page,
        perPage: body.perPage ?? 1000,
      });
      if (error) return ok({ data: null, error: error.message });
      return ok({ data: { users: data.users } });
    }

    // ── Table CRUD ──────────────────────────────────────────────────────────
    const table = body.table;
    if (!table || !ALLOWED_TABLES.has(table)) {
      return err(`Table not allowed: ${table ?? "(none)"}`, 403);
    }

    if (action === "select") {
      let query = supabase.from(table).select(
        body.columns ?? "*",
        (body.count || body.head) ? { count: body.count, head: body.head } : undefined,
      );
      query = applyFilters(query, body);
      if (body.order) {
        const orders = Array.isArray(body.order) ? body.order : [body.order];
        for (const o of orders) query = query.order(o.column, { ascending: o.ascending ?? true });
      }
      if (typeof body.limit === "number") query = query.limit(body.limit);
      if (body.single) query = query.maybeSingle();
      const { data, count, error } = await query;
      return ok({ data, count: count ?? undefined, error: error?.message });
    }

    if (action === "insert" || action === "upsert") {
      // deno-lint-ignore no-explicit-any
      let query: any;
      if (action === "insert") {
        query = supabase.from(table).insert(body.values);
      } else {
        const upsertOpts: { onConflict?: string; ignoreDuplicates?: boolean } = {};
        if (body.onConflict) upsertOpts.onConflict = body.onConflict;
        if (typeof body.ignoreDuplicates === "boolean") upsertOpts.ignoreDuplicates = body.ignoreDuplicates;
        query = supabase.from(table).upsert(
          body.values,
          Object.keys(upsertOpts).length ? upsertOpts : undefined,
        );
      }
      if (body.returning) query = query.select(body.returning);
      else if (body.single) query = query.select();
      if (body.single) query = query.maybeSingle();
      const { data, error } = await query;
      return ok({ data, error: error?.message });
    }

    if (action === "update") {
      if (!body.match || Object.keys(body.match).length === 0) {
        return err("update requires a match");
      }
      let query = supabase.from(table).update(body.values);
      query = applyFilters(query, body);
      if (body.returning) query = query.select(body.returning);
      else if (body.single) query = query.select();
      if (body.single) query = query.maybeSingle();
      const { data, error } = await query;
      return ok({ data, error: error?.message });
    }

    if (action === "delete") {
      if (!body.match || Object.keys(body.match).length === 0) {
        return err("delete requires a match");
      }
      let query = supabase.from(table).delete();
      query = applyFilters(query, body);
      const { data, error } = await query;
      return ok({ data, error: error?.message });
    }

    return err(`Unknown action: ${action ?? "(none)"}`);
  } catch (e) {
    return err((e as Error).message ?? "Internal error", 500);
  }
});
