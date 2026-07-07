-- Automations table
CREATE TABLE IF NOT EXISTS marketing_automations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  trigger_type text NOT NULL,
  delay_hours integer NOT NULL DEFAULT 0,
  template_id uuid REFERENCES marketing_templates(id) ON DELETE SET NULL,
  segment_id uuid REFERENCES marketing_segments(id) ON DELETE SET NULL,
  frequency_cap integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'paused',
  times_triggered integer NOT NULL DEFAULT 0,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_automations" ON marketing_automations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Automation send logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id uuid REFERENCES marketing_automations(id) ON DELETE CASCADE,
  user_id uuid,
  email text,
  status text NOT NULL DEFAULT 'sent',
  reason text,
  triggered_at timestamptz DEFAULT now()
);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_automation_logs" ON automation_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_user ON automation_logs(user_id, automation_id);

-- Seed pre-built automations (all paused, no template assigned yet)
INSERT INTO marketing_automations (name, trigger_type, delay_hours, frequency_cap, status) VALUES
  ('Welcome — Day 1',                  'signup',                    0,   1, 'paused'),
  ('Welcome — Day 3',                  'signup',                    72,  1, 'paused'),
  ('Welcome — Day 7',                  'signup',                    168, 1, 'paused'),
  ('Re-engage — 7 Days Inactive',      'inactive_7_days',           0,   1, 'paused'),
  ('Re-engage — 14 Days Inactive',     'inactive_14_days',          0,   1, 'paused'),
  ('Re-engage — 30 Days Inactive',     'inactive_30_days',          0,   1, 'paused'),
  ('First Idea — Congrats',            'first_idea_created',        1,   1, 'paused'),
  ('Pricing Page — Follow Up',         'pricing_page_visited',      24,  1, 'paused'),
  ('Plan Upgraded — Thank You',        'plan_upgraded',             1,   3, 'paused'),
  ('Cancellation — Win-Back',          'plan_cancelled',            48,  1, 'paused'),
  ('Stress Test Complete',             'stress_test_completed',     2,   1, 'paused'),
  ('Canvas Complete — Next Steps',     'canvas_completed',          4,   1, 'paused'),
  ('Milestone Completed',              'milestone_completed',       1,   5, 'paused'),
  ('Review Request — 30 Day Active',   'review_request',            0,   1, 'paused')
;
