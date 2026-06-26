/*
  # نظام تقويم الفكرة — جدول idea_scores

  1. جدول جديد: idea_scores
     - id: معرف فريد
     - idea_id: مرتبط بالفكرة
     - user_id: مرتبط بالمستخدم
     - total_score: النتيجة الإجمالية من 100
     - value_score: نقاط القيمة المقدمة (0-20)
     - market_score: نقاط حجم السوق (0-20)
     - validation_score: نقاط التحقق الميداني (0-20)
     - feasibility_score: نقاط قابلية التنفيذ (0-20)
     - pitch_score: نقاط جودة العرض (0-10)
     - journey_score: نقاط المشوار المكتمل (0-10)
     - benchmark_sector: القطاع المقارن
     - benchmark_country: البلد المقارن
     - benchmark_avg: متوسط المعيار المرجعي
     - recommendations: توصيات النظام (JSON)
     - gpt_summary: ملخص GPT
     - version: رقم الإصدار (لإعادة التقييم)
     - created_at: وقت الإنشاء

  2. الأمان:
     - RLS مفعّل
     - المستخدم يقرأ ويدرج بياناته فقط
*/

CREATE TABLE IF NOT EXISTS idea_scores (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id          uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score      integer NOT NULL DEFAULT 0,
  value_score      integer NOT NULL DEFAULT 0,
  market_score     integer NOT NULL DEFAULT 0,
  validation_score integer NOT NULL DEFAULT 0,
  feasibility_score integer NOT NULL DEFAULT 0,
  pitch_score      integer NOT NULL DEFAULT 0,
  journey_score    integer NOT NULL DEFAULT 0,
  benchmark_sector text DEFAULT '',
  benchmark_country text DEFAULT '',
  benchmark_avg    integer NOT NULL DEFAULT 0,
  recommendations  jsonb NOT NULL DEFAULT '[]',
  gpt_summary      text DEFAULT '',
  version          integer NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idea_scores_idea_id_idx ON idea_scores(idea_id);
CREATE INDEX IF NOT EXISTS idea_scores_user_id_idx ON idea_scores(user_id);

ALTER TABLE idea_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scores"
  ON idea_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON idea_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
