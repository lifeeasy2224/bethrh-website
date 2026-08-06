// Shared bearer-token gate for internal edge functions invoked by pg_cron or by
// DB triggers (via the public._call_edge_function helper) — never by browsers.
//
// These functions are deployed with --no-verify-jwt so those DB-side callers can
// reach them without a Supabase JWT. This shared secret is the ACTUAL auth: the
// caller reads it from Vault (secret `cron_bearer_token`) and sends it as
// `Authorization: Bearer <token>`; the function compares it to the
// CRON_BEARER_TOKEN edge-function secret. Fails closed if the secret is unset.
export function checkCronAuth(req: Request): Response | null {
  const expected = Deno.env.get("CRON_BEARER_TOKEN");
  const authHeader = req.headers.get("authorization") ?? "";
  if (!expected || !authHeader.startsWith("Bearer ") || authHeader.slice(7) !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
