/*
  # Lock down SECURITY DEFINER helpers (codifies what is already live)

  These functions run as their owner (postgres) and bypass RLS, so any role
  that can EXECUTE them gets that power. Postgres grants EXECUTE to PUBLIC by
  default, and Supabase also grants anon/authenticated explicitly, so the
  signed-in browser client could call them via rpc(). They are only meant to
  be called server-side (edge functions with the service role, pg_cron, and
  the SECURITY DEFINER trg_send_* trigger functions, which run as postgres and
  are unaffected by these revokes).

  - _call_edge_function   — posts to edge functions with the Vault cron token
  - send_weekly_digests   — cron entry point
  - increment_total_revenue — called by stripe-webhook
  - get_user_email        — returned ANY user's email to any caller. Also
    revoked from authenticated (as live): the three browser callers
    (ValidatePage, ConnectionChatPage, IdeaDetailPage) now fail and need a
    server-side replacement.
  - increment_promo_uses  — now returns boolean and claims a use atomically:
    the conditions are re-checked inside the single UPDATE, so two checkouts
    racing for the last use can't both succeed. stripe-checkout rejects the
    checkout when it returns false.
*/

-- ── Server-only helpers ──────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public._call_edge_function(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public._call_edge_function(text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.send_weekly_digests() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.send_weekly_digests() TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_total_revenue(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_total_revenue(uuid, numeric) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_email(uuid) TO service_role;

-- ── increment_promo_uses: void → boolean, atomic claim ───────────────────────
-- The return type changes, so the function must be dropped, not replaced.
DROP FUNCTION IF EXISTS public.increment_promo_uses(uuid);

CREATE FUNCTION public.increment_promo_uses(code_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  with u as (
    update public.promo_codes
       set uses_count = uses_count + 1
     where id = code_id
       and is_active
       and (expires_at is null or expires_at > now())
       and (max_uses is null or uses_count < max_uses)
    returning 1
  ) select exists (select 1 from u);
$function$;

REVOKE EXECUTE ON FUNCTION public.increment_promo_uses(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_promo_uses(uuid) TO service_role;
