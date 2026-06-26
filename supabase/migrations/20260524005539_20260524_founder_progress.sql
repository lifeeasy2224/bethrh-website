/*
  # رحلة الريادي — جدول founder_progress

  1. جدول جديد: founder_progress
     - id: معرف فريد
     - user_id: مرتبط بالمستخدم
     - current_stage: المرحلة الحالية (seed, sprout, root, stem, pitch, branch, fruit)
     - stage_1_done: أكمل مرحلة البذرة (حفظ فكرة)
     - stage_2_score: نقاط مرحلة الإنبات (0-100)
     - stage_3_tasks_done: عدد مهام التجذر المكتملة
     - stage_4_first_customer: هل حصل على أول عميل
     - badges: مصفوفة الشارات المكتسبة
     - updated_at: آخر تحديث

  2. الأمان:
     - RLS مفعّل
     - المستخدم يقرأ ويعدل بياناته فقط
*/

CREATE TABLE IF NOT EXISTS founder_progress (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage    text NOT NULL DEFAULT 'seed',
  stage_1_done     boolean NOT NULL DEFAULT false,
  stage_2_score    integer NOT NULL DEFAULT 0,
  stage_3_tasks_done integer NOT NULL DEFAULT 0,
  stage_4_first_customer boolean NOT NULL DEFAULT false,
  badges           text[] NOT NULL DEFAULT '{}',
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE founder_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON founder_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON founder_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON founder_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
