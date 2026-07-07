/*
  # Phase D: Ideas Library Tracking Columns

  Adds tracking columns to library_ideas to support the admin ideas library management:

  1. Modified Tables
    - `library_ideas`
      - `view_count` (int) - total view count (denormalized for performance)
      - `grab_count` (int) - total grab count (denormalized for performance)
      - `last_edited_by` (text) - email of the admin who last edited this idea
      - `last_edited_at` (timestamptz) - when the idea was last edited by admin
      - `quick_start_steps` (text) - rich text field for quick start steps
      - `financial_estimates` (text) - rich text field for financial estimates

  2. Security
    - Admin read access on library_idea_views for counting
    - Admin read access on library_grabs for counting
    - Admin RLS policy added to allow admins to read any row from library_ideas

  3. Notes
    - All columns added with IF NOT EXISTS guards
    - view_count and grab_count are synced by triggers
    - Admin read policy is added (in addition to existing published-only public read policy)
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='view_count') THEN
    ALTER TABLE library_ideas ADD COLUMN view_count int NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='grab_count') THEN
    ALTER TABLE library_ideas ADD COLUMN grab_count int NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='last_edited_by') THEN
    ALTER TABLE library_ideas ADD COLUMN last_edited_by text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='last_edited_at') THEN
    ALTER TABLE library_ideas ADD COLUMN last_edited_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='quick_start_steps') THEN
    ALTER TABLE library_ideas ADD COLUMN quick_start_steps text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='library_ideas' AND column_name='financial_estimates') THEN
    ALTER TABLE library_ideas ADD COLUMN financial_estimates text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Allow admins to read all ideas (including unpublished)
DROP POLICY IF EXISTS "Admins can read all library ideas" ON library_ideas;
CREATE POLICY "Admins can read all library ideas"
  ON library_ideas FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Allow admins to read all views
DROP POLICY IF EXISTS "Admins can read all library views" ON library_idea_views;
CREATE POLICY "Admins can read all library views"
  ON library_idea_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Allow admins to read all grabs
DROP POLICY IF EXISTS "Admins can read all library grabs" ON library_grabs;
CREATE POLICY "Admins can read all library grabs"
  ON library_grabs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Sync view_count from library_idea_views
CREATE OR REPLACE FUNCTION sync_library_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE library_ideas SET view_count = view_count + 1 WHERE id = NEW.library_idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE library_ideas SET view_count = GREATEST(view_count - 1, 0) WHERE id = OLD.library_idea_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_library_views ON library_idea_views;
CREATE TRIGGER trg_sync_library_views
  AFTER INSERT OR DELETE ON library_idea_views
  FOR EACH ROW EXECUTE FUNCTION sync_library_view_count();

-- Sync grab_count from library_grabs (separate from spots_taken)
CREATE OR REPLACE FUNCTION sync_library_grab_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE library_ideas SET grab_count = grab_count + 1 WHERE id = NEW.library_idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE library_ideas SET grab_count = GREATEST(grab_count - 1, 0) WHERE id = OLD.library_idea_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_library_grab_count ON library_grabs;
CREATE TRIGGER trg_sync_library_grab_count
  AFTER INSERT OR DELETE ON library_grabs
  FOR EACH ROW EXECUTE FUNCTION sync_library_grab_count();

-- Backfill counts from existing data
UPDATE library_ideas li
SET view_count = (SELECT COUNT(*) FROM library_idea_views WHERE library_idea_id = li.id);

UPDATE library_ideas li
SET grab_count = (SELECT COUNT(*) FROM library_grabs WHERE library_idea_id = li.id);
