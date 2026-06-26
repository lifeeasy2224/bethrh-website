/*
  # Create Idea Library (بذور جاهزة للزراعة)

  ## Summary
  Adds a curated library of pre-validated business ideas that entrepreneurs can browse,
  customize, and adopt as their own.

  ## New Tables

  ### `idea_library`
  - Stores curated business ideas with financial estimates and sector data
  - Each idea has a max capacity of 3 entrepreneurs to prevent market saturation
  - Tracks how many founders are currently working on each idea

  ### `idea_library_selections`
  - Junction table recording when a user adopts a library idea
  - Stores the user's customization answers (country, differentiation, advantage)
  - Links the library idea to the user's copied idea in the `ideas` table

  ## Security
  - RLS enabled on both tables
  - `idea_library` is publicly readable (browse without login)
  - `idea_library_selections` is restricted to authenticated users (own records only)

  ## Business Rules
  - Max 3 entrepreneurs per library idea
  - Max 2 library idea selections per user
  - Capacity counter is managed via triggers
*/

-- ─── idea_library ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS idea_library (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar                      text NOT NULL,
  sector                        text NOT NULL,
  sector_label_ar               text NOT NULL,
  problem_ar                    text NOT NULL,
  solution_ar                   text NOT NULL,
  target_market_ar              text NOT NULL,
  revenue_model_ar              text NOT NULL,
  why_now_ar                    text NOT NULL,
  challenge_ar                  text NOT NULL,
  estimated_iro                 integer,
  estimated_breakeven           integer,
  estimated_investment_min      integer,
  estimated_investment_max      integer,
  estimated_monthly_revenue_min integer,
  estimated_monthly_revenue_max integer,
  suitable_countries            text[] DEFAULT '{}',
  max_entrepreneurs             integer DEFAULT 3,
  current_entrepreneurs         integer DEFAULT 0,
  is_active                     boolean DEFAULT true,
  quarter                       text DEFAULT 'Q2-2026',
  created_at                    timestamptz DEFAULT now(),
  updated_at                    timestamptz DEFAULT now()
);

ALTER TABLE idea_library ENABLE ROW LEVEL SECURITY;

-- Everyone can read active library ideas (public browsing)
CREATE POLICY "Anyone can view active library ideas"
  ON idea_library FOR SELECT
  USING (is_active = true);

-- Only admins can modify library ideas (enforced via service role in API)
CREATE POLICY "Authenticated users can view all library ideas"
  ON idea_library FOR SELECT
  TO authenticated
  USING (true);

-- ─── idea_library_selections ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS idea_library_selections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  library_idea_id   uuid NOT NULL REFERENCES idea_library(id),
  user_idea_id      uuid REFERENCES ideas(id) ON DELETE SET NULL,
  country           text NOT NULL,
  city              text DEFAULT '',
  differentiation   text NOT NULL,
  advantage         text NOT NULL,
  custom_name       text NOT NULL,
  selected_at       timestamptz DEFAULT now()
);

ALTER TABLE idea_library_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own selections"
  ON idea_library_selections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own selections"
  ON idea_library_selections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own selections"
  ON idea_library_selections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_idea_library_sector ON idea_library(sector);
CREATE INDEX IF NOT EXISTS idx_idea_library_active ON idea_library(is_active);
CREATE INDEX IF NOT EXISTS idx_library_selections_user ON idea_library_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_library_selections_library_idea ON idea_library_selections(library_idea_id);

-- ─── Trigger: auto-update idea_library.updated_at ────────────────────────────
CREATE OR REPLACE FUNCTION update_idea_library_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_idea_library_updated_at ON idea_library;
CREATE TRIGGER trg_idea_library_updated_at
  BEFORE UPDATE ON idea_library
  FOR EACH ROW EXECUTE FUNCTION update_idea_library_updated_at();

-- ─── Trigger: increment/decrement current_entrepreneurs ──────────────────────
CREATE OR REPLACE FUNCTION handle_library_selection_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE idea_library
    SET current_entrepreneurs = current_entrepreneurs + 1
    WHERE id = NEW.library_idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE idea_library
    SET current_entrepreneurs = GREATEST(current_entrepreneurs - 1, 0)
    WHERE id = OLD.library_idea_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_library_selection_count ON idea_library_selections;
CREATE TRIGGER trg_library_selection_count
  AFTER INSERT OR DELETE ON idea_library_selections
  FOR EACH ROW EXECUTE FUNCTION handle_library_selection_change();
