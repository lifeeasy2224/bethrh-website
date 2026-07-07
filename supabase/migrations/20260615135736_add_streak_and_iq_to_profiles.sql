-- Add streak tracking and stress test flag to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date date,
  ADD COLUMN IF NOT EXISTS stress_test_completed boolean NOT NULL DEFAULT false;