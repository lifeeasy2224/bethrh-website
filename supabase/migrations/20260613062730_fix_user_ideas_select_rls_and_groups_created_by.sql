
-- Fix 1: user_ideas SELECT policy is TO anon only, so authenticated users cannot
-- read rows back after INSERT (causing "Failed to add idea" and grab failures).
-- Replace with a policy that covers all roles.
DROP POLICY IF EXISTS "Public can read user ideas" ON public.user_ideas;

CREATE POLICY "Anyone can read user ideas"
  ON public.user_ideas FOR SELECT
  USING (true);

-- Fix 2: accountability_groups INSERT policy checks created_by = auth.uid()
-- but the code inserts owner_id without created_by. The column is NOT NULL
-- with no default so the insert is rejected. Add created_by to the table
-- as a computed default so both columns stay in sync.
ALTER TABLE public.accountability_groups
  ALTER COLUMN created_by SET DEFAULT auth.uid();
