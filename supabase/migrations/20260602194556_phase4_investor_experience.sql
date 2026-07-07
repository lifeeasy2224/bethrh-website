/*
  # Phase 4: Investor Experience Tables

  ## Overview
  Adds all tables required for the investor-founder connection system, messaging,
  notifications, saved ideas, and blocked investors.

  ## New Tables
  1. `connection_requests` — Investor requests to connect with a founder about a specific idea
  2. `connections` — Active connections created when a request is accepted
  3. `messages` — Messages exchanged within a connection
  4. `notifications` — In-app notifications for both roles
  5. `blocked_investors` — Founders can block specific investors
  6. `idea_views` — Analytics: track which investor viewed which idea
  7. `saved_ideas` — Investor bookmarks/saved ideas

  ## Schema Notes
  - All FKs reference auth.users(id) (not a custom users table)
  - idea_id references user_ideas(id) (not ideas)
  - investor_profiles already exists with sectors_of_interest, check_size, bio, city fields
  - Added linkedin_url, value_add, state columns to investor_profiles

  ## Security
  - RLS enabled on all new tables
  - Founders see only their own requests/connections
  - Investors see only their own requests/connections
  - Messages visible only to connection participants
*/

-- Add missing columns to investor_profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investor_profiles' AND column_name = 'linkedin_url') THEN
    ALTER TABLE investor_profiles ADD COLUMN linkedin_url text DEFAULT '';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investor_profiles' AND column_name = 'value_add') THEN
    ALTER TABLE investor_profiles ADD COLUMN value_add text DEFAULT '';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investor_profiles' AND column_name = 'state') THEN
    ALTER TABLE investor_profiles ADD COLUMN state text DEFAULT '';
  END IF;
END $$;

-- Add owner_id column to accountability_groups if not present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accountability_groups' AND column_name = 'owner_id') THEN
    ALTER TABLE accountability_groups ADD COLUMN owner_id uuid REFERENCES auth.users(id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accountability_groups' AND column_name = 'meeting_frequency') THEN
    ALTER TABLE accountability_groups ADD COLUMN meeting_frequency text DEFAULT 'Weekly';
  END IF;
END $$;

-- Fix group_checkins columns to match GroupDetailPage expectations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_checkins' AND column_name = 'progress_text') THEN
    ALTER TABLE group_checkins ADD COLUMN progress_text text DEFAULT '';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_checkins' AND column_name = 'goal_for_next_week') THEN
    ALTER TABLE group_checkins ADD COLUMN goal_for_next_week text DEFAULT '';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_checkins' AND column_name = 'streak') THEN
    ALTER TABLE group_checkins ADD COLUMN streak integer DEFAULT 1;
  END IF;
END $$;

-- Connection requests table
CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES user_ideas(id) ON DELETE CASCADE,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors can insert own requests"
  ON connection_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Investors can select own requests"
  ON connection_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = investor_id OR auth.uid() = founder_id);

CREATE POLICY "Investors can update own requests"
  ON connection_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = investor_id OR auth.uid() = founder_id)
  WITH CHECK (auth.uid() = investor_id OR auth.uid() = founder_id);

CREATE POLICY "Investors can delete own requests"
  ON connection_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = investor_id);

-- Connections table (created when request is accepted)
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES user_ideas(id) ON DELETE CASCADE,
  request_id uuid REFERENCES connection_requests(id),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended')),
  ended_at timestamptz,
  ended_by uuid REFERENCES auth.users(id),
  end_reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Connection participants can view"
  ON connections FOR SELECT
  TO authenticated
  USING (auth.uid() = investor_id OR auth.uid() = founder_id);

CREATE POLICY "System can insert connections"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = founder_id OR auth.uid() = investor_id);

CREATE POLICY "Connection participants can update"
  ON connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = investor_id OR auth.uid() = founder_id)
  WITH CHECK (auth.uid() = investor_id OR auth.uid() = founder_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_system_message boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Connection participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM connections c
      WHERE c.id = messages.connection_id
        AND (c.investor_id = auth.uid() OR c.founder_id = auth.uid())
    )
  );

CREATE POLICY "Connection participants can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM connections c
      WHERE c.id = messages.connection_id
        AND (c.investor_id = auth.uid() OR c.founder_id = auth.uid())
        AND c.status = 'active'
    )
  );

CREATE POLICY "Senders can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text DEFAULT '',
  link text DEFAULT '',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Blocked investors
CREATE TABLE IF NOT EXISTS blocked_investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(founder_id, investor_id)
);

ALTER TABLE blocked_investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders can manage own blocks"
  ON blocked_investors FOR SELECT
  TO authenticated
  USING (auth.uid() = founder_id);

CREATE POLICY "Founders can insert blocks"
  ON blocked_investors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Founders can delete blocks"
  ON blocked_investors FOR DELETE
  TO authenticated
  USING (auth.uid() = founder_id);

-- Idea views (analytics)
CREATE TABLE IF NOT EXISTS idea_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES user_ideas(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE idea_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors can insert own views"
  ON idea_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Investors can view own analytics"
  ON idea_views FOR SELECT
  TO authenticated
  USING (auth.uid() = investor_id);

-- Saved ideas (bookmarks)
CREATE TABLE IF NOT EXISTS saved_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES user_ideas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(investor_id, idea_id)
);

ALTER TABLE saved_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors can view own saved ideas"
  ON saved_ideas FOR SELECT
  TO authenticated
  USING (auth.uid() = investor_id);

CREATE POLICY "Investors can insert saved ideas"
  ON saved_ideas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Investors can delete saved ideas"
  ON saved_ideas FOR DELETE
  TO authenticated
  USING (auth.uid() = investor_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connection_requests_investor ON connection_requests(investor_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_founder ON connection_requests(founder_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connections_investor ON connections(investor_id);
CREATE INDEX IF NOT EXISTS idx_connections_founder ON connections(founder_id);
CREATE INDEX IF NOT EXISTS idx_messages_connection ON messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_saved_ideas_investor ON saved_ideas(investor_id);
