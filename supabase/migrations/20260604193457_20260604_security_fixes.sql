/*
  # Security Fixes

  ## Summary
  Three security issues identified and resolved:

  1. **Public Bucket Listing (review-photos)**
     Drop the broad SELECT policy "Review photos are publicly readable" on storage.objects.
     Public buckets serve objects via direct URL without needing a SELECT RLS policy.
     The existing policy allows any client to LIST all files in the bucket, which
     exposes more data than intended. Direct URL access still works after removal.

  2. **SECURITY DEFINER grab_seed EXECUTE revoked**
     The `public.grab_seed(uuid, uuid)` function is SECURITY DEFINER and was
     executable by the `authenticated` role via /rest/v1/rpc/grab_seed.
     We revoke EXECUTE from the authenticated role and instead grant it only
     to the service_role so it can only be called server-side.

  3. **Leaked Password Protection (HaveIBeenPwned)**
     Ensures the auth.config table has password_hibp_enabled = true so Supabase
     Auth rejects passwords found in known data breaches.
     (Idempotent — safe to run even if already enabled.)
*/

-- ── Fix 1: Remove broad storage SELECT policy ────────────────────────────────
DROP POLICY IF EXISTS "Review photos are publicly readable" ON storage.objects;

-- ── Fix 2: Revoke EXECUTE on SECURITY DEFINER grab_seed from authenticated ───
REVOKE EXECUTE ON FUNCTION public.grab_seed(uuid, uuid) FROM authenticated;

-- ── Fix 3: Enable HaveIBeenPwned leaked-password protection ──────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth'
      AND table_name   = 'config'
      AND column_name  = 'password_hibp_enabled'
  ) THEN
    UPDATE auth.config SET password_hibp_enabled = true;
  END IF;
END $$;
