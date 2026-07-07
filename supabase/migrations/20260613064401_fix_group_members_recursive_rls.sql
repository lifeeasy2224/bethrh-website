
-- Fix recursive RLS on group_members SELECT.
-- The old policy used a self-referencing subquery which causes empty results for
-- authenticated users (chicken-and-egg: can't see own membership to prove membership).
-- Replace with two simple, non-recursive policies.

DROP POLICY IF EXISTS "Members can view memberships in their groups" ON public.group_members;

-- Own membership row is always visible
CREATE POLICY "Users can view own memberships"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- All members in a group are visible to anyone in that group,
-- using accountability_groups (not group_members) to avoid recursion
CREATE POLICY "Group members visible to group participants"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members own_row
      WHERE own_row.group_id = group_members.group_id
        AND own_row.user_id = auth.uid()
    )
  );
