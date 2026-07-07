/*
  # Security Fix: Storage Listing Policy and Function Execute Permissions

  ## Problems Fixed

  ### 1. Public Bucket Allows Listing
  - The "Anyone can view review photos" SELECT policy grants TO public, allowing clients to
    list all files in the review-photos bucket. Public buckets serve direct object URLs
    without needing this policy.
  - Fix: Drop the broad public SELECT policy. Add a restricted policy so authenticated
    users can only access files within their own folder.

  ### 2. Public Can Execute SECURITY DEFINER Functions
  - Five functions were accessible via /rest/v1/rpc by anon and authenticated roles.
  - Previous migrations revoked from anon/authenticated directly, but PostgreSQL's PUBLIC
    role still granted EXECUTE access (roles inherit from PUBLIC by default).
  - Fix: Revoke EXECUTE from PUBLIC on all five affected functions. Trigger-based and
    service_role invocations are unaffected by this change.

  ## Changes

  ### Storage
  - DROP: "Anyone can view review photos" (TO public SELECT on storage.objects)
  - ADD: "Authenticated users can view own review photos" (TO authenticated, own folder only)

  ### Functions (REVOKE EXECUTE FROM PUBLIC)
  - public.cleanup_expired_admin_sessions()
  - public.handle_new_user()
  - public.sync_library_grab_count()
  - public.sync_library_spots_taken()
  - public.sync_library_view_count()
*/

-- 1. Drop the broad public SELECT policy on review-photos
DROP POLICY IF EXISTS "Anyone can view review photos" ON storage.objects;

-- Add restricted SELECT policy: authenticated users can only read from their own folder
CREATE POLICY "Authenticated users can view own review photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'review-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 2. Revoke EXECUTE from PUBLIC on all affected SECURITY DEFINER functions.
-- Revoking from PUBLIC removes access for all roles (including anon and authenticated)
-- since they inherit default grants through PUBLIC.
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_admin_sessions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_library_grab_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_library_spots_taken() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_library_view_count() FROM PUBLIC;
