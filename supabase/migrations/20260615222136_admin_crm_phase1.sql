-- CRM Notes
CREATE TABLE IF NOT EXISTS admin_crm_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  admin_id uuid,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_crm_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_notes" ON admin_crm_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tags
CREATE TABLE IF NOT EXISTS admin_crm_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  color text DEFAULT '#D4A653',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_crm_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_tags" ON admin_crm_tags FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read_tags" ON admin_crm_tags FOR SELECT TO authenticated USING (true);

-- User-Tag assignments
CREATE TABLE IF NOT EXISTS admin_user_tags (
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  tag_id uuid REFERENCES admin_crm_tags(id) ON DELETE CASCADE,
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, tag_id)
);
ALTER TABLE admin_user_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_user_tags" ON admin_user_tags FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read_user_tags" ON admin_user_tags FOR SELECT TO authenticated USING (true);

-- Activity log
CREATE TABLE IF NOT EXISTS user_activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_details jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_activity" ON user_activity_log FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity_log(action_type, created_at DESC);

-- CRM columns on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifecycle_stage text DEFAULT 'new';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_status text DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_revenue decimal DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visited_pricing boolean DEFAULT false;

-- Default tags
INSERT INTO admin_crm_tags (name, color) VALUES
  ('VIP', '#D4A653'),
  ('Hot Lead', '#EF4444'),
  ('Churning', '#F59E0B'),
  ('Needs Help', '#3B82F6'),
  ('Investor Lead', '#8B5CF6'),
  ('Power User', '#10B981'),
  ('Beta Tester', '#14B8A6')
ON CONFLICT (name) DO NOTHING;
