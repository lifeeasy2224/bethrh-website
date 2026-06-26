/*
  # Fix is_admin() function to use SECURITY DEFINER

  The is_admin() function was querying the users table with RLS enabled,
  causing infinite recursion: ideas RLS calls is_admin() -> queries users ->
  users RLS calls is_admin() -> infinite loop -> permission denied.

  Fix: redefine is_admin() with SECURITY DEFINER so it bypasses RLS when
  checking the users table, breaking the recursion.
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$;
