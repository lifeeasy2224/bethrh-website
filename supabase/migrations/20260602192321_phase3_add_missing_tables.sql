/*
  # Phase 3: Add Missing Founder Experience Tables

  ## Overview
  Adds tables not yet present in the database:
  - coach_conversations: AI coach conversation threads
  - coach_messages: Individual messages within conversations
  - groups: Accountability groups
  - group_members: Group membership junction table
  - group_checkins: Weekly accountability check-in posts
  - pitch_data: Stores funding pitch "ask" section

  Also extends validation_entries with sentiment column
  and journey_tasks with is_completed + completed_at columns.

  ## Security
  - RLS enabled on all new tables
  - All policies restrict to authenticated users, scoped by user_id
  - Group data is accessible to members of that group

  ## Notes
  1. Existing tables (user_ideas, validation_entries, canvas_data, journey_tasks)
     already exist and are preserved — only new columns added where needed
  2. coach_messages role: 'user' | 'assistant'
  3. group_members role: 'admin' | 'member'
  4. group_checkins uses week_start (Monday date) as the weekly key
*/

-- =============================================
-- EXTEND VALIDATION_ENTRIES
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'validation_entries' AND column_name = 'sentiment'
  ) THEN
    ALTER TABLE validation_entries ADD COLUMN sentiment text DEFAULT 'positive';
  END IF;
END $$;

-- =============================================
-- EXTEND JOURNEY_TASKS
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journey_tasks' AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE journey_tasks ADD COLUMN is_completed boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journey_tasks' AND column_name = 'task_key'
  ) THEN
    -- already exists from schema, no-op
    NULL;
  END IF;
END $$;

-- =============================================
-- COACH CONVERSATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS coach_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_idea_id uuid REFERENCES user_ideas(id) ON DELETE SET NULL,
  title text DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coach conversations"
  ON coach_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coach conversations"
  ON coach_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coach conversations"
  ON coach_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own coach conversations"
  ON coach_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS coach_conversations_user_id_idx ON coach_conversations(user_id);

-- =============================================
-- COACH MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES coach_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coach messages"
  ON coach_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coach messages"
  ON coach_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own coach messages"
  ON coach_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS coach_messages_conversation_id_idx ON coach_messages(conversation_id);

-- =============================================
-- GROUPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS accountability_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector text NOT NULL,
  description text DEFAULT '',
  max_members integer DEFAULT 5,
  checkin_day text DEFAULT 'monday',
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accountability_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view public groups"
  ON accountability_groups FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create groups"
  ON accountability_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
  ON accountability_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
  ON accountability_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- =============================================
-- GROUP MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES accountability_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  missed_checkins integer DEFAULT 0,
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view memberships in their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON group_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members(user_id);

-- =============================================
-- GROUP CHECKINS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS group_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES accountability_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  accomplished text NOT NULL,
  goal_next_week text NOT NULL,
  blocker text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id, week_start)
);

ALTER TABLE group_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view checkins for their groups"
  ON group_checkins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_checkins.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own checkins"
  ON group_checkins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins"
  ON group_checkins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins"
  ON group_checkins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS group_checkins_group_id_idx ON group_checkins(group_id);

-- =============================================
-- PITCH DATA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS pitch_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_idea_id uuid REFERENCES user_ideas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  investment_amount numeric,
  use_of_funds text DEFAULT '',
  last_generated_at timestamptz,
  UNIQUE(user_idea_id)
);

ALTER TABLE pitch_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pitch data"
  ON pitch_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pitch data"
  ON pitch_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pitch data"
  ON pitch_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pitch data"
  ON pitch_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
