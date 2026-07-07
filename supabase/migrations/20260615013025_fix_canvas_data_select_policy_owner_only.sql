
-- The existing "Public can read canvas data" policy uses USING (true) which
-- exposes all canvas data to anyone (including anonymous users). Replace it
-- with an owner-only policy that mirrors the INSERT/UPDATE policies.
DROP POLICY IF EXISTS "Public can read canvas data" ON public.canvas_data;

CREATE POLICY "Users can read own canvas data"
  ON public.canvas_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_ideas
      WHERE user_ideas.id = canvas_data.user_idea_id
        AND user_ideas.user_id = auth.uid()
    )
  );
