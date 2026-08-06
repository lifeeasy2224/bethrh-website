-- Secure the 5 event-driven email triggers: _call_edge_function now sends the
-- Vault-backed bearer token so the (now --no-verify-jwt) trigger functions can
-- authenticate it. Reuses the SAME `cron_bearer_token` Vault secret +
-- CRON_BEARER_TOKEN edge-function secret already used by the cron jobs.
--
-- IMPORTANT: the EXCEPTION handler is preserved — a failed edge-function POST
-- must NEVER break the triggering transaction (signup, message insert, etc.).
CREATE OR REPLACE FUNCTION public._call_edge_function(fn_name text, payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  bearer_token text;
BEGIN
  SELECT decrypted_secret INTO bearer_token
  FROM vault.decrypted_secrets
  WHERE name = 'cron_bearer_token'
  LIMIT 1;

  PERFORM net.http_post(
    url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/' || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || bearer_token
    ),
    body    := payload
  );
EXCEPTION WHEN OTHERS THEN
  NULL; -- Never break the triggering transaction
END;
$$;
