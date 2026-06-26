/*
  # Fix is_admin() EXECUTE grant for RLS policies

  ## Problem
  Revoking EXECUTE on is_admin() from the `authenticated` role broke all RLS
  policies that call is_admin() internally. Postgres evaluates RLS policy
  expressions as the calling role, so authenticated users cannot access any
  table whose RLS policy references is_admin().

  ## Fix
  - Re-grant EXECUTE on is_admin() to `authenticated` so RLS policies work.
  - Keep is_admin() revoked from `anon` (anonymous users should never hit it).
  - handle_new_user() and rls_auto_enable() remain revoked from both roles
    since they are never referenced in RLS policies.

  ## Security note
  is_admin() only reads from auth.jwt() — it cannot mutate data. Granting
  authenticated EXECUTE is safe and required for the RLS policy expressions
  to function. The security concern (REST RPC exposure) is mitigated by the
  fact that calling it returns a boolean based on the caller's own JWT, so
  a normal user simply gets `false` — no privilege escalation is possible.
*/

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
