/*
  # Site Content Table
  Stores editable text content for public-facing pages.
  Admins manage via the admin panel; public pages read with anon key.
*/
CREATE TABLE IF NOT EXISTS public.site_content (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text UNIQUE NOT NULL,
  value      text NOT NULL DEFAULT '',
  label      text NOT NULL DEFAULT '',
  category   text NOT NULL DEFAULT 'general',
  type       text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'textarea')),
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read site content — it's public copy
CREATE POLICY "Public can read site content"
  ON public.site_content FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role (admin edge function) can write
-- No insert/update/delete policies for non-service roles

CREATE INDEX IF NOT EXISTS idx_site_content_category ON public.site_content (category, sort_order);

-- Seed default content
INSERT INTO public.site_content (key, value, label, category, type, sort_order) VALUES
  -- Homepage Hero
  ('home.hero.title',         'Your idea deserves more than a notebook.',                                      'Hero Title',              'Homepage — Hero',     'text',     1),
  ('home.hero.subtitle',      'Bethra is where first-time founders turn raw ideas into real businesses — with AI coaching, step-by-step validation, and investors who actually get it.', 'Hero Subtitle', 'Homepage — Hero', 'textarea', 2),
  ('home.hero.cta_founder',   'Start Free — I Have an Idea',                                                  'Founder CTA Button',      'Homepage — Hero',     'text',     3),
  ('home.hero.cta_investor',  'I''m an Investor — Show Me Deals',                                             'Investor CTA Button',     'Homepage — Hero',     'text',     4),
  -- Homepage Stats
  ('home.stats.founders',     '2,000+ founders building',                                                     'Stat: Founders',          'Homepage — Stats',    'text',     1),
  ('home.stats.validated',    '850+ ideas validated',                                                         'Stat: Ideas Validated',   'Homepage — Stats',    'text',     2),
  ('home.stats.ready',        '40+ ready-to-grab ideas',                                                      'Stat: Ready Ideas',       'Homepage — Stats',    'text',     3),
  -- Homepage What Is It
  ('home.whatisit.heading',   'The smartest way to go from ''what if'' to ''what''s next.''',                'What Is It Heading',      'Homepage — About',    'text',     1),
  ('home.whatisit.body',      'Bethra is a marketplace that connects early-stage founders with investors — but we don''t just connect you. We make sure you''re actually ready.', 'What Is It Body', 'Homepage — About', 'textarea', 2),
  ('home.whatisit.callout',   'We''re not an accelerator. We''re not a fund. We''re the bridge.',            'Callout Text',            'Homepage — About',    'text',     3),
  -- Homepage Sections
  ('home.features.title',     'Features That Actually Help',                                                  'Features Title',          'Homepage — Sections', 'text',     1),
  ('home.features.subtitle',  'Everything you need from first idea to funded.',                               'Features Subtitle',       'Homepage — Sections', 'text',     2),
  ('home.library.title',      'Don''t have an idea? We''ve got 40+ ready for you.',                          'Library Title',           'Homepage — Sections', 'text',     3),
  ('home.library.subtitle',   'Browse pre-researched business ideas across 8 sectors — grab one, customize it, and start building today.', 'Library Subtitle', 'Homepage — Sections', 'textarea', 4),
  ('home.library.cta',        'Explore the Ideas Library',                                                    'Library CTA Button',      'Homepage — Sections', 'text',     5),
  ('home.score.title',        'The Bethra Score',                                                             'Score Section Title',     'Homepage — Sections', 'text',     6),
  ('home.score.body',         'Every idea gets scored from 0 to 100. The higher your score, the more investor-ready you are.', 'Score Section Body', 'Homepage — Sections', 'textarea', 7),
  -- Homepage Final CTA
  ('home.cta.title',          'Ready to turn your idea into income?',                                         'Final CTA Title',         'Homepage — CTA',      'text',     1),
  ('home.cta.subtitle',       'Join 2,000+ founders already building on Bethra.',                             'Final CTA Subtitle',      'Homepage — CTA',      'text',     2),
  ('home.cta.btn1',           'Start Free — No Credit Card Needed',                                           'Final CTA Button 1',      'Homepage — CTA',      'text',     3),
  ('home.cta.btn2',           'See How It Works',                                                             'Final CTA Button 2',      'Homepage — CTA',      'text',     4),
  ('home.pricing_teaser.title',    'Simple pricing. No surprises.',                                           'Pricing Teaser Title',    'Homepage — CTA',      'text',     5),
  ('home.pricing_teaser.subtitle', 'Start free. Upgrade when you''re ready.',                                 'Pricing Teaser Subtitle', 'Homepage — CTA',      'text',     6),
  -- Pricing Hero
  ('pricing.hero.title',      'Simple, Transparent Pricing',                                                  'Page Title',              'Pricing Page',        'text',     1),
  ('pricing.hero.subtitle',   'Start free. Scale when you''re ready. No hidden fees, no equity taken.',      'Page Subtitle',           'Pricing Page',        'textarea', 2),
  -- Pricing Plan taglines
  ('pricing.starter.tagline', 'Explore the platform, test an idea',                                           'Starter Plan Tagline',    'Pricing Page',        'text',     3),
  ('pricing.builder.tagline', 'Full toolkit for serious founders',                                            'Builder Plan Tagline',    'Pricing Page',        'text',     4),
  ('pricing.launch.tagline',  'Everything + investor visibility',                                             'Launch Plan Tagline',     'Pricing Page',        'text',     5),
  ('pricing.family.tagline',  'Builder features for up to 3 members',                                        'Family Plan Tagline',     'Pricing Page',        'text',     6),
  -- Pricing Info Cards
  ('pricing.students.title',  'Students & Educators',                                                        'Students Card Title',     'Pricing Page',        'text',     7),
  ('pricing.students.body',   'Verified students and teachers get 50% off all paid plans. Email us at hello@bethra.co with your .edu address.', 'Students Card Body', 'Pricing Page', 'textarea', 8),
  ('pricing.investors.title', 'Investors Always Free',                                                       'Investors Card Title',    'Pricing Page',        'text',     9),
  ('pricing.investors.body',  'Verified angel investors and VCs access Bethra at no cost. Browse validated deals, connect with founders, track portfolio ideas.', 'Investors Card Body', 'Pricing Page', 'textarea', 10)
ON CONFLICT (key) DO NOTHING;
