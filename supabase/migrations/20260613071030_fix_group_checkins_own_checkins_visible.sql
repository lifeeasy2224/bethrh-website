
-- Add a direct policy so users can ALWAYS see their own check-ins,
-- regardless of the group-membership subquery evaluation.
-- Multiple SELECT policies are OR'd by PostgreSQL, so this supplements
-- the existing "Group members can view checkins for their groups" policy.
CREATE POLICY "Users can see own checkins"
  ON public.group_checkins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
