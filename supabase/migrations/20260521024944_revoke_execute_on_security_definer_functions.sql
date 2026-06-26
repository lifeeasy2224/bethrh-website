/*
  # Revoke public EXECUTE on SECURITY DEFINER functions

  ## Summary
  Three SECURITY DEFINER functions in the public schema were callable by the
  `anon` and `authenticated` roles via the PostgREST RPC endpoint, which is
  a security risk. This migration revokes EXECUTE from both roles for:

  1. `public.handle_new_user()` - internal trigger function, should never be
     callable directly by API clients.
  2. `public.is_admin()` - reads auth metadata to check admin status; exposing
     it publicly is unnecessary.
  3. `public.rls_auto_enable()` - utility/migration helper, must not be
     callable by any application role.

  ## Changes
  - REVOKE EXECUTE ON FUNCTION ... FROM anon, authenticated for all three functions.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
