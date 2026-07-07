
-- Add the remaining missing policies identified in the audit

-- validation_entries: add UPDATE for completeness
CREATE POLICY "Users can update own validation entries"
  ON public.validation_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_ideas
      WHERE user_ideas.id = validation_entries.user_idea_id
        AND user_ideas.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_ideas
      WHERE user_ideas.id = validation_entries.user_idea_id
        AND user_ideas.user_id = auth.uid()
    )
  );

-- user_reviews: add UPDATE and DELETE
CREATE POLICY "Users can update own reviews"
  ON public.user_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.user_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- saved_ideas: add UPDATE
CREATE POLICY "Investors can update saved ideas"
  ON public.saved_ideas FOR UPDATE
  TO authenticated
  USING (auth.uid() = investor_id)
  WITH CHECK (auth.uid() = investor_id);
