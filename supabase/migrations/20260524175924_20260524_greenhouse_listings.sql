/*
  # The Greenhouse — greenhouse_listings table

  ## Summary
  Creates the "المشتل" (Greenhouse) feature that allows founders to publish
  their validated ideas for investor discovery.

  ## New Tables
  ### greenhouse_listings
  - `id` (uuid, pk)
  - `idea_id` (uuid, fk → ideas.id, unique — one listing per idea)
  - `canvas_id` (uuid, fk → canvas_drafts.id, nullable)
  - `user_id` (uuid, fk → auth.users)
  - `brand_name` (text) — public brand name chosen by founder
  - `logo` (text, nullable) — emoji or image URL
  - `tagline` (text, nullable) — one-line description, max 60 chars
  - `sector` (text) — from idea
  - `iro` (integer) — estimated ROI % derived from financial analysis
  - `breakeven_months` (integer) — estimated breakeven in months
  - `score` (integer) — Bethrh AI score
  - `level` (text) — 'متجذر' | 'مثمر'
  - `status` (text) — 'active' | 'hidden' | 'funded'
  - `contact_requests` (integer) — count of investor contact requests
  - `published_at` (timestamptz)

  ### greenhouse_contact_requests
  - tracks investor contact requests per listing
  - `id`, `listing_id`, `requester_id`, `message`, `status`, `created_at`

  ## Security
  - greenhouse_listings: public SELECT for active listings (no auth required for browsing)
  - INSERT/UPDATE restricted to authenticated owner
  - greenhouse_contact_requests: authenticated users only
*/

CREATE TABLE IF NOT EXISTS greenhouse_listings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id           uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  canvas_id         uuid REFERENCES canvas_drafts(id) ON DELETE SET NULL,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name        text NOT NULL,
  logo              text,
  tagline           text,
  sector            text NOT NULL DEFAULT '',
  iro               integer NOT NULL DEFAULT 0,
  breakeven_months  integer NOT NULL DEFAULT 0,
  score             integer NOT NULL DEFAULT 0,
  level             text NOT NULL DEFAULT 'متجذر' CHECK (level IN ('متجذر', 'مثمر')),
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'funded')),
  contact_requests  integer NOT NULL DEFAULT 0,
  published_at      timestamptz DEFAULT now(),
  UNIQUE(idea_id)
);

ALTER TABLE greenhouse_listings ENABLE ROW LEVEL SECURITY;

-- Anyone (even unauthenticated) can browse active listings
CREATE POLICY "Public can view active greenhouse listings"
  ON greenhouse_listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Owners can insert their listings"
  ON greenhouse_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their listings"
  ON greenhouse_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their listings"
  ON greenhouse_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── contact requests ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS greenhouse_contact_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES greenhouse_listings(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(listing_id, requester_id)
);

ALTER TABLE greenhouse_contact_requests ENABLE ROW LEVEL SECURITY;

-- Founders see requests for their listings
CREATE POLICY "Founders can view contact requests for their listings"
  ON greenhouse_contact_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM greenhouse_listings gl
      WHERE gl.id = listing_id AND gl.user_id = auth.uid()
    )
  );

-- Any authenticated user can create a request
CREATE POLICY "Authenticated users can create contact requests"
  ON greenhouse_contact_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Founders can update status of requests
CREATE POLICY "Founders can update request status"
  ON greenhouse_contact_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM greenhouse_listings gl
      WHERE gl.id = listing_id AND gl.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM greenhouse_listings gl
      WHERE gl.id = listing_id AND gl.user_id = auth.uid()
    )
  );

-- Requesters can see their own requests
CREATE POLICY "Requesters can view own requests"
  ON greenhouse_contact_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id);

-- indexes
CREATE INDEX IF NOT EXISTS greenhouse_listings_status_idx ON greenhouse_listings(status);
CREATE INDEX IF NOT EXISTS greenhouse_listings_sector_idx ON greenhouse_listings(sector);
CREATE INDEX IF NOT EXISTS greenhouse_listings_score_idx ON greenhouse_listings(score DESC);
CREATE INDEX IF NOT EXISTS greenhouse_contact_requests_listing_idx ON greenhouse_contact_requests(listing_id);
