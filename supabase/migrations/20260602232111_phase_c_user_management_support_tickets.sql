/*
  # Phase C: User Management & Support Tickets

  ## Summary
  Adds infrastructure needed for admin user management (C3–C5) and dashboard stats (C1).

  ## Changes

  ### 1. profiles table — new columns
  - `status` (text): 'active' | 'suspended' | 'pending' — default 'active'
  - `suspension_reason` (text): reason when suspended
  - `suspended_at` (timestamptz): when the suspension occurred
  - `last_active` (timestamptz): last activity timestamp
  - `email_verified` (boolean): whether email is verified

  ### 2. support_tickets table — new table
  - Tracks user-submitted support requests for the admin dashboard
  - Columns: id, user_id, subject, body, status, priority, created_at, resolved_at

  ### 3. admin_action_log table — new table
  - Audit trail of all admin actions taken on user accounts
  - Columns: id, admin_user_id, target_user_id, action, reason, metadata, created_at

  ## Security
  - RLS enabled on all new tables
  - support_tickets: users read/insert own tickets
  - admin_action_log: service role only (no user policies — admin edge function uses service role)
*/

-- ─────────────────────────────────────────
-- Extend profiles table
-- ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
    ALTER TABLE profiles ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='suspension_reason') THEN
    ALTER TABLE profiles ADD COLUMN suspension_reason text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='suspended_at') THEN
    ALTER TABLE profiles ADD COLUMN suspended_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_active') THEN
    ALTER TABLE profiles ADD COLUMN last_active timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email_verified') THEN
    ALTER TABLE profiles ADD COLUMN email_verified boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- ─────────────────────────────────────────
-- Support tickets
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject     text NOT NULL DEFAULT '',
  body        text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority    text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at  timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);

-- ─────────────────────────────────────────
-- Admin action log
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_action_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  target_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action          text NOT NULL,
  reason          text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE admin_action_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_action_log_target ON admin_action_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_admin ON admin_action_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_created ON admin_action_log(created_at DESC);
