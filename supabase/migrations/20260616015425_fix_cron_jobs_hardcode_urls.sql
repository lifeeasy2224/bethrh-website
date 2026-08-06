-- Fix process-automations-hourly: was using current_setting() which returns null
SELECT cron.unschedule('process-automations-hourly');

SELECT cron.schedule(
  'process-automations-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/process-automations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Fix snapshot-mrr-monthly: was reading from non-existent app_settings table
SELECT cron.unschedule('snapshot-mrr-monthly');

SELECT cron.schedule(
  'snapshot-mrr-monthly',
  '0 0 1 * *',
  $$
  SELECT net.http_post(
    url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/snapshot-mrr',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);
