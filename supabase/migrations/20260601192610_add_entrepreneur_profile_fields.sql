/*
  # Add entrepreneur profile fields

  Adds optional profile enrichment fields for entrepreneur users:
  - `bio`: Free-text "about me" for the founder (shown to pod members)
  - `linkedin_url`: LinkedIn profile link
  - `sector`: Primary business sector the founder is working in
  - `goal`: Founder's stated goal (e.g., first customer, raise seed, launch MVP)

  These fields are nullable and only surfaced in the entrepreneur profile view.
  Investors already have `investor_preferences` for their specific fields.

  1. New Columns on `users`
    - `bio` (text, nullable)
    - `linkedin_url` (text, nullable)
    - `sector` (text, nullable)
    - `goal` (text, nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE users ADD COLUMN linkedin_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'sector'
  ) THEN
    ALTER TABLE users ADD COLUMN sector text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'goal'
  ) THEN
    ALTER TABLE users ADD COLUMN goal text;
  END IF;
END $$;
