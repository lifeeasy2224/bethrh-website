import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Founder-facing download endpoint for the "Founder Resources" library.
//
// Deployed with verify_jwt = ON. Note that the gateway's JWT check alone is NOT
// sufficient: the public anon key is itself a valid JWT, so we must additionally
// prove the caller is a real signed-in user. We do that with auth.getUser() on
// the caller's token (the anon key resolves to no user → refused), then re-check
// is_published server-side with the service role before minting a short-lived
// signed URL. Unpublished rows and unauthenticated callers get no URL.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET = "resource-documents";
const SIGNED_URL_TTL = 300; // seconds (5 min)

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("Method not allowed", 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Prove a REAL signed-in user is calling (not just the anon key). getUser()
    // validates the token against auth; the anon key resolves to no user.
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return err("Unauthorized", 401);

    const body = (await req.json().catch(() => ({}))) as { id?: string };
    const id = (body.id ?? "").trim();
    if (!id) return err("Missing id");

    // Re-check is_published server-side with the service role. Never trust the
    // client, and never expose an unpublished resource.
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: doc, error: docErr } = await admin
      .from("resource_documents")
      .select("id, file_path, file_name, is_published")
      .eq("id", id)
      .maybeSingle();
    if (docErr) return err(docErr.message, 500);
    if (!doc || !doc.is_published) return err("Resource not found", 404);

    const { data: signed, error: signErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path as string, SIGNED_URL_TTL, {
        download: (doc.file_name as string) ?? true,
      });
    if (signErr || !signed) return err(`Could not create download link: ${signErr?.message ?? "unknown"}`, 500);

    return ok({ url: signed.signedUrl, file_name: doc.file_name, expires_in: SIGNED_URL_TTL });
  } catch (e) {
    return err((e as Error).message ?? "Internal error", 500);
  }
});
