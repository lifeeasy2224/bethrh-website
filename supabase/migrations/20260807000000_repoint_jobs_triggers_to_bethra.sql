-- P1.1 — Repoint all background jobs + email triggers from the WRONG project ref
-- (lspymfdrtuducsblgiva — copy-pasted from the source project) to Bethra's own
-- project (czreiquyyepzqfimrycl).
--
-- Why a NEW migration: the two prior migrations that baked in the wrong host
-- (20260615162704, 20260616015425) were ALREADY applied, so editing them does
-- not change live objects. This migration mutates the live trigger helper and
-- the live cron jobs directly. cron.job cannot be UPDATEd directly (table owned
-- by the extension), so jobs are re-created via cron.schedule (upsert by name).
--
-- NOTE (separate blocker, NOT fixed here): every target edge function is
-- verify_jwt=true, and these calls carry no valid JWT (unset service_role_key
-- GUC / no Authorization header). Repointing the URL is necessary but not
-- sufficient — the functions must be redeployed --no-verify-jwt or given a
-- Vault-based bearer before they will actually run. Tracked as P1.1b.

-- 1. The 5 event-driven email triggers (welcome, investor-match,
--    investor-interested, new-message, validation-complete) all route through
--    this helper. CREATE OR REPLACE updates it live.
CREATE OR REPLACE FUNCTION _call_edge_function(fn_name text, payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/' || fn_name,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := payload
  );
EXCEPTION WHEN OTHERS THEN
  NULL; -- Never break the triggering transaction
END;
$$;

-- 2. Repoint the 4 live cron jobs (schedules/headers/bodies unchanged; only host).
SELECT cron.schedule(
  'process-automations-hourly',
  '0 * * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/process-automations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $job$
);

SELECT cron.schedule(
  'snapshot-mrr-monthly',
  '0 0 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/snapshot-mrr',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $job$
);

SELECT cron.schedule(
  'send-weekly-digest',
  '0 9 * * 1',
  $job$
    SELECT net.http_post(
      url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/send-weekly-digest',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := '{"trigger":"cron"}'::jsonb
    );
  $job$
);

SELECT cron.schedule(
  'send-weekly-inspiration',
  '0 10 * * 3',
  $job$
    SELECT net.http_post(
      url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/send-weekly-inspiration',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := '{"trigger":"cron"}'::jsonb
    );
  $job$
);
