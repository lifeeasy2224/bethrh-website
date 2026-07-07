/*
  # Phase F: Analytics, Settings & Notifications

  ## New Tables
  1. `system_settings` — Key/value store for platform configuration
     - key (text, unique), value (jsonb), label, description, category
     - Pre-seeded with all Phase F settings
  2. `admin_notifications` — Bell icon notifications for admins
     - type (new_user/ticket/report/failed_login/system_error/traffic)
     - title, message, link, read_by (uuid array)
  3. `site_analytics_daily` — Pre-aggregated daily traffic metrics
     - visitors, page_views, new/returning users, bounce rate
     - traffic sources (organic/paid/social/direct/referral)
     - device breakdown (mobile/desktop/tablet)
     - 90 days of seeded data

  ## Security
  - RLS enabled on all tables; service role only access (admin edge functions bypass RLS)
  - No public policies — admin operations use service_role key

  ## Notes
  - system_settings seeded with defaults for all F6 settings
  - admin_notifications seeded with 7 sample notifications
  - site_analytics_daily seeded with 90 days of randomized realistic data
*/

-- ============================================================
-- system_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT 'null'::jsonb,
  label text NOT NULL DEFAULT '',
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES admin_users(id)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO system_settings (key, value, label, description, category) VALUES
  ('maintenance_mode',         'false'::jsonb,                                                 'Maintenance Mode',         'Show maintenance page to all visitors',                    'general'),
  ('registration_mode',        '"open"'::jsonb,                                                'Registration Mode',        'open | invite_only | closed',                             'general'),
  ('platform_name',            '"Bethra"'::jsonb,                                              'Platform Name',            'Public-facing name of the platform',                      'general'),
  ('rate_limit_login',         '5'::jsonb,                                                     'Login Rate Limit',         'Max failed login attempts before lockout',                'security'),
  ('rate_limit_api',           '100'::jsonb,                                                   'API Rate Limit',           'Max API calls per minute per user',                       'security'),
  ('session_timeout_hours',    '24'::jsonb,                                                    'Session Timeout (hours)',  'Admin session expiry in hours',                           'security'),
  ('feature_ai_coach',         'true'::jsonb,                                                  'AI Coach',                 'Enable the AI startup coach feature',                     'features'),
  ('feature_investor_marketplace', 'true'::jsonb,                                              'Investor Marketplace',     'Enable investor-founder marketplace',                     'features'),
  ('feature_groups',           'true'::jsonb,                                                  'Founder Groups',           'Enable founder community groups',                         'features'),
  ('feature_connections',      'true'::jsonb,                                                  'Connections',              'Enable founder-investor connections',                     'features'),
  ('feature_ideas_library',    'true'::jsonb,                                                  'Ideas Library',            'Enable public ideas library',                             'features'),
  ('feature_whatsapp_faq',     'true'::jsonb,                                                  'WhatsApp FAB',             'Show WhatsApp floating action button',                    'features'),
  ('seo_site_title',           '"Bethra - Validate Your Startup Idea"'::jsonb,                 'Site Title',               'Default meta title for public pages',                     'seo'),
  ('seo_site_description',     '"The platform for entrepreneurs to validate and fund startup ideas."'::jsonb, 'Meta Description', 'Default meta description',                         'seo'),
  ('seo_keywords',             '"startup, idea validation, entrepreneur, investor"'::jsonb,    'Meta Keywords',            'Comma-separated SEO keywords',                            'seo'),
  ('email_welcome_enabled',    'true'::jsonb,                                                  'Welcome Email',            'Send welcome email on new registration',                  'email'),
  ('email_digest_frequency',   '"daily"'::jsonb,                                               'Admin Email Digest',       'real_time | hourly | daily | off',                        'email'),
  ('email_from_name',          '"Bethra Team"'::jsonb,                                         'From Name',                'Sender name for outgoing emails',                         'email'),
  ('email_from_address',       '"hello@bethra.co"'::jsonb,                                     'From Address',             'Sender email address',                                    'email'),
  ('notif_new_user',           'true'::jsonb,                                                  'Notify: New Registration', 'Alert admins when a new user registers',                  'notifications'),
  ('notif_new_ticket',         'true'::jsonb,                                                  'Notify: New Ticket',       'Alert admins when a support ticket is submitted',         'notifications'),
  ('notif_failed_login',       'true'::jsonb,                                                  'Notify: Failed Logins',    'Alert on 5+ consecutive failed admin login attempts',     'notifications'),
  ('notif_system_error',       'true'::jsonb,                                                  'Notify: System Errors',    'Alert on database or API errors',                         'notifications'),
  ('notif_unusual_traffic',    'false'::jsonb,                                                 'Notify: Traffic Spikes',   'Alert on unusual traffic patterns',                       'notifications'),
  ('whatsapp_alerts_number',   '"+14804476256"'::jsonb,                                        'WhatsApp Alert Number',    'Phone number for critical WhatsApp alerts',               'notifications')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- admin_notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('new_user', 'ticket', 'report', 'failed_login', 'system_error', 'traffic')),
  title text NOT NULL,
  message text NOT NULL,
  link text DEFAULT '',
  read_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

