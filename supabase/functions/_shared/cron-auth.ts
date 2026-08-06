// Shared bearer-token gate for cron-only edge functions.
//
// These functions are deployed with --no-verify-jwt so pg_cron can reach them
// without a Supabase JWT. This shared secret is the ACTUAL auth: pg_cron reads
// it from Vault (secret `cron_bearer_token`) and sends it as
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
