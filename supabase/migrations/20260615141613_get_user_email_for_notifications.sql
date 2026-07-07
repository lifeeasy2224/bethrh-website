CREATE OR REPLACE FUNCTION get_user_email(target_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = target_user_id;
$$;

GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO authenticated;
