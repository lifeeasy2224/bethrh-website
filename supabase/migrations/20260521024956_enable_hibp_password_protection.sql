/*
  # Enable HaveIBeenPwned leaked-password protection

  ## Summary
  Supabase Auth can check new/updated passwords against the HaveIBeenPwned.org
  database to prevent users from choosing known-compromised passwords.
  This migration enables that feature via the auth.config table.

  ## Changes
  - Sets `password_hibp_enabled = true` in auth.config if the column exists.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth'
      AND table_name   = 'config'
      AND column_name  = 'password_hibp_enabled'
  ) THEN
    UPDATE auth.config SET password_hibp_enabled = true;
  END IF;
END $$;
