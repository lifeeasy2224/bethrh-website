-- §10 CRM — secure the 4 cron jobs with a Vault-backed bearer token.
--
-- The target edge functions are now deployed with --no-verify-jwt (so pg_cron
-- can reach them without a Supabase JWT) and instead enforce a shared secret
-- (checkCronAuth). pg_cron reads that secret from Vault (`cron_bearer_token`,
-- created out-of-band via vault.create_secret — NOT stored in this migration)
-- and passes it as `Authorization: Bearer <token>`. The matching value is set
-- as the CRON_BEARER_TOKEN edge-function secret.
--
-- Corrections vs the original spec: pg_net's net.http_post (named args) is used,
-- not http_post(); and the Vault value is read via the vault.decrypted_secrets
-- view (there is no vault.decrypted_secret() function).

SELECT cron.schedule(
  'process-automations-hourly',
  '0 * * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/process-automations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_bearer_token')
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
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_bearer_token')
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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_bearer_token')
    ),
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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_bearer_token')
    ),
    body    := '{"trigger":"cron"}'::jsonb
  );
  $job$
);
