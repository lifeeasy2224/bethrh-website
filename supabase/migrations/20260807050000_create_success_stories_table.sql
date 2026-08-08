-- P0-A anti-fabrication: real, admin-curated Wall of Fame success stories.
-- Replaces the hardcoded FOUNDERS array + fake "127 founders" stat + fake
-- featured story (سارة الخالد) + fabricated "14 days" CTA claim on
-- WallOfFamePage. Same pattern as public.testimonials: public (anon) may read
-- ONLY published rows; all writes go through the admin-db Edge Function
-- (service_role) behind the resolveSession admin guard.

CREATE TABLE public.success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  idea TEXT NOT NULL,
  category TEXT,
  days_to_first_dollar INTEGER,
  quote TEXT,
  role TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_success_stories_published_sort
  ON public.success_stories(is_published, sort_order);

-- RLS Policies
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Public can read published success stories
CREATE POLICY "public_read_published_success_stories"
  ON public.success_stories
  FOR SELECT
  USING (is_published = true);

-- Admin writes via admin-db (service role, no direct user access)
-- (No other policies — admin-db function handles writes with resolveSession guard)

GRANT SELECT ON public.success_stories TO anon, authenticated;
GRANT ALL ON public.success_stories TO service_role;
