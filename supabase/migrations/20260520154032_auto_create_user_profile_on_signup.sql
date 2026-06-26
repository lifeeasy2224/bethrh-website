/*
  # Auto-create user profile on signup

  Creates a database trigger that automatically inserts a row into the public.users
  table whenever a new user signs up via Supabase Auth. This ensures the profile
  always exists after signup without requiring a separate API call.

  - Trigger fires on INSERT to auth.users
  - Creates a matching row in public.users with default role 'user'
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, country, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'Syria',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