INSERT INTO admin_notifications (type, title, message, link, created_at) VALUES
  ('new_user',      'New Registration',    'Sarah Chen just registered as a founder',              '/admin/users',     now() - INTERVAL '5 minutes'),
  ('ticket',        'New Support Ticket',  'Password reset request from marcus@example.com',        '/admin/support',   now() - INTERVAL '18 minutes'),
  ('failed_login',  'Security Alert',      '5 failed login attempts detected for admin account',    '/admin/audit-log', now() - INTERVAL '42 minutes'),
  ('new_user',      'New Registration',    'David Park joined as an investor',                      '/admin/users',     now() - INTERVAL '1 hour'),
  ('ticket',        'Urgent Ticket #47',   'Critical bug report: payment flow broken',              '/admin/support',   now() - INTERVAL '2 hours'),
  ('system_error',  'System Warning',      'Database query time exceeded 2000ms threshold',         '/admin/audit-log', now() - INTERVAL '3 hours'),
  ('new_user',      'New Registration',    'Emma Rodriguez registered as a founder',                '/admin/users',     now() - INTERVAL '4 hours');

-- ============================================================
-- site_analytics_daily
-- ============================================================
CREATE TABLE IF NOT EXISTS site_analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  visitors integer DEFAULT 0,
  page_views integer DEFAULT 0,
  new_users integer DEFAULT 0,
  returning_users integer DEFAULT 0,
  avg_session_duration_seconds integer DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0,
  organic_traffic integer DEFAULT 0,
  paid_traffic integer DEFAULT 0,
  social_traffic integer DEFAULT 0,
  direct_traffic integer DEFAULT 0,
  referral_traffic integer DEFAULT 0,
  mobile_users integer DEFAULT 0,
  desktop_users integer DEFAULT 0,
  tablet_users integer DEFAULT 0
);

ALTER TABLE site_analytics_daily ENABLE ROW LEVEL SECURITY;

INSERT INTO site_analytics_daily (
  date, visitors, page_views, new_users, returning_users,
  avg_session_duration_seconds, bounce_rate,
  organic_traffic, paid_traffic, social_traffic, direct_traffic, referral_traffic,
  mobile_users, desktop_users, tablet_users
)
SELECT
  d::date,
  (160 + (sin(extract(dow from d) * 0.9) * 40 + random() * 80))::integer,
  (400 + (sin(extract(dow from d) * 0.9) * 100 + random() * 200))::integer,
  (6 + random() * 18)::integer,
  (140 + (sin(extract(dow from d) * 0.9) * 30 + random() * 60))::integer,
  (150 + random() * 150)::integer,
  (30 + random() * 30)::numeric(5,2),
  (70 + random() * 60)::integer,
  (15 + random() * 25)::integer,
  (25 + random() * 35)::integer,
  (35 + random() * 45)::integer,
  (8 + random() * 15)::integer,
  (80 + random() * 70)::integer,
  (65 + random() * 55)::integer,
  (15 + random() * 20)::integer
FROM generate_series(CURRENT_DATE - INTERVAL '89 days', CURRENT_DATE, INTERVAL '1 day') d
ON CONFLICT (date) DO NOTHING;
