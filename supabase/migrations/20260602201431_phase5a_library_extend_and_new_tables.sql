/*
  # Phase 5A: Extend library_ideas and add library_grabs, library_idea_views

  The library_ideas table already exists from a prior migration but is missing:
  slug, tagline, difficulty, time_to_launch_weeks, spots_total, spots_taken,
  is_published, is_featured, tags, updated_at columns.

  This migration:
  1. Adds all missing columns to library_ideas
  2. Creates library_grabs table
  3. Creates library_idea_views table
  4. Adds RLS policies
  5. Adds trigger to sync spots_taken
  6. Extends profiles.role to allow 'admin'
*/

-- =====================
-- Extend library_ideas
-- =====================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='slug') THEN
    ALTER TABLE library_ideas ADD COLUMN slug text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='tagline') THEN
    ALTER TABLE library_ideas ADD COLUMN tagline text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='difficulty') THEN
    ALTER TABLE library_ideas ADD COLUMN difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='time_to_launch_weeks') THEN
    ALTER TABLE library_ideas ADD COLUMN time_to_launch_weeks int NOT NULL DEFAULT 8;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='spots_total') THEN
    ALTER TABLE library_ideas ADD COLUMN spots_total int NOT NULL DEFAULT 3;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='spots_taken') THEN
    ALTER TABLE library_ideas ADD COLUMN spots_taken int NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='is_published') THEN
    ALTER TABLE library_ideas ADD COLUMN is_published bool NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='is_featured') THEN
    ALTER TABLE library_ideas ADD COLUMN is_featured bool NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='tags') THEN
    ALTER TABLE library_ideas ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='updated_at') THEN
    ALTER TABLE library_ideas ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Enable RLS on library_ideas (safe to run again)
ALTER TABLE library_ideas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view published library ideas" ON library_ideas;
DROP POLICY IF EXISTS "Admins can insert library ideas" ON library_ideas;
DROP POLICY IF EXISTS "Admins can update library ideas" ON library_ideas;
DROP POLICY IF EXISTS "Admins can delete library ideas" ON library_ideas;
DROP POLICY IF EXISTS "Public read access on library_ideas" ON library_ideas;
DROP POLICY IF EXISTS "Allow public select" ON library_ideas;

CREATE POLICY "Anyone can view published library ideas"
  ON library_ideas FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can insert library ideas"
  ON library_ideas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update library ideas"
  ON library_ideas FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete library ideas"
  ON library_ideas FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- =====================
-- library_grabs table
-- =====================
CREATE TABLE IF NOT EXISTS library_grabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_idea_id uuid NOT NULL REFERENCES library_ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_idea_id uuid REFERENCES user_ideas(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'grabbed' CHECK (status IN ('grabbed', 'converted', 'abandoned')),
  grabbed_at timestamptz DEFAULT now(),
  converted_at timestamptz,
  UNIQUE (library_idea_id, user_id)
);

ALTER TABLE library_grabs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own grabs" ON library_grabs;
CREATE POLICY "Users can view own grabs"
  ON library_grabs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own grabs" ON library_grabs;
CREATE POLICY "Users can insert own grabs"
  ON library_grabs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own grabs" ON library_grabs;
CREATE POLICY "Users can update own grabs"
  ON library_grabs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================
-- library_idea_views table
-- =====================
CREATE TABLE IF NOT EXISTS library_idea_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_idea_id uuid NOT NULL REFERENCES library_ideas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE library_idea_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert views" ON library_idea_views;
CREATE POLICY "Anyone can insert views"
  ON library_idea_views FOR INSERT
  WITH CHECK (true);

-- =====================
-- Trigger: sync spots_taken
-- =====================
CREATE OR REPLACE FUNCTION sync_library_spots_taken()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE library_ideas SET spots_taken = spots_taken + 1, updated_at = now() WHERE id = NEW.library_idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE library_ideas SET spots_taken = GREATEST(spots_taken - 1, 0), updated_at = now() WHERE id = OLD.library_idea_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_library_spots ON library_grabs;
CREATE TRIGGER trg_sync_library_spots
  AFTER INSERT OR DELETE ON library_grabs
  FOR EACH ROW EXECUTE FUNCTION sync_library_spots_taken();

-- =====================
-- Admin role in profiles
-- =====================
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT tc.constraint_name INTO v_constraint
  FROM information_schema.table_constraints tc
  JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
  WHERE tc.table_name = 'profiles' AND cc.check_clause LIKE '%role%'
  LIMIT 1;

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || quote_ident(v_constraint);
  END IF;

  BEGIN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('founder', 'investor', 'admin'));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_library_ideas_sector ON library_ideas(sector);
CREATE INDEX IF NOT EXISTS idx_library_ideas_published ON library_ideas(is_published);
CREATE INDEX IF NOT EXISTS idx_library_grabs_user_id ON library_grabs(user_id);
CREATE INDEX IF NOT EXISTS idx_library_grabs_idea_id ON library_grabs(library_idea_id);
CREATE INDEX IF NOT EXISTS idx_library_views_idea_id ON library_idea_views(library_idea_id);
