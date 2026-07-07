/*
  # Security Hardening: Functions and RLS Policies

  ## Summary
  Addresses all flagged security issues from the Supabase security linter.

  ## 1. Function Search Path Mutable
  Sets `search_path = ''` on three functions to prevent search_path injection attacks.
  Affected: cleanup_expired_admin_sessions, sync_library_view_count, sync_library_grab_count

  ## 2. SECURITY DEFINER Functions — Revoke Public Execute
  Revokes EXECUTE from `anon` and `authenticated` roles on five SECURITY DEFINER functions
  that should only be invoked internally (triggers, service role, etc.), never directly
  via the REST API.
  Affected:
    - cleanup_expired_admin_sessions
    - handle_new_user
    - sync_library_grab_count
    - sync_library_spots_taken
    - sync_library_view_count

  ## 3. RLS Enabled No Policy — Add Explicit Deny Policies
  Nine admin/system tables have RLS enabled but no policies, meaning all direct REST access
  is already blocked. Adding explicit USING (false) policies makes the intent clear and
  silences the security linter warning.
  Affected:
    - account_recovery_log
    - admin_action_log
    - admin_invites
    - admin_login_attempts
    - admin_notifications
    - admin_sessions
    - admin_users
    - site_analytics_daily
    - system_settings

  ## Notes
  - All admin/system tables are intentionally accessible only via the service-role edge
    function (admin-auth), which bypasses RLS. The deny policies enforce this contract
    at the RLS layer for any direct REST calls.
  - REVOKE on functions does not affect trigger-based or service-role invocations.
*/

-- ============================================================
-- 1. Fix mutable search_path on functions
-- ============================================================

ALTER FUNCTION public.cleanup_expired_admin_sessions() SET search_path = '';
ALTER FUNCTION public.sync_library_view_count() SET search_path = '';
ALTER FUNCTION public.sync_library_grab_count() SET search_path = '';

-- ============================================================
-- 2. Revoke EXECUTE on SECURITY DEFINER functions from client roles
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_admin_sessions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_library_grab_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_library_spots_taken() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_library_view_count() FROM anon, authenticated;

-- ============================================================
-- 3. Explicit deny policies for admin/system tables
--    (accessed exclusively via service-role edge functions)
-- ============================================================

CREATE POLICY "No direct client access — service role only"
  ON public.admin_users
  AS RESTRICTIVE FOR ALL
  TO public
  USING (false);

CREATE POLICY "No direct client access — service role only"
  ON public.admin_sessions
  AS RESTRICTIVE FOR ALL
  TO public
  USING (false);

CREATE POLICY "No direct client access — service role only"
  ON public.admin_invites
  AS RESTRICTIVE FOR ALL
  TO public
  USING (false);

CREATE POLICY "No direct client access — service role only"
  ON public.admin_login_attempts
  AS RESTRICTIVE FOR ALL
  TO public
  USING (false);

CREATE POLICY "No direct client access — service role only"
  ON public.admin_notifications
  AS RESTRICTIVE FOR ALL
  TO public
  USING (false);

CREATE POLICY "No direct client access — service role only"
  ON public.admin_action_log
  AS RESTRICTIVE FOR ALL
  TO public
  USING (false);

CREATE POLICY "No direct client access — service role only"
  ON public.account_recovery_log
  AS RESTRICTIVE FOR ALL
  TO public
  USING (false);

CREATE POLICY "No direct client access — service role only"
  ON public.site_analytics_daily
  AS RESTRICTIVE FOR ALL
  TO public
  USING (false);

CREATE POLICY "No direct client access — service role only"
  ON public.system_settings
  AS RESTRICTIVE FOR ALL
  TO public
  USING (false);
