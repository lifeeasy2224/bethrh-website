import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

// Admin CRUD for the "Founder Resources" library (public.resource_documents +
// the private 'resource-documents' bucket). Admins are NOT Supabase auth users,
// so this runs on the service role behind the same admin_sessions guard used by
// admin-db / admin-auth / send-campaign, and is deployed with --no-verify-jwt
// (the anon-key JWT only proves *some* caller; the real check is resolveSession).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET = "resource-documents";
const MAX_FILE_BYTES = 26214400; // 25 MB — mirrors the bucket's file_size_limit
const ALLOWED_MIME = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/png",
  "image/jpeg",
]);

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

// Identical admin-session guard to admin-db/admin-auth: valid token, past 2FA,
// not expired. Returns the admin_users row, or null when unauthorized.
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

// Keep a storage object key safe and predictable: a random folder + a cleaned
// file name. The random folder guarantees uniqueness without leaking anything.
function buildPath(fileName: string): string {
  const clean = (fileName || "file")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "file";
  return `${crypto.randomUUID()}/${clean}`;
}

interface Body {
  session_token?: string;
  action?: string;
  // create-upload-url
  file_name?: string;
  mime_type?: string;
  size_bytes?: number;
  // finalize
  path?: string;
  title?: string;
  description?: string;
  category?: string;
  // update
  id?: string;
  patch?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("Method not allowed", 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = (await req.json().catch(() => ({}))) as Body;

    // Every action is gated on a valid admin session, server-side.
    const admin = await resolveSession(supabase, body.session_token ?? "");
    if (!admin) return err("Unauthorized", 401);

    const action = body.action;

    // ── list (admin sees ALL rows, published + unpublished) ──────────────────
    if (action === "list") {
      const { data, error } = await supabase
        .from("resource_documents")
        .select("*")
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) return err(error.message, 500);
      return ok({ documents: data ?? [] });
    }

    // ── create-upload-url (issue a short-lived signed upload URL) ────────────
    if (action === "create-upload-url") {
      const fileName = (body.file_name ?? "").trim();
      const mime = (body.mime_type ?? "").trim();
      const size = Number(body.size_bytes ?? 0);
      if (!fileName) return err("Missing file_name");
      if (!ALLOWED_MIME.has(mime)) return err(`Unsupported file type: ${mime || "(none)"}`);
      if (!Number.isFinite(size) || size <= 0) return err("Missing or invalid size_bytes");
      if (size > MAX_FILE_BYTES) {
        return err(`File is too large. Max ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB.`);
      }

      const path = buildPath(fileName);
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error || !data) return err(`Could not create upload URL: ${error?.message ?? "unknown"}`, 500);
      return ok({ path, token: data.token, signed_url: data.signedUrl });
    }

    // ── finalize (record the row after the client upload succeeds) ───────────
    if (action === "finalize") {
      const path = (body.path ?? "").trim();
      const title = (body.title ?? "").trim();
      const fileName = (body.file_name ?? "").trim();
      const mime = (body.mime_type ?? "").trim();
      const size = Number(body.size_bytes ?? 0);
      if (!path || !title || !fileName) return err("Missing path, title, or file_name");
      if (mime && !ALLOWED_MIME.has(mime)) return err(`Unsupported file type: ${mime}`);

      // Confirm the object actually landed in the bucket before recording a row,
      // so a row never points at a missing object.
      const slash = path.indexOf("/");
      const folder = slash >= 0 ? path.slice(0, slash) : "";
      const base = slash >= 0 ? path.slice(slash + 1) : path;
      const { data: listed } = await supabase.storage.from(BUCKET).list(folder);
      const exists = (listed ?? []).some((o: { name: string }) => o.name === base);
      if (!exists) return err("Upload not found in storage — please retry the upload.", 409);

      const { data, error } = await supabase
        .from("resource_documents")
        .insert({
          title,
          description: (body.description ?? "").trim() || null,
          category: (body.category ?? "General").trim() || "General",
          file_path: path,
          file_name: fileName,
          size_bytes: Number.isFinite(size) && size > 0 ? size : null,
          mime_type: mime || null,
          is_published: false,
          uploaded_by: (admin.email as string) ?? null,
        })
        .select()
        .single();
      if (error) {
        // Roll back the orphaned object so nothing invalid lingers in storage.
        await supabase.storage.from(BUCKET).remove([path]);
        return err(`Could not save the resource: ${error.message}`, 500);
      }
      return ok({ document: data }, 201);
    }

    // ── update (metadata: title/description/category/is_published/sort_order) ─
    if (action === "update") {
      const id = (body.id ?? "").trim();
      const patch = body.patch ?? {};
      if (!id) return err("Missing id");
      const allowed = ["title", "description", "category", "is_published", "sort_order"];
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const k of allowed) {
        if (k in patch) updates[k] = patch[k as keyof typeof patch];
      }
      if (Object.keys(updates).length === 1) return err("No updatable fields provided");
      const { data, error } = await supabase
        .from("resource_documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) return err(error.message, 500);
      return ok({ document: data });
    }

    // ── delete (remove the storage object AND the row) ───────────────────────
    if (action === "delete") {
      const id = (body.id ?? "").trim();
      if (!id) return err("Missing id");
      const { data: row } = await supabase
        .from("resource_documents")
        .select("id, file_path")
        .eq("id", id)
        .maybeSingle();
      if (!row) return err("Resource not found", 404);

      const { error: rmErr } = await supabase.storage.from(BUCKET).remove([row.file_path as string]);
      if (rmErr) return err(`Could not delete the file: ${rmErr.message}`, 500);
      const { error: delErr } = await supabase.from("resource_documents").delete().eq("id", id);
      if (delErr) return err(delErr.message, 500);
      return ok({ success: true, removed_path: row.file_path });
    }

    return err(`Unknown action: ${action ?? "(none)"}`);
  } catch (e) {
    return err((e as Error).message ?? "Internal error", 500);
  }
});
