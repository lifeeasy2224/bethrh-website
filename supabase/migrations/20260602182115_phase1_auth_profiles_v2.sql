/*
  # Phase 1 Auth Profiles Migration (idempotent)

  Creates profiles, founder_profiles, investor_profiles tables
  with RLS and an auto-create trigger. Skips if policies already exist.
*/

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text NOT NULL DEFAULT '',
  role          text NOT NULL DEFAULT 'founder' CHECK (role IN ('founder', 'investor')),
  plan          text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'builder', 'launch', 'family')),
  onboarding_completed boolean NOT NULL DEFAULT false,
  avatar_url    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can read own profile') THEN
    CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'founder')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ─────────────────────────────────────────
-- FOUNDER PROFILES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS founder_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_type      text DEFAULT '',
  sectors_of_interest text[] DEFAULT '{}',
  has_idea          boolean DEFAULT false,
  city              text DEFAULT '',
  bio               text DEFAULT '',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE founder_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='founder_profiles' AND policyname='Founders can read own founder profile') THEN
    CREATE POLICY "Founders can read own founder profile" ON founder_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='founder_profiles' AND policyname='Founders can insert own founder profile') THEN
    CREATE POLICY "Founders can insert own founder profile" ON founder_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='founder_profiles' AND policyname='Founders can update own founder profile') THEN
    CREATE POLICY "Founders can update own founder profile" ON founder_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────
-- INVESTOR PROFILES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investor_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_type     text DEFAULT '',
  sectors_of_interest text[] DEFAULT '{}',
  check_size        text DEFAULT '',
  is_verified       boolean DEFAULT false,
  city              text DEFAULT '',
  bio               text DEFAULT '',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='investor_profiles' AND policyname='Investors can read own investor profile') THEN
    CREATE POLICY "Investors can read own investor profile" ON investor_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='investor_profiles' AND policyname='Investors can insert own investor profile') THEN
    CREATE POLICY "Investors can insert own investor profile" ON investor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='investor_profiles' AND policyname='Investors can update own investor profile') THEN
    CREATE POLICY "Investors can update own investor profile" ON investor_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
