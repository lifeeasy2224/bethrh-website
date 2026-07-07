-- Per-caller usage log backing the AI rate limiter. Each AI edge function
-- (ai-coach, swot-analysis, idea-stress-test) writes one row per request and
-- counts recent rows to enforce hourly/daily caps.
--
-- `subject` is the caller identity: a user id for authenticated features, or
-- "ip:<addr>" for the public /validate tool (idea-stress-test), which stays
-- anonymous. Only the edge functions (service role) touch this table; RLS is
-- enabled with no policy, so all client (anon/authenticated) access is denied.

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject    text NOT NULL,
  fn         text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_subject_time_idx
  ON public.ai_usage (subject, created_at DESC);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: service role bypasses RLS; everyone else is denied.
