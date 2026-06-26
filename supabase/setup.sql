-- ============================================================
-- بذرة (Bethrh) — Complete Database Setup
-- Run this entire file in Supabase SQL Editor
-- Project: czreiquyyepzqfimrycl
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- PART 1: CORE SCHEMA
-- ════════════════════════════════════════════════════════════

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                text UNIQUE,
  name                 text,
  country              text DEFAULT 'Syria',
  skills               text[],
  role                 text NOT NULL DEFAULT 'user',
  bio                  text,
  linkedin_url         text,
  sector               text,
  goal                 text,
  investor_preferences jsonb DEFAULT NULL,
  created_at           timestamptz DEFAULT now()
);

-- Ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES users(id) ON DELETE CASCADE,
  title            text,
  description      text,
  sector           text,
  validation_score int DEFAULT 0,
  stage            text DEFAULT 'ideation',
  week             int DEFAULT 1,
  committed_at     timestamptz DEFAULT NULL,
  committed_user_id uuid DEFAULT NULL,
  created_at       timestamptz DEFAULT now()
);

-- Validation logs
CREATE TABLE IF NOT EXISTS validation_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id        uuid REFERENCES ideas(id) ON DELETE CASCADE,
  interviews     int DEFAULT 0,
  signups        int DEFAULT 0,
  preorders_usd  int DEFAULT 0,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

-- AI chat history
CREATE TABLE IF NOT EXISTS ai_chats (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  role       text,
  message    text,
  created_at timestamptz DEFAULT now()
);

-- Accountability pods
CREATE TABLE IF NOT EXISTS pods (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pod_members (
  pod_id  uuid REFERENCES pods(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  streak  int DEFAULT 0,
  PRIMARY KEY (pod_id, user_id)
);

-- Tasks (90-day plans)
CREATE TABLE IF NOT EXISTS tasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id    uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  week       integer NOT NULL,
  status     text NOT NULL DEFAULT 'todo',
  notes      text,
  created_at timestamptz DEFAULT now()
);

-- Question logs
CREATE TABLE IF NOT EXISTS question_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question   text NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Founder progress (journey)
CREATE TABLE IF NOT EXISTS founder_progress (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage           text NOT NULL DEFAULT 'seed',
  stage_1_done            boolean NOT NULL DEFAULT false,
  stage_2_score           integer NOT NULL DEFAULT 0,
  stage_3_tasks_done      integer NOT NULL DEFAULT 0,
  stage_4_first_customer  boolean NOT NULL DEFAULT false,
  badges                  text[] NOT NULL DEFAULT '{}',
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Idea scores
CREATE TABLE IF NOT EXISTS idea_scores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id           uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score       integer NOT NULL DEFAULT 0,
  value_score       integer NOT NULL DEFAULT 0,
  market_score      integer NOT NULL DEFAULT 0,
  validation_score  integer NOT NULL DEFAULT 0,
  feasibility_score integer NOT NULL DEFAULT 0,
  pitch_score       integer NOT NULL DEFAULT 0,
  journey_score     integer NOT NULL DEFAULT 0,
  benchmark_sector  text DEFAULT '',
  benchmark_country text DEFAULT '',
  benchmark_avg     integer NOT NULL DEFAULT 0,
  recommendations   jsonb NOT NULL DEFAULT '[]',
  gpt_summary       text DEFAULT '',
  version           integer NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Canvas drafts
CREATE TABLE IF NOT EXISTS canvas_drafts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id                uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_proposition      text NOT NULL DEFAULT '',
  customer_segments      text NOT NULL DEFAULT '',
  channels               text NOT NULL DEFAULT '',
  customer_relationships text NOT NULL DEFAULT '',
  revenue_streams        text NOT NULL DEFAULT '',
  key_resources          text NOT NULL DEFAULT '',
  key_activities         text NOT NULL DEFAULT '',
  key_partners           text NOT NULL DEFAULT '',
  cost_structure         text NOT NULL DEFAULT '',
  financial_items        jsonb NOT NULL DEFAULT '[]',
  ai_score               integer DEFAULT 0,
  is_locked              boolean NOT NULL DEFAULT false,
  updated_at             timestamptz DEFAULT now(),
  UNIQUE(idea_id)
);

-- Idea validations
CREATE TABLE IF NOT EXISTS idea_validations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id     uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  q1_problem  text NOT NULL DEFAULT '',
  q2_audience text NOT NULL DEFAULT '',
  q3_evidence text NOT NULL DEFAULT '',
  ai_feedback text NOT NULL DEFAULT '',
  result      text NOT NULL DEFAULT 'pending' CHECK (result IN ('passed', 'failed', 'pending')),
  score       integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(idea_id)
);

-- Greenhouse listings
CREATE TABLE IF NOT EXISTS greenhouse_listings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id          uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  canvas_id        uuid REFERENCES canvas_drafts(id) ON DELETE SET NULL,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name       text NOT NULL,
  logo             text,
  tagline          text,
  sector           text NOT NULL DEFAULT '',
  iro              integer NOT NULL DEFAULT 0,
  breakeven_months integer NOT NULL DEFAULT 0,
  score            integer NOT NULL DEFAULT 0,
  level            text NOT NULL DEFAULT 'متجذر' CHECK (level IN ('متجذر', 'مثمر')),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'funded')),
  contact_requests integer NOT NULL DEFAULT 0,
  published_at     timestamptz DEFAULT now(),
  UNIQUE(idea_id)
);

