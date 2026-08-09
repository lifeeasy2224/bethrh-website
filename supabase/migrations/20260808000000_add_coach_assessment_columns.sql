-- P0-B Phase 2: AI-Coach readiness assessment (the 15-pt component of iq_score).
-- Written by the assess-idea edge function; read by recomputeIqScore (lib/iqScore.ts).
ALTER TABLE public.user_ideas
  ADD COLUMN IF NOT EXISTS coach_assessment INTEGER,
  ADD COLUMN IF NOT EXISTS coach_assessment_note TEXT,
  ADD COLUMN IF NOT EXISTS coach_assessment_at TIMESTAMPTZ;
