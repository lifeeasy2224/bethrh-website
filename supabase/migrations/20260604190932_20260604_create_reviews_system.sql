/*
  # Create Reviews System

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users — nullable for anonymised lookups)
      - `user_role` (text: 'founder' | 'investor')
      - `trigger_type` (text: 'stage_complete' | 'high_score' | 'greenhouse_contact_founder' | 'greenhouse_contact_investor')
      - `trigger_context` (text: human-readable label, e.g. phase name or idea title)
      - `rating` (int 1-5)
      - `feedback` (text, nullable)
      - `photo_url` (text, nullable — Supabase Storage URL)
      - `created_at` (timestamptz)

  2. Storage
    - `review-photos` bucket (public) for uploaded review photos

  3. Security
    - RLS enabled
    - Authenticated users can insert their own reviews
    - Authenticated users can read their own reviews
    - Admins (via app_metadata) can read all reviews
*/

CREATE TABLE IF NOT EXISTS reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role       text NOT NULL DEFAULT 'founder' CHECK (user_role IN ('founder', 'investor')),
  trigger_type    text NOT NULL CHECK (trigger_type IN (
    'stage_complete',
    'high_score',
    'greenhouse_contact_founder',
    'greenhouse_contact_investor'
  )),
  trigger_context text DEFAULT '',
  rating          int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback        text DEFAULT '',
  photo_url       text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Storage bucket for review photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-photos',
  'review-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload review photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'review-photos');

CREATE POLICY "Review photos are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'review-photos');
