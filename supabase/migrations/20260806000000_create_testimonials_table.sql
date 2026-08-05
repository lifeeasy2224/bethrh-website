-- §1e anti-fabrication: real, admin-curated testimonials for the public site.
-- Replaces the hardcoded persona array previously rendered on the homepage.
-- Public (anon) may read ONLY published rows; all writes go through the
-- admin-db Edge Function (service_role) behind the resolveSession admin guard.

CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  city TEXT,
  avatar_url TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  source_review_id UUID REFERENCES public.user_reviews(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_testimonials_published_sort
  ON public.testimonials(is_published, sort_order);

-- RLS Policies
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public can read published testimonials
CREATE POLICY "public_read_published_testimonials"
  ON public.testimonials
  FOR SELECT
  USING (is_published = true);

-- Admin writes via admin-db (service role, no direct user access)
-- (No other policies — admin-db function handles writes with resolveSession guard)

GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT ALL ON public.testimonials TO service_role;
