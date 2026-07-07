-- Schedule monthly MRR snapshot on 1st of each month at midnight UTC
SELECT cron.schedule(
  'snapshot-mrr-monthly',
  '0 0 1 * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM app_settings WHERE key = 'supabase_functions_url' LIMIT 1) || '/snapshot-mrr',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM app_settings WHERE key = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
