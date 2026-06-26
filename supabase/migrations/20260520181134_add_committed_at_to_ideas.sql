/*
  # Add committed_at to ideas table

  ## Changes
  - `ideas` table: new nullable `committed_at` (timestamptz) column
    Records when a user clicked "التزام 90 يوم" on a public idea, saving it to their account.
  - `ideas` table: new nullable `committed_user_id` (uuid) column
    The user who committed to this idea (distinct from the original author user_id).

  ## Notes
  - NULL means no commitment made yet.
  - When a user commits, we set committed_at = now() and committed_user_id = auth.uid().
  - No destructive changes; only additive.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideas' AND column_name = 'committed_at'
  ) THEN
    ALTER TABLE ideas ADD COLUMN committed_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideas' AND column_name = 'committed_user_id'
  ) THEN
    ALTER TABLE ideas ADD COLUMN committed_user_id uuid DEFAULT NULL;
  END IF;
END $$;
