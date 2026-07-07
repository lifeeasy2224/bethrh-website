ALTER TABLE pitch_data
  ADD COLUMN IF NOT EXISTS elevator_pitch text,
  ADD COLUMN IF NOT EXISTS pitch_problem text,
  ADD COLUMN IF NOT EXISTS pitch_solution text,
  ADD COLUMN IF NOT EXISTS target_market text,
  ADD COLUMN IF NOT EXISTS revenue_model text,
  ADD COLUMN IF NOT EXISTS projected_roi text,
  ADD COLUMN IF NOT EXISTS break_even_summary text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
