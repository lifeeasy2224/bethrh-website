/*
  # Startup Accelerator Schema

  Full schema for the Bethrah startup accelerator platform.

  ## Tables
  - users: profiles linked to auth.users
  - ideas: startup ideas per user
  - validation_logs: interview/signup/preorder tracking per idea
  - ai_chats: AI coaching chat history
  - pods: accountability pods
  - pod_members: pod membership with streak tracking

  ## Security
  - RLS enabled on all tables
  - Users access only their own data
  - Pod data accessible to pod members
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE,
  name text,
  country text DEFAULT 'Syria',
  skills text[],
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- Ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text,
  description text,
  sector text,
  validation_score int DEFAULT 0,
  stage text DEFAULT 'ideation',
  week int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Validation logs
CREATE TABLE IF NOT EXISTS validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  interviews int DEFAULT 0,
  signups int DEFAULT 0,
  preorders_usd int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- AI chat history
CREATE TABLE IF NOT EXISTS ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Accountability pods
CREATE TABLE IF NOT EXISTS pods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pod_members (
  pod_id uuid REFERENCES pods(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  streak int DEFAULT 0,
  PRIMARY KEY (pod_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS ideas_user_id_idx ON ideas(user_id);
CREATE INDEX IF NOT EXISTS validation_logs_idea_id_idx ON validation_logs(idea_id);
CREATE INDEX IF NOT EXISTS ai_chats_user_id_idx ON ai_chats(user_id);
CREATE INDEX IF NOT EXISTS pod_members_user_id_idx ON pod_members(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_members ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ideas policies
CREATE POLICY "Users can view own ideas"
  ON ideas FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas"
  ON ideas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas"
  ON ideas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON ideas FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Validation logs policies
CREATE POLICY "Users can view validation logs for own ideas"
  ON validation_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ideas WHERE ideas.id = validation_logs.idea_id AND ideas.user_id = auth.uid()));

CREATE POLICY "Users can insert validation logs for own ideas"
  ON validation_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM ideas WHERE ideas.id = validation_logs.idea_id AND ideas.user_id = auth.uid()));

CREATE POLICY "Users can update validation logs for own ideas"
  ON validation_logs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM ideas WHERE ideas.id = validation_logs.idea_id AND ideas.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM ideas WHERE ideas.id = validation_logs.idea_id AND ideas.user_id = auth.uid()));

-- AI chats policies
CREATE POLICY "Users can view own chats"
  ON ai_chats FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats"
  ON ai_chats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Pods policies
CREATE POLICY "Pod members can view pods"
  ON pods FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pod_members WHERE pod_members.pod_id = pods.id AND pod_members.user_id = auth.uid()));

-- Pod members policies
CREATE POLICY "Users can view their pod memberships"
  ON pod_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view co-members in same pod"
  ON pod_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pod_members pm2 WHERE pm2.pod_id = pod_members.pod_id AND pm2.user_id = auth.uid()));

CREATE POLICY "Users can update own pod membership"
  ON pod_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
$$;

-- Admin policies
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can view all ideas"
  ON ideas FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins can view all validation logs"
  ON validation_logs FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins can view all pods"
  ON pods FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins can view all pod members"
  ON pod_members FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins can view all chats"
  ON ai_chats FOR SELECT TO authenticated USING (is_admin());
