/*
  # Canvas Draft + Idea Validation Gate

  ## Summary
  Adds two capabilities:
  1. Persistent canvas drafts — stores all 9 Business Model Canvas boxes + financial data per idea
  2. Idea validation gate — records whether an idea passed the AI pre-screening (3-question interview)

  ## New Tables
  ### canvas_drafts
  - `id` (uuid, pk)
  - `idea_id` (uuid, fk → ideas.id, unique — one draft per idea)
  - `user_id` (uuid, fk → auth.users)
  - `value_proposition` (text) — عرض القيمة
  - `customer_segments` (text) — شرائح العملاء
  - `channels` (text) — قنوات الوصول
  - `customer_relationships` (text) — علاقات العملاء
  - `revenue_streams` (text) — مصادر الإيراد
  - `key_resources` (text) — الموارد الرئيسية
  - `key_activities` (text) — الأنشطة الرئيسية
  - `key_partners` (text) — الشراكات الرئيسية
  - `cost_structure` (text) — هيكل التكاليف
  - `financial_items` (jsonb) — array of {label, amount, type:'cost'|'revenue'}
  - `ai_score` (integer) — AI-assigned canvas quality score 0–100
  - `is_locked` (boolean) — true once all gates passed
  - `updated_at` (timestamptz)

  ### idea_validations
  - `id` (uuid, pk)
  - `idea_id` (uuid, fk → ideas.id, unique — one validation per idea)
  - `user_id` (uuid, fk → auth.users)
  - `q1_problem` (text) — ما المشكلة التي يحلها؟
  - `q2_audience` (text) — من هو جمهورك المستهدف؟
  - `q3_evidence` (text) — ما دليلك على وجود الطلب؟
  - `ai_feedback` (text) — AI response text
  - `result` (text) — 'passed' | 'failed' | 'pending'
  - `score` (integer) — 0-100 AI score
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Users can only read/write their own rows
*/

-- ─── canvas_drafts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS canvas_drafts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id               uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_proposition     text NOT NULL DEFAULT '',
  customer_segments     text NOT NULL DEFAULT '',
  channels              text NOT NULL DEFAULT '',
  customer_relationships text NOT NULL DEFAULT '',
  revenue_streams       text NOT NULL DEFAULT '',
  key_resources         text NOT NULL DEFAULT '',
  key_activities        text NOT NULL DEFAULT '',
  key_partners          text NOT NULL DEFAULT '',
  cost_structure        text NOT NULL DEFAULT '',
  financial_items       jsonb NOT NULL DEFAULT '[]',
  ai_score              integer DEFAULT 0,
  is_locked             boolean NOT NULL DEFAULT false,
  updated_at            timestamptz DEFAULT now(),
  UNIQUE(idea_id)
);

ALTER TABLE canvas_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own canvas drafts"
  ON canvas_drafts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own canvas drafts"
  ON canvas_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own canvas drafts"
  ON canvas_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own canvas drafts"
  ON canvas_drafts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── idea_validations ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS idea_validations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id      uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  q1_problem   text NOT NULL DEFAULT '',
  q2_audience  text NOT NULL DEFAULT '',
  q3_evidence  text NOT NULL DEFAULT '',
  ai_feedback  text NOT NULL DEFAULT '',
  result       text NOT NULL DEFAULT 'pending' CHECK (result IN ('passed', 'failed', 'pending')),
  score        integer NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(idea_id)
);

ALTER TABLE idea_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own idea validations"
  ON idea_validations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own idea validations"
  ON idea_validations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own idea validations"
  ON idea_validations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own idea validations"
  ON idea_validations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- indexes
CREATE INDEX IF NOT EXISTS canvas_drafts_idea_id_idx ON canvas_drafts(idea_id);
CREATE INDEX IF NOT EXISTS canvas_drafts_user_id_idx ON canvas_drafts(user_id);
CREATE INDEX IF NOT EXISTS idea_validations_idea_id_idx ON idea_validations(idea_id);
CREATE INDEX IF NOT EXISTS idea_validations_user_id_idx ON idea_validations(user_id);
