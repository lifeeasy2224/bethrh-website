-- P2.1 enabler: create the enriched_users view.
--
-- Both the CRM segment UI (AdminCampaignNew smart-segment preview) and, now,
-- send-campaign's server-side rule evaluation query `enriched_users` — but the
-- relation never existed in any schema (admin-db even lists it in ALLOWED_TABLES).
-- This defines it to match the EnrichedUser interface in crmSegmentEngine.ts:
-- profiles joined with per-user user_ideas aggregates (ideas_count, best iq_score).
CREATE OR REPLACE VIEW public.enriched_users AS
SELECT
  p.user_id,
  p.full_name,
  p.role,
  p.tier,
  COALESCE(p.lead_score, 0)   AS lead_score,
  p.lifecycle_stage,
  p.user_status,
  p.last_login_at,
  p.created_at,
  COALESCE(p.login_count, 0)  AS login_count,
  COALESCE(i.max_iq, 0)       AS iq_score,
  COALESCE(i.cnt, 0)::int     AS ideas_count
FROM public.profiles p
LEFT JOIN (
  SELECT user_id, count(*) AS cnt, max(iq_score) AS max_iq
  FROM public.user_ideas
  GROUP BY user_id
) i ON i.user_id = p.user_id;

-- Admin-only surface: reached via the admin-db edge function and send-campaign,
-- both using the service_role key. Deliberately NOT granted to anon/authenticated
-- (would expose every user's CRM data through PostgREST).
GRANT SELECT ON public.enriched_users TO service_role;
