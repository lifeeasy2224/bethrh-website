/*
  # Admin helper function + RLS policies

  Creates a security-definer function `is_admin()` that safely checks the
  current user's role without triggering recursive RLS, then applies
  admin-level SELECT/UPDATE policies across all tables.
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can view all ideas"
  ON ideas FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view all validation logs"
  ON validation_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view all pods"
  ON pods FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view all pod members"
  ON pod_members FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view all chats"
  ON ai_chats FOR SELECT
  TO authenticated
  USING (is_admin());
