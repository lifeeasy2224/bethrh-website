/*
  # Phase 2 (reconstructed): Core founder tables

  These five tables existed in the source (IdeaIQ) live database but were
  created outside the committed migrations (repo-vs-live drift), so a fresh
  `db push` failed at phase 3 which ALTERs them. Reconstructed from the
  application types (src/supabase.ts) and the columns later migrations
  expect/add (phase3 adds sentiment/is_completed/task_key, phase5a extends
  library_ideas).

  Policy names deliberately match the historical open policies that the
  security-hardening migrations (20260602223356, 20260613062730,
  20260615013025) DROP and replace — so replaying the full migration
  timeline ends at the same hardened final state as the source system.

  Exception: validation_entries SELECT is scoped from the start (owner OR
  marketplace idea) because no later migration replaces it and an open
  SELECT would be a data leak; the scoped version still supports the
  investor idea-detail stats.
*/

-- ── user_ideas ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  library_idea_id uuid,
  title text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  problem text NOT NULL DEFAULT '',
  solution text NOT NULL DEFAULT '',
  target_customer text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'seed' CHECK (stage IN ('seed', 'growing', 'ready')),
  iq_score int NOT NULL DEFAULT 0,
  city text NOT NULL DEFAULT '',
  differentiator text NOT NULL DEFAULT '',
  advantage text NOT NULL DEFAULT '',
  business_name text NOT NULL DEFAULT '',
  in_marketplace boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_ideas_user_id_idx ON user_ideas(user_id);
CREATE INDEX IF NOT EXISTS user_ideas_marketplace_idx ON user_ideas(in_marketplace) WHERE in_marketplace;
ALTER TABLE user_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read user ideas"   ON user_ideas FOR SELECT USING (true);
CREATE POLICY "Public can insert user ideas" ON user_ideas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update user ideas" ON user_ideas FOR UPDATE USING (true);
CREATE POLICY "Public can delete user ideas" ON user_ideas FOR DELETE USING (true);

-- ── validation_entries ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS validation_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_idea_id uuid NOT NULL REFERENCES user_ideas(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'interview',
  notes text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS validation_entries_idea_idx ON validation_entries(user_idea_id);
ALTER TABLE validation_entries ENABLE ROW LEVEL SECURITY;
-- Scoped SELECT (see header): owner, or anyone for marketplace-published ideas
CREATE POLICY "Read validation for own or marketplace ideas"
  ON validation_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_ideas ui
      WHERE ui.id = user_idea_id
        AND (ui.user_id = auth.uid() OR ui.in_marketplace)
    )
  );
CREATE POLICY "Public can insert validation entries" ON validation_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete validation entries" ON validation_entries FOR DELETE USING (true);

-- ── canvas_data ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS canvas_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_idea_id uuid NOT NULL UNIQUE REFERENCES user_ideas(id) ON DELETE CASCADE,
  key_partners text NOT NULL DEFAULT '',
  key_activities text NOT NULL DEFAULT '',
  value_proposition text NOT NULL DEFAULT '',
  customer_relationships text NOT NULL DEFAULT '',
  customer_segments text NOT NULL DEFAULT '',
  key_resources text NOT NULL DEFAULT '',
  channels text NOT NULL DEFAULT '',
  cost_structure text NOT NULL DEFAULT '',
  revenue_streams text NOT NULL DEFAULT '',
  monthly_revenue numeric NOT NULL DEFAULT 0,
  monthly_costs numeric NOT NULL DEFAULT 0,
  break_even_month int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE canvas_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read canvas data"   ON canvas_data FOR SELECT USING (true);
CREATE POLICY "Public can insert canvas data" ON canvas_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update canvas data" ON canvas_data FOR UPDATE USING (true);

-- ── journey_tasks ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journey_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_idea_id uuid NOT NULL REFERENCES user_ideas(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  task_key text NOT NULL DEFAULT 'main',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_idea_id, week_number, task_key)
);
ALTER TABLE journey_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read journey tasks"   ON journey_tasks FOR SELECT USING (true);
CREATE POLICY "Public can insert journey tasks" ON journey_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update journey tasks" ON journey_tasks FOR UPDATE USING (true);
CREATE POLICY "Public can delete journey tasks" ON journey_tasks FOR DELETE USING (true);

-- ── library_ideas (base — phase5a adds slug/tagline/difficulty/spots/etc.) ───
CREATE TABLE IF NOT EXISTS library_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '💡',
  problem text NOT NULL DEFAULT '',
  solution text NOT NULL DEFAULT '',
  target_market text NOT NULL DEFAULT '',
  revenue_model text NOT NULL DEFAULT '',
  why_now text NOT NULL DEFAULT '',
  biggest_challenge text NOT NULL DEFAULT '',
  best_markets text NOT NULL DEFAULT '',
  est_roi_min int NOT NULL DEFAULT 0,
  est_roi_max int NOT NULL DEFAULT 0,
  break_even_months int NOT NULL DEFAULT 0,
  initial_investment_min int NOT NULL DEFAULT 0,
  initial_investment_max int NOT NULL DEFAULT 0,
  monthly_revenue_y1_min int NOT NULL DEFAULT 0,
  monthly_revenue_y1_max int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE library_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on library_ideas" ON library_ideas FOR SELECT USING (true);
