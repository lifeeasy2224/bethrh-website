
-- Replace the still-recursive policy with a truly non-recursive one.
-- group_members rows are not sensitive — they're visible on public group pages anyway.
-- Allow all authenticated users to read all group_members rows.
DROP POLICY IF EXISTS "Group members visible to group participants" ON public.group_members;

CREATE POLICY "Authenticated users can view all group members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);
