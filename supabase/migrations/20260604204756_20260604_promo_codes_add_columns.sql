/*
  # Add missing columns to promo_codes

  ## Changes
  - `description` (text) — optional human-readable note shown in the table
  - `max_uses` (integer) — cap on redemptions (NULL = unlimited)
  - `times_used` (integer DEFAULT 0) — running redemption counter
  - `created_by_email` (text) — denormalised creator email for display
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promo_codes' AND column_name = 'description'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN description text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promo_codes' AND column_name = 'max_uses'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN max_uses integer DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promo_codes' AND column_name = 'times_used'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN times_used integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promo_codes' AND column_name = 'created_by_email'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN created_by_email text DEFAULT '';
  END IF;
END $$;
