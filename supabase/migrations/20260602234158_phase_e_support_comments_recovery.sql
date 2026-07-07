/*
  # Phase E: Support Tickets, Comments & Account Recovery

  ## Summary
  Extends support_tickets with full conversation threads, auto-categorization,
  assignment tracking, and adds a comments/feedback table plus recovery log.

  ## New Tables

  1. `ticket_replies`
     - Stores conversation threads for support tickets
     - Columns: id, ticket_id, sender_type (admin|user), sender_id, body, created_at

  2. `user_feedback` (comments)
     - User-submitted feedback, bug reports, feature requests
     - Columns: id, user_id, type, subject, body, status, priority, assigned_to, created_at

  3. `feedback_replies`
     - Admin replies to user feedback
     - Columns: id, feedback_id, admin_user_id, body, created_at

  4. `account_recovery_log`
     - Audit trail of account recovery actions
     - Columns: id, admin_user_id, target_user_id, action, notes, created_at

  ## Modified Tables

  - `support_tickets`: adds category, assigned_to, ticket_number (auto-increment),
    updated_at, user_name_cache, user_email_cache

  ## Security
  - RLS enabled on all tables
  - Users can read/create their own tickets/feedback and view replies
  - Service role (edge function) handles all admin operations
*/

-- ─────────────────────────────────────────
-- Extend support_tickets
-- ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='category') THEN
    ALTER TABLE support_tickets ADD COLUMN category text NOT NULL DEFAULT 'other'
      CHECK (category IN ('login', 'account_recovery', 'billing', 'bug', 'other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='assigned_to') THEN
    ALTER TABLE support_tickets ADD COLUMN assigned_to uuid REFERENCES admin_users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='updated_at') THEN
    ALTER TABLE support_tickets ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='ticket_number') THEN
    ALTER TABLE support_tickets ADD COLUMN ticket_number serial;
  END IF;
  -- Normalize existing status values to match new schema
  -- old: open/in_progress/resolved/closed → new labels same
END $$;

-- ─────────────────────────────────────────
-- ticket_replies
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_replies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'user')),
  sender_id   uuid,
  body        text NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read replies on own tickets" ON ticket_replies;
CREATE POLICY "Users can read replies on own tickets"
  ON ticket_replies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_replies.ticket_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert replies on own tickets" ON ticket_replies;
CREATE POLICY "Users can insert replies on own tickets"
  ON ticket_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_type = 'user' AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_replies.ticket_id AND user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON ticket_replies(ticket_id);

-- ─────────────────────────────────────────
-- user_feedback (comments)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type        text NOT NULL DEFAULT 'feedback'
    CHECK (type IN ('feedback', 'bug', 'feature_request', 'comment')),
  subject     text NOT NULL DEFAULT '',
  body        text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')),
  priority    text NOT NULL DEFAULT 'low'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own feedback" ON user_feedback;
CREATE POLICY "Users can read own feedback"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create feedback" ON user_feedback;
CREATE POLICY "Users can create feedback"
  ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created ON user_feedback(created_at DESC);

-- ─────────────────────────────────────────
-- feedback_replies
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_replies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id   uuid NOT NULL REFERENCES user_feedback(id) ON DELETE CASCADE,
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  body          text NOT NULL DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read replies on own feedback" ON feedback_replies;
CREATE POLICY "Users can read replies on own feedback"
  ON feedback_replies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_feedback
      WHERE id = feedback_replies.feedback_id AND user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_feedback_replies_feedback ON feedback_replies(feedback_id);

-- ─────────────────────────────────────────
-- account_recovery_log
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS account_recovery_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  target_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action          text NOT NULL,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE account_recovery_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_recovery_log_target ON account_recovery_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_log_created ON account_recovery_log(created_at DESC);

-- Seed some sample feedback for demo
INSERT INTO user_feedback (type, subject, body, status, priority, created_at)
VALUES
  ('bug', 'Dashboard not loading', 'The founder dashboard shows a blank screen after login.', 'new', 'high', now() - interval '2 hours'),
  ('feature_request', 'Dark mode support', 'Would love a dark mode for the platform, especially for late-night sessions.', 'new', 'low', now() - interval '1 day'),
  ('feedback', 'Great platform!', 'Just wanted to say the Ideas Library is incredibly useful. Thank you!', 'new', 'low', now() - interval '3 days'),
  ('comment', 'Suggestion for AI Coach', 'The AI Coach could benefit from remembering context across sessions.', 'new', 'medium', now() - interval '5 days')
ON CONFLICT DO NOTHING;
