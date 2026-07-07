-- Segments
CREATE TABLE IF NOT EXISTS marketing_segments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'smart',
  rules jsonb DEFAULT '[]',
  user_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE marketing_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_segments" ON marketing_segments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read_segments" ON marketing_segments FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_write_segments" ON marketing_segments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_segments" ON marketing_segments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_delete_segments" ON marketing_segments FOR DELETE TO authenticated USING (true);

-- Manual segment members
CREATE TABLE IF NOT EXISTS segment_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_id uuid REFERENCES marketing_segments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now()
);
ALTER TABLE segment_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_segment_members" ON segment_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read_segment_members" ON segment_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_write_segment_members" ON segment_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_delete_segment_members" ON segment_members FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_segment_members_seg ON segment_members(segment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_segment_user_unique ON segment_members(segment_id, user_id) WHERE user_id IS NOT NULL;

-- Pre-built smart segments
INSERT INTO marketing_segments (name, type, rules) VALUES
  ('All Users', 'smart', '[]'),
  ('All Founders', 'smart', '[{"field":"role","operator":"is","value":"founder"}]'),
  ('All Investors', 'smart', '[{"field":"role","operator":"is","value":"investor"}]'),
  ('New This Week', 'smart', '[{"field":"created_at","operator":"within_days","value":7}]'),
  ('Active Free Users', 'smart', '[{"field":"tier","operator":"is","value":"free"},{"field":"last_login_at","operator":"within_days","value":7}]'),
  ('Ready to Upgrade', 'smart', '[{"field":"tier","operator":"is","value":"free"},{"field":"iq_score","operator":"gte","value":50}]'),
  ('At Risk (Paying)', 'smart', '[{"field":"tier","operator":"in","value":["builder","launch","family","pro","growth","accelerator"]},{"field":"last_login_at","operator":"more_than_days","value":30}]'),
  ('Investors No Connections', 'smart', '[{"field":"role","operator":"is","value":"investor"}]'),
  ('Power Users', 'smart', '[{"field":"lead_score","operator":"gte","value":70}]'),
  ('Never Validated', 'smart', '[{"field":"role","operator":"is","value":"founder"},{"field":"login_count","operator":"gte","value":1}]')
ON CONFLICT DO NOTHING;
