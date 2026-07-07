
-- Marketing Templates
CREATE TABLE IF NOT EXISTS marketing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  preview_text text,
  body_html text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  is_builtin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE marketing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_templates" ON marketing_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_select_templates" ON marketing_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_templates" ON marketing_templates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_templates" ON marketing_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_templates" ON marketing_templates
  FOR DELETE TO authenticated USING (true);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  preview_text text,
  body_html text NOT NULL,
  from_name text NOT NULL DEFAULT 'Team',
  from_email text NOT NULL DEFAULT 'noreply@example.com',
  reply_to text,
  segment_id uuid REFERENCES marketing_segments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  send_mode text NOT NULL DEFAULT 'now' CHECK (send_mode IN ('now','schedule')),
  ab_enabled boolean NOT NULL DEFAULT false,
  ab_variants jsonb,
  total_recipients integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  open_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  bounce_count integer NOT NULL DEFAULT 0,
  unsubscribe_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_campaigns" ON marketing_campaigns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_select_campaigns" ON marketing_campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_campaigns" ON marketing_campaigns
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_campaigns" ON marketing_campaigns
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_campaigns" ON marketing_campaigns
  FOR DELETE TO authenticated USING (true);

-- Campaign Recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','bounced','failed')),
  ab_variant text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON campaign_recipients(email);

ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_recipients" ON campaign_recipients
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_select_recipients" ON campaign_recipients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_recipients" ON campaign_recipients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_recipients" ON campaign_recipients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Email Suppression List
CREATE TABLE IF NOT EXISTS email_suppression_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  reason text NOT NULL DEFAULT 'unsubscribed' CHECK (reason IN ('unsubscribed','bounced','complaint','manual')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_suppression_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_suppression" ON email_suppression_list
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_select_suppression" ON email_suppression_list
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_suppression" ON email_suppression_list
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_suppression" ON email_suppression_list
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_suppression" ON email_suppression_list
  FOR DELETE TO authenticated USING (true);

-- Marketing Uploads
CREATE TABLE IF NOT EXISTS marketing_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  valid_rows integer NOT NULL DEFAULT 0,
  invalid_rows integer NOT NULL DEFAULT 0,
  duplicate_rows integer NOT NULL DEFAULT 0,
  suppressed_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','complete','failed')),
  segment_id uuid REFERENCES marketing_segments(id) ON DELETE SET NULL,
  segment_name text,
  error_details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE marketing_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_uploads" ON marketing_uploads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_select_uploads" ON marketing_uploads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_uploads" ON marketing_uploads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_uploads" ON marketing_uploads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed 10 built-in templates
INSERT INTO marketing_templates (name, subject, preview_text, body_html, category, is_builtin) VALUES
(
  'Welcome Email',
  'Welcome to {{app_name}}, {{first_name}}!',
  'We''re thrilled to have you on board.',
  '<h1>Welcome, {{first_name}}!</h1><p>We''re so excited to have you join {{app_name}}. Your journey starts today.</p><p>To get started, <a href="{{cta_url}}">click here</a>.</p><p>Best,<br>The {{app_name}} Team</p>',
  'onboarding',
  true
),
(
  'Upgrade to Pro',
  'Unlock everything with {{app_name}} Pro',
  'See what you''ve been missing.',
  '<h1>Ready to level up, {{first_name}}?</h1><p>You''ve been making great progress. Upgrade to Pro to unlock unlimited features, priority support, and more.</p><p><a href="{{cta_url}}">Upgrade Now →</a></p>',
  'upgrade',
  true
),
(
  'Re-engagement',
  'We miss you, {{first_name}}',
  'Come back and see what''s new.',
  '<h1>It''s been a while, {{first_name}}.</h1><p>We''ve added some great new features since you last visited. Come back and see what''s new.</p><p><a href="{{cta_url}}">Explore Now →</a></p>',
  're-engagement',
  true
),
(
  'Weekly Digest',
  'Your weekly update from {{app_name}}',
  'Here''s what happened this week.',
  '<h1>Weekly Digest</h1><p>Hi {{first_name}},</p><p>Here''s a summary of your activity this week and what''s trending on the platform.</p><p><a href="{{cta_url}}">View Full Report →</a></p>',
  'newsletter',
  true
),
(
  'Feature Announcement',
  'New: {{feature_name}} is now live!',
  'We just launched something exciting.',
  '<h1>Exciting News, {{first_name}}!</h1><p>We just launched <strong>{{feature_name}}</strong> — and we think you''re going to love it.</p><p><a href="{{cta_url}}">Try It Now →</a></p>',
  'announcement',
  true
),
(
  'Trial Expiring',
  'Your trial ends in {{days_left}} days',
  'Don''t lose access to your work.',
  '<h1>Your trial is almost up, {{first_name}}.</h1><p>You have <strong>{{days_left}} days</strong> left in your trial. Upgrade now to keep all your data and features.</p><p><a href="{{cta_url}}">Upgrade Before It''s Too Late →</a></p>',
  'upgrade',
  true
),
(
  'Milestone Celebration',
  'Congratulations on your first {{milestone}}!',
  'You''ve hit a major milestone.',
  '<h1>Congrats, {{first_name}}! 🎉</h1><p>You just hit your first <strong>{{milestone}}</strong>. That''s a huge deal, and we''re celebrating with you.</p><p><a href="{{cta_url}}">Keep Going →</a></p>',
  'engagement',
  true
),
(
  'Investor Update',
  'Portfolio Update: {{company_name}} — {{month}}',
  'Your latest investor summary is ready.',
  '<h1>Investor Update — {{month}}</h1><p>Hi {{first_name}},</p><p>Here''s the latest update from {{company_name}} for this month.</p><p><a href="{{cta_url}}">Read Full Update →</a></p>',
  'investor',
  true
),
(
  'Churn Save',
  'Before you go — can we help?',
  'We''d hate to see you leave.',
  '<h1>Wait, {{first_name}} — don''t go yet.</h1><p>We noticed you might be thinking of cancelling. Before you do, we''d love to understand why and see if we can help.</p><p><a href="{{cta_url}}">Talk to Us →</a></p>',
  're-engagement',
  true
),
(
  'Onboarding Day 3',
  'Day 3 tip: How to {{tip_topic}} in {{app_name}}',
  'Make the most of your first week.',
  '<h1>Day 3 Tip, {{first_name}}!</h1><p>Here''s your tip of the day: <strong>{{tip_topic}}</strong>.</p><p>Founders who master this early see 3x better results in the first month.</p><p><a href="{{cta_url}}">Learn More →</a></p>',
  'onboarding',
  true
);
