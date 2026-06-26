/*
  # Add role column to users table
  Adds `role` text column defaulting to 'user'.
  Values: 'user' | 'admin'
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'user';
  END IF;
END $$;
