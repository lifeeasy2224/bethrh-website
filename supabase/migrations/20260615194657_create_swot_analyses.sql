CREATE TABLE IF NOT EXISTS swot_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_idea_id uuid NOT NULL REFERENCES user_ideas(id) ON DELETE CASCADE,
  strengths jsonb NOT NULL DEFAULT '[]',
  weaknesses jsonb NOT NULL DEFAULT '[]',
  opportunities jsonb NOT NULL DEFAULT '[]',
  threats jsonb NOT NULL DEFAULT '[]',
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_idea_id)
);

ALTER TABLE swot_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_swot" ON swot_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_swot" ON swot_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_swot" ON swot_analyses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_swot" ON swot_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
