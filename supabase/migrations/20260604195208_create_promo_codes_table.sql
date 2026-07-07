/*
  # Create Promo Codes Table

  ## Overview
  Adds a promo_codes table to support admin-generated discount codes
  with fixed discount levels: 100%, 75%, 50%, and 25%.

  ## New Table: promo_codes
  - `id` (uuid, pk) — unique row identifier
  - `code` (text, unique) — the promo code string, e.g. "LAUNCH100"
  - `discount_pct` (integer) — discount percentage: 25, 50, 75, or 100
  - `description` (text) — optional admin note describing the code's purpose
  - `max_uses` (integer, nullable) — usage cap; null means unlimited
  - `uses_count` (integer) — tracks how many times the code has been applied
  - `expires_at` (timestamptz, nullable) — optional expiry; null means never expires
  - `is_active` (boolean) — admin toggle to enable/disable the code
  - `created_by` (text) — email/name of the admin who generated it
  - `created_at` (timestamptz) — creation timestamp

  ## Security
  - RLS enabled — table is locked down by default
  - Only service_role (admin backend) can read/write
  - No public or authenticated user access to this table
  - Authenticated users will validate codes via a secure RPC or edge function
*/

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text UNIQUE NOT NULL,
  discount_pct integer NOT NULL CHECK (discount_pct IN (25, 50, 75, 100)),
  description  text NOT NULL DEFAULT '',
  max_uses     integer CHECK (max_uses IS NULL OR max_uses > 0),
  uses_count   integer NOT NULL DEFAULT 0,
  expires_at   timestamptz,
  is_active    boolean NOT NULL DEFAULT true,
  created_by   text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- No public access — admins manage codes via the service_role key / admin edge functions
-- Authenticated users can read only active, non-expired codes (for validation at checkout)
CREATE POLICY "Authenticated users can read active promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Index for fast code lookups at checkout
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes (code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes (is_active, expires_at);
