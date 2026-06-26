/*
  # Fix is_admin() to read from JWT app_metadata

  Instead of querying the users table (which caused RLS recursion),
  read the role directly from the authenticated user's JWT app_metadata.
  This is faster, avoids recursion, and works even before the profile loads.
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;
