/*
  # Create user_reviews table

  1. New Tables
    - `user_reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `trigger_type` (text) — 'stage_complete' | 'high_score' | 'investor_connect'
      - `stage_name` (text, nullable) — e.g. 'Validation', 'Canvas', 'Pitch', '90-Day'
      - `rating` (integer, 1-5)
      - `feedback` (text)
      - `photo_url` (text, nullable)
      - `idea_id` (uuid, nullable) — which idea the review relates to
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `user_reviews`
    - Authenticated users can insert their own reviews
    - Authenticated users can read their own reviews

  3. Notes
    - Admin can read all reviews (via service role)
    - rating is required (1-5) and feedback can be empty
*/

CREATE TABLE IF NOT EXISTS user_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type text NOT NULL CHECK (trigger_type IN ('stage_complete', 'high_score', 'investor_connect')),
  stage_name text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback text DEFAULT '',
  photo_url text,
  idea_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reviews"
  ON user_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own reviews"
  ON user_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
