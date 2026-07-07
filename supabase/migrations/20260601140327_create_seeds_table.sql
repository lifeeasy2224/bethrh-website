/*
  # Create seeds table for Seed Pad application

  1. New Tables
    - `seeds`
      - `id` (uuid, primary key, auto-generated)
      - `title` (text, required) - the seed title / headline
      - `content` (text, default '') - the body/detail of the seed note
      - `tags` (text[], default '{}') - array of tag strings for categorization
      - `color` (text, default 'default') - accent color label for the card
      - `pinned` (boolean, default false) - whether the seed is pinned to top
      - `created_at` (timestamptz, auto-set to now())
      - `updated_at` (timestamptz, auto-set to now())

  2. Security
    - Enable RLS on `seeds` table
    - All operations are publicly allowed (single-user local app, no auth)
    - Note: Using TO anon role to allow unauthenticated access

  3. Performance
    - Index on created_at for sorting
    - Index on pinned for filtering pinned items
*/

CREATE TABLE IF NOT EXISTS seeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  color text NOT NULL DEFAULT 'default',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS seeds_created_at_idx ON seeds (created_at DESC);
CREATE INDEX IF NOT EXISTS seeds_pinned_idx ON seeds (pinned);

CREATE POLICY "Public can read all seeds"
  ON seeds FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert seeds"
  ON seeds FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update seeds"
  ON seeds FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete seeds"
  ON seeds FOR DELETE
  TO anon
  USING (true);
