/*
  # Add notes column to tasks table

  Adds an optional notes/reflection field to each task so founders can
  record what they learned while completing each weekly task in the 90-day journey.

  1. Changes
    - `tasks`: add `notes` (text, nullable) column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'notes'
  ) THEN
    ALTER TABLE tasks ADD COLUMN notes text;
  END IF;
END $$;
