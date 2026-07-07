/*
  # Security Hardening — RLS Policies and Function Security

  ## Summary
  Addresses all flagged security vulnerabilities:

  1. Function Search Path Mutable
     - Re-create `handle_new_user` and `sync_library_spots_taken` with `SET search_path = public`
       to prevent search_path injection attacks.

  2. Public Can Execute SECURITY DEFINER Functions
     - Revoke EXECUTE on both trigger functions from `anon` and `authenticated` roles.
       These are trigger-only functions and must never be callable via REST API.

  3. RLS Policy Always True — Write Policies
     - seeds: Drop anon INSERT/UPDATE/DELETE (admin-managed table, no user ownership column).
     - user_ideas: Replace unrestricted anon writes with authenticated owner-scoped policies.
     - canvas_data: Replace unrestricted anon writes with authenticated owner-scoped policies
       (ownership verified via user_ideas.user_id = auth.uid()).
     - journey_tasks: Replace unrestricted anon writes with authenticated owner-scoped policies
       (ownership verified via user_ideas.user_id = auth.uid()).
     - validation_entries: Replace unrestricted anon writes with authenticated owner-scoped policies
       (ownership verified via user_ideas.user_id = auth.uid()).
     - library_idea_views: Replace unrestricted public INSERT with two scoped policies:
       authenticated inserts must match auth.uid(), anon inserts must have user_id IS NULL.

  ## Security Impact
  - Eliminates unauthenticated write access to all user-data tables.
  - Prevents privilege escalation through SECURITY DEFINER function calls.
  - Locks down trigger functions to be callable only by the database engine.
*/

-- ============================================================
-- 1. Fix function search_path (prevents search_path injection)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'founder')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_library_spots_taken()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.library_ideas
      SET spots_taken = spots_taken + 1, updated_at = now()
      WHERE id = NEW.library_idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.library_ideas
      SET spots_taken = GREATEST(spots_taken - 1, 0), updated_at = now()
      WHERE id = OLD.library_idea_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 2. Revoke direct REST API execution from both trigger functions
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_library_spots_taken() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_library_spots_taken() FROM authenticated;

-- ============================================================
-- 3. seeds — remove anon write access (admin-managed table)
-- ============================================================

DROP POLICY IF EXISTS "Public can insert seeds" ON public.seeds;
DROP POLICY IF EXISTS "Public can update seeds" ON public.seeds;
DROP POLICY IF EXISTS "Public can delete seeds" ON public.seeds;

-- ============================================================
-- 4. user_ideas — scope writes to authenticated owners only
-- ============================================================

DROP POLICY IF EXISTS "Public can insert user ideas" ON public.user_ideas;
DROP POLICY IF EXISTS "Public can update user ideas" ON public.user_ideas;
DROP POLICY IF EXISTS "Public can delete user ideas" ON public.user_ideas;

CREATE POLICY "Users can insert own ideas"
  ON public.user_ideas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ideas"
  ON public.user_ideas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own ideas"
  ON public.user_ideas FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 5. canvas_data — scope writes to owners via user_idea_id
-- ============================================================

DROP POLICY IF EXISTS "Public can insert canvas data" ON public.canvas_data;
DROP POLICY IF EXISTS "Public can update canvas data" ON public.canvas_data;

CREATE POLICY "Users can insert own canvas data"
  ON public.canvas_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_ideas
      WHERE user_ideas.id = canvas_data.user_idea_id
        AND user_ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own canvas data"
  ON public.canvas_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_ideas
      WHERE user_ideas.id = canvas_data.user_idea_id
        AND user_ideas.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_ideas
      WHERE user_ideas.id = canvas_data.user_idea_id
        AND user_ideas.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. journey_tasks — scope writes to owners via user_idea_id
-- ============================================================

DROP POLICY IF EXISTS "Public can insert journey tasks" ON public.journey_tasks;
DROP POLICY IF EXISTS "Public can delete journey tasks" ON public.journey_tasks;

CREATE POLICY "Users can insert own journey tasks"
  ON public.journey_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_ideas
      WHERE user_ideas.id = journey_tasks.user_idea_id
        AND user_ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own journey tasks"
  ON public.journey_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_ideas
      WHERE user_ideas.id = journey_tasks.user_idea_id
        AND user_ideas.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. validation_entries — scope writes to owners via user_idea_id
-- ============================================================

DROP POLICY IF EXISTS "Public can insert validation entries" ON public.validation_entries;
DROP POLICY IF EXISTS "Public can delete validation entries" ON public.validation_entries;

CREATE POLICY "Users can insert own validation entries"
  ON public.validation_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_ideas
      WHERE user_ideas.id = validation_entries.user_idea_id
        AND user_ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own validation entries"
  ON public.validation_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_ideas
      WHERE user_ideas.id = validation_entries.user_idea_id
        AND user_ideas.user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. library_idea_views — scope INSERT by user type
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert views" ON public.library_idea_views;

CREATE POLICY "Authenticated users can insert own views"
  ON public.library_idea_views FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anon users can insert anonymous views"
  ON public.library_idea_views FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
