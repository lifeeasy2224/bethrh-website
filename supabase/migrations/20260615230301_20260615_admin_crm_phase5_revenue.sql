-- Revenue events table
CREATE TABLE IF NOT EXISTS revenue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('subscription_created','subscription_cancelled','subscription_updated','payment_received','payment_failed')),
  plan text,
  amount numeric,
  currency text NOT NULL DEFAULT 'usd',
  stripe_event_id text UNIQUE,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_events_user ON revenue_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_events_type ON revenue_events(event_type, created_at DESC);

ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_revenue_events" ON revenue_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_select_revenue_events" ON revenue_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_revenue_events" ON revenue_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- MRR snapshots table
CREATE TABLE IF NOT EXISTS mrr_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  total_mrr numeric NOT NULL DEFAULT 0,
  total_customers integer NOT NULL DEFAULT 0,
  new_mrr numeric NOT NULL DEFAULT 0,
  churned_mrr numeric NOT NULL DEFAULT 0,
  builder_count integer NOT NULL DEFAULT 0,
  launch_count integer NOT NULL DEFAULT 0,
  pro_count integer NOT NULL DEFAULT 0,
  growth_count integer NOT NULL DEFAULT 0,
  family_count integer NOT NULL DEFAULT 0,
  accelerator_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mrr_snapshots_month ON mrr_snapshots(month DESC);

ALTER TABLE mrr_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_mrr_snapshots" ON mrr_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_select_mrr_snapshots" ON mrr_snapshots
  FOR SELECT TO authenticated USING (true);

-- Add amount and cancelled_at to subscriptions for easier queries
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Helper function: increment total revenue on a user profile
CREATE OR REPLACE FUNCTION public.increment_total_revenue(target_user_id uuid, inc_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET total_revenue = COALESCE(total_revenue, 0) + inc_amount
  WHERE user_id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_total_revenue(uuid, numeric) FROM anon, authenticated;

-- Seed current MRR snapshot from live data
INSERT INTO mrr_snapshots (month, total_mrr, total_customers, new_mrr, churned_mrr, builder_count, launch_count, pro_count, growth_count, family_count, accelerator_count)
SELECT
  date_trunc('month', now())::date AS month,
  COALESCE(SUM(
    CASE plan
      WHEN 'builder'     THEN 19
      WHEN 'launch'      THEN 29
      WHEN 'family'      THEN 49
      WHEN 'pro'         THEN 49
      WHEN 'growth'      THEN 79
      WHEN 'accelerator' THEN 149
      ELSE 0
    END
  ), 0) AS total_mrr,
  COUNT(*) AS total_customers,
  0 AS new_mrr,
  0 AS churned_mrr,
  COUNT(*) FILTER (WHERE plan = 'builder')     AS builder_count,
  COUNT(*) FILTER (WHERE plan = 'launch')      AS launch_count,
  COUNT(*) FILTER (WHERE plan = 'pro')         AS pro_count,
  COUNT(*) FILTER (WHERE plan = 'growth')      AS growth_count,
  COUNT(*) FILTER (WHERE plan = 'family')      AS family_count,
  COUNT(*) FILTER (WHERE plan = 'accelerator') AS accelerator_count
FROM public.profiles
WHERE plan NOT IN ('free', '') AND plan IS NOT NULL
ON CONFLICT (month) DO UPDATE
  SET total_mrr       = EXCLUDED.total_mrr,
      total_customers = EXCLUDED.total_customers,
      builder_count   = EXCLUDED.builder_count,
      launch_count    = EXCLUDED.launch_count,
      pro_count       = EXCLUDED.pro_count,
      growth_count    = EXCLUDED.growth_count,
      family_count    = EXCLUDED.family_count,
      accelerator_count = EXCLUDED.accelerator_count;
