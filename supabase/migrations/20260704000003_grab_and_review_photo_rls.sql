-- Fixes two "insert silently denied" bugs found in live testing (2026-07-04).
-- Both are RLS gaps: the write succeeds partway, then a second write is denied,
-- so the UI shows an error even though the first row was created.
-- All statements idempotent / safe to re-run. Verify live state first
-- (this DB has drifted from earlier migrations).

-- ============================================================================
-- 1. library_grabs INSERT — "Grab This Idea" -> "Something went wrong", but the
--    idea DOES appear in the founder's Journey.
--
--    Flow (IdeasLibraryCustomizePage.handleGrab): insert into user_ideas (works,
--    hence the idea shows up), THEN insert into library_grabs (denied -> throws
--    -> generic error). Without an owner INSERT policy, authenticated inserts
--    default-deny. Allow a user to record their own grab.
-- ============================================================================
ALTER TABLE public.library_grabs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can record own grabs" ON public.library_grabs;
CREATE POLICY "Users can record own grabs"
  ON public.library_grabs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owner can read their own grab rows (the page counts existing grabs on load).
DROP POLICY IF EXISTS "Users can read own grabs" ON public.library_grabs;
CREATE POLICY "Users can read own grabs"
  ON public.library_grabs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 2. review-photos storage bucket — "Unable to upload founder photo".
--    ReviewDialog uploads to storage bucket 'review-photos' at path
--    "<user_id>/<timestamp>.<ext>", then getPublicUrl(). The upload error is
--    swallowed, so a denied upload just means no photo is saved.
--
--    Needs: (a) an INSERT policy letting a user write into their own folder,
--    and (b) public read so getPublicUrl() resolves. Also make the bucket
--    public. Adjust if you'd rather keep photos private + signed URLs.
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Users can upload own review photos" ON storage.objects;
CREATE POLICY "Users can upload own review photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'review-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Anyone can read review photos" ON storage.objects;
CREATE POLICY "Anyone can read review photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-photos');