-- Greenhouse contact requests
CREATE TABLE IF NOT EXISTS greenhouse_contact_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES greenhouse_listings(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message      text,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE(listing_id, requester_id)
);

-- Idea library (curated ideas)
CREATE TABLE IF NOT EXISTS idea_library (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar                      text NOT NULL,
  sector                        text NOT NULL,
  sector_label_ar               text NOT NULL,
  problem_ar                    text NOT NULL,
  solution_ar                   text NOT NULL,
  target_market_ar              text NOT NULL,
  revenue_model_ar              text NOT NULL,
  why_now_ar                    text NOT NULL,
  challenge_ar                  text NOT NULL,
  estimated_iro                 integer,
  estimated_breakeven           integer,
  estimated_investment_min      integer,
  estimated_investment_max      integer,
  estimated_monthly_revenue_min integer,
  estimated_monthly_revenue_max integer,
  suitable_countries            text[] DEFAULT '{}',
  max_entrepreneurs             integer DEFAULT 3,
  current_entrepreneurs         integer DEFAULT 0,
  is_active                     boolean DEFAULT true,
  quarter                       text DEFAULT 'Q2-2026',
  created_at                    timestamptz DEFAULT now(),
  updated_at                    timestamptz DEFAULT now()
);

-- Idea library selections
CREATE TABLE IF NOT EXISTS idea_library_selections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  library_idea_id uuid NOT NULL REFERENCES idea_library(id),
  user_idea_id    uuid REFERENCES ideas(id) ON DELETE SET NULL,
  country         text NOT NULL,
  city            text DEFAULT '',
  differentiation text NOT NULL,
  advantage       text NOT NULL,
  custom_name     text NOT NULL,
  selected_at     timestamptz DEFAULT now()
);

