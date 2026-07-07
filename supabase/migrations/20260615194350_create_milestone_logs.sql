CREATE TABLE IF NOT EXISTS milestone_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_idea_id uuid NOT NULL REFERENCES user_ideas(id) ON DELETE CASCADE,
  milestone_type text NOT NULL CHECK (milestone_type IN ('customer', 'revenue')),
  note text,
  amount numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE milestone_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_milestone_logs" ON milestone_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_milestone_logs" ON milestone_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_milestone_logs" ON milestone_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_milestone_logs" ON milestone_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
