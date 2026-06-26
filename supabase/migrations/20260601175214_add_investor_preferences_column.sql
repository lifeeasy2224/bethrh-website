/*
  # Add investor_preferences column to public.users

  1. Modified Tables
    - `public.users`
      - `investor_preferences` (jsonb, nullable) — stores investor investment preferences:
        preferred_sectors (text[]), check_size (text), preferred_stage (text), value_add (text)

  2. Notes
    - Column is nullable so existing rows are unaffected
    - No RLS changes needed; existing policies already cover this table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'investor_preferences'
  ) THEN
    ALTER TABLE public.users ADD COLUMN investor_preferences jsonb DEFAULT NULL;
  END IF;
END $$;