-- Seeds library
CREATE TABLE IF NOT EXISTS seeds (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text        UNIQUE NOT NULL,
  name               text        NOT NULL,
  sector_id          text        NOT NULL,
  sector_emoji       text        NOT NULL DEFAULT '🌱',
  sector_label       text        NOT NULL,
  short_description  text,
  problem            text,
  solution           text,
  target_customer    text,
  revenue_model      text,
  financial_estimates text,
  why_it_works       text,
  risks              text,
  best_markets       text,
  quick_start_steps  text,
  investment_min     integer     DEFAULT 0,
  investment_max     integer     DEFAULT 0,
  roi_estimate       integer     DEFAULT 0,
  break_even_months  integer     DEFAULT 0,
  max_spots          integer     DEFAULT 3,
  spots_taken        integer     DEFAULT 0,
  status             text        DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  views              integer     DEFAULT 0,
  grabs              integer     DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

-- Seed grabs
CREATE TABLE IF NOT EXISTS seed_grabs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id    uuid        NOT NULL REFERENCES seeds(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL,
  idea_id    uuid        REFERENCES ideas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seed_id, user_id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role       text NOT NULL DEFAULT 'founder' CHECK (user_role IN ('founder', 'investor')),
  trigger_type    text NOT NULL CHECK (trigger_type IN ('stage_complete','high_score','greenhouse_contact_founder','greenhouse_contact_investor')),
  trigger_context text DEFAULT '',
  rating          int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback        text DEFAULT '',
  photo_url       text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

-- Promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text UNIQUE NOT NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  description      text DEFAULT '',
  max_uses         integer DEFAULT NULL,
  times_used       integer DEFAULT 0,
  is_active        boolean DEFAULT true,
  expires_at       timestamptz DEFAULT NULL,
  created_by_email text DEFAULT '',
  created_at       timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- PART 2: INDEXES
-- ════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS ideas_user_id_idx ON ideas(user_id);
CREATE INDEX IF NOT EXISTS validation_logs_idea_id_idx ON validation_logs(idea_id);
CREATE INDEX IF NOT EXISTS ai_chats_user_id_idx ON ai_chats(user_id);
CREATE INDEX IF NOT EXISTS pod_members_user_id_idx ON pod_members(user_id);
CREATE INDEX IF NOT EXISTS idea_scores_idea_id_idx ON idea_scores(idea_id);
CREATE INDEX IF NOT EXISTS idea_scores_user_id_idx ON idea_scores(user_id);
CREATE INDEX IF NOT EXISTS canvas_drafts_idea_id_idx ON canvas_drafts(idea_id);
CREATE INDEX IF NOT EXISTS canvas_drafts_user_id_idx ON canvas_drafts(user_id);
CREATE INDEX IF NOT EXISTS idea_validations_idea_id_idx ON idea_validations(idea_id);
CREATE INDEX IF NOT EXISTS idea_validations_user_id_idx ON idea_validations(user_id);
CREATE INDEX IF NOT EXISTS greenhouse_listings_status_idx ON greenhouse_listings(status);
CREATE INDEX IF NOT EXISTS greenhouse_listings_sector_idx ON greenhouse_listings(sector);
CREATE INDEX IF NOT EXISTS greenhouse_listings_score_idx ON greenhouse_listings(score DESC);
CREATE INDEX IF NOT EXISTS greenhouse_contact_requests_listing_idx ON greenhouse_contact_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_idea_library_sector ON idea_library(sector);
CREATE INDEX IF NOT EXISTS idx_idea_library_active ON idea_library(is_active);
CREATE INDEX IF NOT EXISTS idx_library_selections_user ON idea_library_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_library_selections_library_idea ON idea_library_selections(library_idea_id);
CREATE INDEX IF NOT EXISTS seeds_sector_id_idx ON seeds(sector_id);
CREATE INDEX IF NOT EXISTS seeds_status_idx ON seeds(status);
CREATE INDEX IF NOT EXISTS seed_grabs_user_id_idx ON seed_grabs(user_id);
CREATE INDEX IF NOT EXISTS seed_grabs_seed_id_idx ON seed_grabs(seed_id);
CREATE INDEX IF NOT EXISTS question_logs_created_at_idx ON question_logs(created_at DESC);

-- ════════════════════════════════════════════════════════════
-- PART 3: FUNCTIONS & TRIGGERS
-- ════════════════════════════════════════════════════════════

-- is_admin(): reads from JWT app_metadata (no RLS recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- handle_new_user(): auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, name, country, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), 'Syria', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- update_idea_library_updated_at()
CREATE OR REPLACE FUNCTION public.update_idea_library_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER
SET search_path = '' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_idea_library_updated_at() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS trg_idea_library_updated_at ON idea_library;
CREATE TRIGGER trg_idea_library_updated_at
  BEFORE UPDATE ON idea_library
  FOR EACH ROW EXECUTE FUNCTION update_idea_library_updated_at();

-- handle_library_selection_change()
CREATE OR REPLACE FUNCTION public.handle_library_selection_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.idea_library SET current_entrepreneurs = current_entrepreneurs + 1 WHERE id = NEW.library_idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.idea_library SET current_entrepreneurs = GREATEST(current_entrepreneurs - 1, 0) WHERE id = OLD.library_idea_id;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_library_selection_change() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS trg_library_selection_count ON idea_library_selections;
CREATE TRIGGER trg_library_selection_count
  AFTER INSERT OR DELETE ON idea_library_selections
  FOR EACH ROW EXECUTE FUNCTION handle_library_selection_change();

-- grab_seed(): atomic seed grab with identity check
CREATE OR REPLACE FUNCTION public.grab_seed(p_seed_id uuid, p_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_idea_id uuid;
  v_seed    record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF auth.uid() <> p_user_id THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;

  SELECT * INTO v_seed FROM public.seeds WHERE id = p_seed_id AND status = 'active' FOR UPDATE;
  IF v_seed IS NULL THEN RAISE EXCEPTION 'SEED_NOT_FOUND'; END IF;
  IF v_seed.spots_taken >= v_seed.max_spots THEN RAISE EXCEPTION 'NO_SPOTS'; END IF;
  IF EXISTS (SELECT 1 FROM public.seed_grabs WHERE seed_id = p_seed_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'ALREADY_GRABBED';
  END IF;

  INSERT INTO public.ideas (user_id, title, description, sector, stage, week, validation_score)
  VALUES (p_user_id, v_seed.name, v_seed.short_description, v_seed.sector_id, 'ideation', 1, 0)
  RETURNING id INTO v_idea_id;

  INSERT INTO public.seed_grabs (seed_id, user_id, idea_id) VALUES (p_seed_id, p_user_id, v_idea_id);

  UPDATE public.seeds SET spots_taken = spots_taken + 1, grabs = grabs + 1, updated_at = now() WHERE id = p_seed_id;

  RETURN v_idea_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grab_seed(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.grab_seed(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════
-- PART 4: ENABLE RLS
-- ════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE greenhouse_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE greenhouse_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_library_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_grabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- PART 5: RLS POLICIES
-- ════════════════════════════════════════════════════════════

-- users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Admins can update any user" ON users;
CREATE POLICY "Admins can update any user" ON users FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ideas
DROP POLICY IF EXISTS "Users can view own ideas" ON ideas;
CREATE POLICY "Users can view own ideas" ON ideas FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own ideas" ON ideas;
CREATE POLICY "Users can insert own ideas" ON ideas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own ideas" ON ideas;
CREATE POLICY "Users can update own ideas" ON ideas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own ideas" ON ideas;
CREATE POLICY "Users can delete own ideas" ON ideas FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all ideas" ON ideas;
CREATE POLICY "Admins can view all ideas" ON ideas FOR SELECT TO authenticated USING (is_admin());

-- validation_logs
DROP POLICY IF EXISTS "Users can view validation logs for own ideas" ON validation_logs;
CREATE POLICY "Users can view validation logs for own ideas" ON validation_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ideas WHERE ideas.id = validation_logs.idea_id AND ideas.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert validation logs for own ideas" ON validation_logs;
CREATE POLICY "Users can insert validation logs for own ideas" ON validation_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM ideas WHERE ideas.id = validation_logs.idea_id AND ideas.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update validation logs for own ideas" ON validation_logs;
CREATE POLICY "Users can update validation logs for own ideas" ON validation_logs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM ideas WHERE ideas.id = validation_logs.idea_id AND ideas.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM ideas WHERE ideas.id = validation_logs.idea_id AND ideas.user_id = auth.uid()));

-- ai_chats
DROP POLICY IF EXISTS "Users can view own chats" ON ai_chats;
CREATE POLICY "Users can view own chats" ON ai_chats FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own chats" ON ai_chats;
CREATE POLICY "Users can insert own chats" ON ai_chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- pods
DROP POLICY IF EXISTS "Pod members can view pods" ON pods;
CREATE POLICY "Pod members can view pods" ON pods FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pod_members WHERE pod_members.pod_id = pods.id AND pod_members.user_id = auth.uid()));

-- pod_members
DROP POLICY IF EXISTS "Users can view their pod memberships" ON pod_members;
CREATE POLICY "Users can view their pod memberships" ON pod_members FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own pod membership" ON pod_members;
CREATE POLICY "Users can update own pod membership" ON pod_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- tasks
DROP POLICY IF EXISTS "Users can select own tasks" ON tasks;
CREATE POLICY "Users can select own tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- question_logs
DROP POLICY IF EXISTS "Authenticated users can log their own questions" ON question_logs;
CREATE POLICY "Authenticated users can log their own questions" ON question_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can read all question logs" ON question_logs;
CREATE POLICY "Admins can read all question logs" ON question_logs FOR SELECT TO authenticated USING (is_admin());

-- founder_progress
DROP POLICY IF EXISTS "Users can read own progress" ON founder_progress;
CREATE POLICY "Users can read own progress" ON founder_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own progress" ON founder_progress;
CREATE POLICY "Users can insert own progress" ON founder_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own progress" ON founder_progress;
CREATE POLICY "Users can update own progress" ON founder_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- idea_scores
DROP POLICY IF EXISTS "Users can read own scores" ON idea_scores;
CREATE POLICY "Users can read own scores" ON idea_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own scores" ON idea_scores;
CREATE POLICY "Users can insert own scores" ON idea_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- canvas_drafts
DROP POLICY IF EXISTS "Users can select own canvas drafts" ON canvas_drafts;
CREATE POLICY "Users can select own canvas drafts" ON canvas_drafts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own canvas drafts" ON canvas_drafts;
CREATE POLICY "Users can insert own canvas drafts" ON canvas_drafts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own canvas drafts" ON canvas_drafts;
CREATE POLICY "Users can update own canvas drafts" ON canvas_drafts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own canvas drafts" ON canvas_drafts;
CREATE POLICY "Users can delete own canvas drafts" ON canvas_drafts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- idea_validations
DROP POLICY IF EXISTS "Users can select own idea validations" ON idea_validations;
CREATE POLICY "Users can select own idea validations" ON idea_validations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own idea validations" ON idea_validations;
CREATE POLICY "Users can insert own idea validations" ON idea_validations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own idea validations" ON idea_validations;
CREATE POLICY "Users can update own idea validations" ON idea_validations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own idea validations" ON idea_validations;
CREATE POLICY "Users can delete own idea validations" ON idea_validations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- greenhouse_listings
DROP POLICY IF EXISTS "Public can view active greenhouse listings" ON greenhouse_listings;
CREATE POLICY "Public can view active greenhouse listings" ON greenhouse_listings FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "Owners can insert their listings" ON greenhouse_listings;
CREATE POLICY "Owners can insert their listings" ON greenhouse_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners can update their listings" ON greenhouse_listings;
CREATE POLICY "Owners can update their listings" ON greenhouse_listings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners can delete their listings" ON greenhouse_listings;
CREATE POLICY "Owners can delete their listings" ON greenhouse_listings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- greenhouse_contact_requests
DROP POLICY IF EXISTS "Founders can view contact requests for their listings" ON greenhouse_contact_requests;
CREATE POLICY "Founders can view contact requests for their listings" ON greenhouse_contact_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM greenhouse_listings gl WHERE gl.id = listing_id AND gl.user_id = auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can create contact requests" ON greenhouse_contact_requests;
CREATE POLICY "Authenticated users can create contact requests" ON greenhouse_contact_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
DROP POLICY IF EXISTS "Requesters can view own requests" ON greenhouse_contact_requests;
CREATE POLICY "Requesters can view own requests" ON greenhouse_contact_requests FOR SELECT TO authenticated USING (auth.uid() = requester_id);

-- idea_library (public SELECT — anyone can browse)
DROP POLICY IF EXISTS "Anyone can view active library ideas" ON idea_library;
CREATE POLICY "Anyone can view active library ideas" ON idea_library FOR SELECT USING (is_active = true);

-- idea_library_selections
DROP POLICY IF EXISTS "Users can view own selections" ON idea_library_selections;
CREATE POLICY "Users can view own selections" ON idea_library_selections FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own selections" ON idea_library_selections;
CREATE POLICY "Users can insert own selections" ON idea_library_selections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own selections" ON idea_library_selections;
CREATE POLICY "Users can delete own selections" ON idea_library_selections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- seeds (PUBLIC SELECT — Ideas Library page loads without auth)
DROP POLICY IF EXISTS "Anyone can read active seeds" ON seeds;
CREATE POLICY "Anyone can read active seeds" ON seeds FOR SELECT USING (status = 'active');
-- Admins can manage seeds
DROP POLICY IF EXISTS "Admins can manage seeds" ON seeds;
CREATE POLICY "Admins can manage seeds" ON seeds FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- seed_grabs
DROP POLICY IF EXISTS "Users can read own grabs" ON seed_grabs;
CREATE POLICY "Users can read own grabs" ON seed_grabs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own grabs" ON seed_grabs;
CREATE POLICY "Users can insert own grabs" ON seed_grabs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- reviews
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
CREATE POLICY "Users can view own reviews" ON reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;
CREATE POLICY "Admins can view all reviews" ON reviews FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- promo_codes (admin only)
DROP POLICY IF EXISTS "Admins can manage promo codes" ON promo_codes;
CREATE POLICY "Admins can manage promo codes" ON promo_codes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ════════════════════════════════════════════════════════════
-- PART 6: GRANTS
-- ════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

-- ════════════════════════════════════════════════════════════
-- PART 7: STORAGE BUCKET
-- ════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('review-photos', 'review-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload review photos"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'review-photos');

-- ════════════════════════════════════════════════════════════
-- PART 8: SEED DATA — Food & Agriculture (5 ideas)
-- ════════════════════════════════════════════════════════════

INSERT INTO seeds (slug, name, sector_id, sector_emoji, sector_label, short_description, problem, solution, target_customer, revenue_model, financial_estimates, why_it_works, risks, best_markets, quick_start_steps, investment_min, investment_max, roi_estimate, break_even_months, max_spots, spots_taken, status)
VALUES
('neighborhood-kitchen', 'مطبخ الحي', 'food', '🍕', 'الأغذية والزراعة',
 'منصة تربط الطباخين المنزليين المحترفين بسكان الحي — وجبات طازجة يومية بأسعار أقل من المطاعم وبجودة البيت.',
 '٧٠٪ من العائلات العربية تعاني من ضيق الوقت للطبخ يومياً. المطاعم مكلفة (٣٠-٦٠ $ للوجبة) وغير صحية. خدمات التوصيل تضيف ١٥-٢٥٪ رسوم.',
 'منصة تربط طباخي الحي بالعائلات المجاورة. الطباخ يعرض قائمة يومية. الجيران يطلبون قبل الساعة ١٠ صباحاً. التوصيل خلال ٢ كم. الوجبة بـ ١٥-٢٥ $. المنصة تأخذ ٢٠٪ عمولة.',
 'عائلات عاملة ٢٥-٤٥ سنة | موظفون يبحثون عن غداء صحي | طلاب جامعات | طباخون يبحثن عن دخل إضافي',
 'عمولة ٢٠٪ من كل طلب | اشتراك أسبوعي ٩٩ $/أسبوع | رسوم تسجيل الطباخ ٢٠٠ $ | إعلانات مميزة ٥٠ $/أسبوع',
 '١٠٠ طلب/يوم في حي واحد = ١٢,٠٠٠ $/شهر | ١٠ أحياء = ١٢٠,٠٠٠ $/شهر | نقطة التعادل الشهر ٦',
 'الطلب موجود: العائلات تحتاج وجبات يومية | العرض موجود: آلاف الطباخين بدون قناة بيع | التوصيل القريب يقلل التكلفة',
 'تراخيص الطعام المنزلي | ضمان النظافة والجودة | المنافسة من تطبيقات التوصيل الكبيرة',
 'السعودية: الرياض وجدة | الإمارات: دبي والشارقة | مصر: القاهرة | تركيا: إسطنبول',
 'الأسبوع ١-٢: سجّل ١٠ طباخين في حي واحد | الأسبوع ٣-٤: أنشئ مجموعة واتساب للطلبات | الأسبوع ٥-٦: حقق أول ٥٠ طلب',
 15000, 40000, 180, 6, 3, 0, 'active'),

('season-box', 'صندوق الموسم', 'food', '🍕', 'الأغذية والزراعة',
 'صناديق اشتراك أسبوعية من المزارع المحلية مباشرة — خضار وفواكه طازجة بسعر الجملة، تدعم المزارعين وتوفر على العائلات.',
 'المزارعون المحليون يبيعون محاصيلهم بأسعار بخسة للوسطاء (يأخذون ٤٠-٦٠٪ هامش). المستهلك يدفع أسعاراً مرتفعة لمنتجات مُخزنة.',
 'اشتراك أسبوعي: العميل يختار حجم الصندوق (صغير/وسط/كبير). كل أسبوع يصله صندوق من خضار وفواكه الموسم مباشرة من مزارع محلية.',
 'عائلات تهتم بالأكل الصحي | أمهات يبحثن عن خضار نظيفة | مهتمون بدعم المزارعين | مزارع صغيرة ومتوسطة',
 'هامش على الصندوق ٣٠٪ | اشتراك أسبوعي: صغير ٤٩ $ / وسط ٧٩ $ / كبير ١١٩ $ | إضافات: بيض، عسل، زيت زيتون',
 '٢٠٠ مشترك أسبوعي = ١٩,٢٠٠ $/شهر هامش | نقطة التعادل الشهر ٥',
 'اتجاه Farm-to-Table عالمي | المزارعون يحتاجون قناة بيع مباشرة | الاشتراك = إيراد متكرر',
 'لوجستيات التبريد والتوصيل | تذبذب المحاصيل | ضمان الجودة | المنافسة من السوبرماركت',
 'السعودية: القصيم والجوف | مصر: الفيوم إلى القاهرة | المغرب: سوس ماسة إلى الدار البيضاء',
 'الأسبوع ١-٢: زُر ٥ مزارع واتفق على أسعار الجملة | الأسبوع ٣-٤: أنشئ صفحة إنستغرام + نموذج طلب | الأسبوع ٥-٦: وصّل أول ٣٠ صندوق',
 10000, 30000, 200, 5, 3, 0, 'active'),

('micro-factory', 'مصنعك الصغير', 'food', '🍕', 'الأغذية والزراعة',
 'مطابخ سحابية مشتركة (Cloud Kitchen) للطباخين الطموحين — استأجر مطبخ مرخص بالساعة وابدأ علامتك التجارية بدون تكلفة تأسيس مطعم.',
 'فتح مطعم يكلف ٣٠٠,٠٠٠ - ١,٠٠٠,٠٠٠ $. ٦٠٪ من المطاعم تفشل في أول ٣ سنوات. المطابخ المنزلية غير مرخصة للبيع التجاري.',
 'مطابخ مجهزة بالكامل ومرخصة تُؤجر بالساعة أو اليوم. الطباخ يحجز المطبخ ويطبخ منتجاته ويبيع عبر تطبيقات التوصيل.',
 'طباخون منزليون يريدون التحول لعلامة تجارية | رواد أعمال غذائية بميزانية محدودة | مطاعم تريد التوسع',
 'إيجار بالساعة ٥٠-١٠٠ $ | إيجار يومي ٣٠٠-٥٠٠ $ | اشتراك شهري ٣,٠٠٠-٨,٠٠٠ $ | عمولة مبيعات ١٠٪',
 'مطبخ واحد مؤجر ١٢ ساعة/يوم = ٢٧,٠٠٠ $/شهر | ٣ مطابخ = ٨١,٠٠٠ $/شهر | نقطة التعادل الشهر ٨',
 'سوق المطابخ السحابية ينمو ١٢٪ سنوياً | حاجز الدخول للمطاعم مرتفع جداً — نحن نخفضه ٩٠٪',
 'تكلفة تأسيس أولية مرتفعة | التراخيص والاشتراطات الصحية | إدارة الجدولة',
 'السعودية: الرياض وجدة | الإمارات: دبي | مصر: القاهرة',
 'الأسبوع ١-٢: ابحث عن مطبخ تجاري للإيجار | الأسبوع ٣-٤: جهّز المطبخ + احصل على التراخيص | الأسبوع ٥-٦: سجّل أول ٥ طباخين',
 50000, 150000, 150, 8, 2, 0, 'active'),

('your-meat', 'ذبيحتك', 'food', '🍕', 'الأغذية والزراعة',
 'منصة لطلب الذبائح واللحوم الطازجة مباشرة من المزارع — اختر الذبيحة، حدد التقطيع، واستلم في نفس اليوم مع شهادة ذبح شرعي.',
 'شراء الذبائح تجربة مرهقة: الذهاب للسوق، التفاوض، عدم معرفة المصدر، الأسعار غير شفافة (الوسطاء يضيفون ٣٠-٥٠٪).',
 'منصة إلكترونية: العميل يختار نوع الذبيحة ويحدد التقطيع ويختار موعد التوصيل ويدفع إلكترونياً. توصيل مبرّد في نفس اليوم.',
 'عائلات سعودية/خليجية | طلبات المناسبات | مطاعم صغيرة | مغتربون يريدون إرسال ذبيحة',
 'هامش على الذبيحة ١٥-٢٠٪ | رسوم التقطيع ٣٠-٥٠ $ | رسوم التوصيل ٣٠-٥٠ $ | خدمة الأضاحي هامش ٢٥٪',
 '١٠ طلبات/يوم = ٦٠,٠٠٠ $/شهر هامش | موسم الأضحى: ٥٠٠ طلب | نقطة التعادل الشهر ٤',
 'سوق اللحوم في السعودية وحدها ٣٠ مليار $ | الشفافية والراحة = قيمة واضحة | موسم الأضحى = ذروة إيرادات مضمونة سنوياً',
 'سلسلة التبريد | التراخيص الصحية والبيطرية | المنافسة من تطبيقات موجودة',
 'السعودية: أكبر سوق | الإمارات: قوة شرائية عالية | الكويت: ثقافة الذبائح | قطر',
 'الأسبوع ١-٢: اتفق مع ٣ مزارع + مسلخ مرخص | الأسبوع ٣-٤: أنشئ موقع بسيط | الأسبوع ٥-٦: نفّذ أول ٢٠ طلب',
 30000, 80000, 250, 4, 3, 0, 'active'),

('your-coffee', 'قهوتك', 'food', '🍕', 'الأغذية والزراعة',
 'اشتراك شهري لقهوة محمصة طازجة من محامص محلية صغيرة — كل شهر تكتشف محمصة جديدة وقصتها، مع بطاقة تذوق وتعليمات التحضير.',
 'سوق القهوة المختصة ينمو ٢٥٪ سنوياً. المحامص الصغيرة تعاني من الوصول للعملاء. القهوة في السوبرماركت قديمة.',
 'اشتراك شهري: كل شهر يصلك كيس قهوة من محمصة محلية مختلفة + بطاقة تعريف + بطاقة تذوق + تعليمات التحضير.',
 'عشاق القهوة المختصة ٢٥-٤٠ سنة | موظفون يشربون ٢-٣ أكواب يومياً | المحامص الصغيرة',
 'اشتراك شهري ٧٩ $ (كيس واحد) | هامش ٤٠٪ | رسوم تسويق من المحامص ٥٠٠ $/شهر | هدايا قهوة للمناسبات',
 '٥٠٠ مشترك = ١٦,٠٠٠ $/شهر هامش | نقطة التعادل الشهر ٥',
 'سوق القهوة المختصة ينمو | نموذج الاشتراك = إيراد متكرر | قصة تسويقية قوية',
 'الاحتفاظ بالمشتركين | ضمان جودة متسقة | المنافسة من اشتراكات قهوة موجودة',
 'السعودية: أكبر سوق قهوة مختصة | الإمارات: قوة شرائية + ثقافة قهوة | الكويت | البحرين',
 'الأسبوع ١-٢: تواصل مع ١٢ محمصة | الأسبوع ٣-٤: صمم الصندوق والبطاقات | الأسبوع ٥-٦: أطلق حملة إنستغرام',
 10000, 25000, 220, 5, 3, 0, 'active')

ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- PART 9: SEED DATA — SaaS (5 ideas)
-- ════════════════════════════════════════════════════════════

INSERT INTO seeds (slug, name, sector_id, sector_emoji, sector_label, short_description, problem, solution, target_customer, revenue_model, financial_estimates, why_it_works, risks, best_markets, quick_start_steps, investment_min, investment_max, roi_estimate, break_even_months, max_spots, spots_taken, status)
VALUES
('hesabi', 'حسابي', 'saas', '💻', 'البرمجيات كخدمة (SaaS)',
 'نظام محاسبة سحابي مبسّط للمشاريع الصغيرة والفريلانسرز العرب — فواتير، مصاريف، ضريبة القيمة المضافة، وتقارير مالية بالعربي وبضغطة زر.',
 '٨٠٪ من المشاريع الصغيرة في المنطقة العربية لا تستخدم نظام محاسبة. الأنظمة الموجودة إنجليزية ومعقدة وغالية.',
 'نظام محاسبة سحابي عربي ١٠٠٪: إنشاء فواتير، تتبع المصاريف، حساب VAT تلقائي، تقارير مالية جاهزة.',
 'أصحاب مشاريع صغيرة (١-١٠ موظفين) | فريلانسرز | متاجر إلكترونية | مقدمو خدمات',
 'خطة مجانية ٥ فواتير/شهر | خطة أساسية ٤٩ $/شهر | خطة احترافية ٩٩ $/شهر | خطة أعمال ١٩٩ $/شهر',
 'ARPU ٦٥ $/شهر | ٥٠٠ مشترك = ٣٢,٥٠٠ $/شهر | نقطة التعادل الشهر ١٠',
 '٤ مليون مشروع صغير في السعودية | VAT إلزامي = حاجة ضرورية | لا منافس عربي بنفس البساطة',
 'المنافسة من حلول موجودة (قيود، دفترة) | إقناع المشاريع بالدفع الشهري | التكامل مع البنوك',
 'السعودية: VAT + رؤية ٢٠٣٠ | الإمارات: VAT + كثافة مشاريع | مصر: أكبر عدد فريلانسرز',
 'الأسبوع ١-٢: ابنِ MVP (فاتورة + VAT + PDF) | الأسبوع ٣-٤: أطلق نسخة مجانية لـ ١٠٠ مستخدم',
 30000, 80000, 200, 10, 2, 0, 'active'),

('wardiya', 'وردية', 'saas', '💻', 'البرمجيات كخدمة (SaaS)',
 'نظام إدارة ورديات وجدولة الموظفين للمطاعم والمقاهي والتجزئة — جدولة ذكية، تبديل ورديات، وحضور بالبصمة من الجوال.',
 'المطاعم والمقاهي تدير ورديات ٢٠-١٠٠ موظف يدوياً. المدير يقضي ٥-٨ ساعات أسبوعياً في الجدولة.',
 'تطبيق جوال + لوحة تحكم: المدير ينشئ الجدول → الموظفون يرون ورديات → تبديل الورديات → الحضور بالبصمة من الجوال.',
 'مطاعم ومقاهي (٥-٥٠ موظف) | محلات تجزئة | صالونات تجميل وعيادات | أي عمل بنظام ورديات',
 'خطة أساسية ٩٩ $/شهر (١٥ موظف) | خطة متوسطة ١٩٩ $/شهر | خطة كبيرة ٣٩٩ $/شهر',
 'متوسط ١٥٠ $/شهر | ٣٠٠ عميل = ٤٥,٠٠٠ $/شهر | نقطة التعادل الشهر ٨',
 '٢٠٠,٠٠٠+ مطعم في السعودية | لا يوجد حل عربي بسيط | توفير ٥-٨ ساعات للمدير أسبوعياً',
 'إقناع أصحاب المطاعم من واتساب | دقة GPS في المباني | المنافسة من حلول عالمية',
 'السعودية: أكبر سوق مطاعم | الإمارات: كثافة مطاعم عالية | مصر | الكويت',
 'الأسبوع ١-٢: ابنِ MVP (جدولة + إشعارات) | الأسبوع ٣-٤: جرّب مع ٥ مطاعم مجاناً',
 25000, 60000, 220, 8, 3, 0, 'active'),

('aqari', 'عقاري', 'saas', '💻', 'البرمجيات كخدمة (SaaS)',
 'نظام إدارة عقارات سحابي لملاك العقارات الصغار — تحصيل إيجارات، عقود إلكترونية، طلبات صيانة، وتقارير مالية تلقائية.',
 'مالك ٥-٥٠ وحدة سكنية يدير كل شيء يدوياً. ٤٠٪ من الإيجارات تتأخر. لا نظام بسيط بأسعار معقولة.',
 'نظام سحابي: المالك يضيف عقاراته ومستأجريه → النظام يرسل تذكيرات إيجار → المستأجر يدفع إلكترونياً.',
 'ملاك عقارات أفراد (٥-٥٠ وحدة) | مكاتب عقارية صغيرة | ملاك شقق مفروشة',
 'خطة فردية ٧٩ $/شهر | خطة مالك ١٤٩ $/شهر | خطة مكتب ٢٩٩ $/شهر | عمولة تحصيل ١٪',
 'متوسط ١٢٠ $/شهر | ٤٠٠ عميل = ٤٨,٠٠٠ $/شهر | نقطة التعادل الشهر ٧',
 '٣ مليون وحدة سكنية مؤجرة في السعودية | التحول الرقمي الإلزامي | المالك الصغير مهمل من الحلول الحالية',
 'التكامل مع منصة إيجار | بوابات الدفع | المنافسة (ديار، مُلاك) | إقناع الملاك كبار السن',
 'السعودية: أكبر سوق + إلزام رقمي | الإمارات: سوق إيجارات نشط | مصر | الأردن',
 'الأسبوع ١-٢: ابنِ MVP (إضافة عقارات + مستأجرين + تذكيرات) | الأسبوع ٣-٤: جرّب مع ١٠ ملاك',
 40000, 100000, 250, 7, 2, 0, 'active'),

('taqyeemak', 'تقييمك', 'saas', '💻', 'البرمجيات كخدمة (SaaS)',
 'منصة إدارة تقييمات ومراجعات العملاء للمشاريع المحلية — اجمع تقييمات، رد على الشكاوى، وحسّن سمعتك على Google من مكان واحد.',
 '٩٣٪ من المستهلكين يقرأون التقييمات قبل الشراء. المشاريع الصغيرة لا تدير سمعتها الرقمية.',
 'منصة واحدة تجمع كل تقييماتك → ترسل رسائل تلقائية للعملاء → تحوّل الراضين لـ Google → تحوّل غير الراضين لنموذج خاص.',
 'مطاعم ومقاهي | عيادات | صالونات تجميل | ورش سيارات | أي مشروع محلي',
 'خطة أساسية ٩٩ $/شهر | خطة نمو ١٩٩ $/شهر | خطة سلاسل ٤٩٩ $/شهر | رد تلقائي بالذكاء الاصطناعي ٧٩ $/شهر',
 'متوسط ١٥٠ $/شهر | ٣٠٠ عميل = ٤٥,٠٠٠ $/شهر | نقطة التعادل الشهر ٧',
 'كل مشروع محلي يحتاج تقييمات | النتائج ملموسة وسريعة | سهل الإثبات "قبل وبعد"',
 'سياسات Google | المنافسة من Birdeye, Podium | تغيير APIs المنصات',
 'السعودية: ثقافة التقييمات قوية | الإمارات: منافسة عالية | الكويت: مجتمع صغير',
 'الأسبوع ١-٢: ابنِ MVP (رابط تقييم + توجيه ذكي) | الأسبوع ٣-٤: جرّب مع ١٠ مطاعم مجاناً',
 20000, 50000, 240, 7, 3, 0, 'active'),

('motabe', 'متابع', 'saas', '💻', 'البرمجيات كخدمة (SaaS)',
 'نظام CRM عربي مبسّط للمبيعات — تابع عملاءك المحتملين من أول تواصل حتى إغلاق الصفقة، مع تكامل واتساب وتذكيرات ذكية.',
 'فرق المبيعات تتابع العملاء عبر واتساب + إكسل. ٣٠٪ من العملاء المحتملين يضيعون بسبب النسيان.',
 'CRM عربي مبني حول واتساب: كل محادثة تُسجل → العميل يتحرك في مراحل البيع → تذكيرات تلقائية → تقارير أداء الفريق.',
 'شركات مبيعات صغيرة ومتوسطة | وكالات عقارية | شركات تأمين | مراكز تدريب',
 'خطة فردية ٦٩ $/شهر/مستخدم | خطة فريق ٤٩ $/شهر/مستخدم | خطة مؤسسة ٣٩ $/شهر/مستخدم',
 'متوسط ٤٠٠ $/شهر لكل شركة | ٢٠٠ شركة = ٨٠,٠٠٠ $/شهر | نقطة التعادل الشهر ٩',
 'واتساب هو أداة البيع #١ في المنطقة | البساطة: لا تحتاج تدريب أسابيع | النتائج فورية',
 'تكامل واتساب Business API (تكلفة + تعقيد) | المنافسة من CRMs عالمية | خصوصية البيانات',
 'السعودية: أكبر سوق + واتساب مسيطر | الإمارات | مصر | تركيا',
 'الأسبوع ١-٢: ابنِ MVP (إضافة عملاء + مراحل + تذكيرات) | الأسبوع ٣-٤: جرّب مع ٥ شركات مجاناً',
 35000, 90000, 230, 9, 2, 0, 'active')

ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- PART 10: SECURITY — Enable HIBP password protection
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'config' AND column_name = 'password_hibp_enabled'
  ) THEN
    UPDATE auth.config SET password_hibp_enabled = true;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- DONE — Schema, RLS, functions, and seed data applied.
-- Run the individual sector seed migrations for:
--   ecommerce (20260603145042), fintech (20260603150156), edtech (20260603151549)
-- ════════════════════════════════════════════════════════════
