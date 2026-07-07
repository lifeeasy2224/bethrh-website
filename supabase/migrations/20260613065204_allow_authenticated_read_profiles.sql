
-- Allow authenticated users to search/view other users' public profile info.
-- Only basic fields (full_name, role, avatar_url) are needed for group member search.
-- This is standard in any social/community feature.
CREATE POLICY "Authenticated users can view public profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
