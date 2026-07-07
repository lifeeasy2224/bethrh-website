-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Weekly digest function: calls the send-email edge function for every active user
CREATE OR REPLACE FUNCTION send_weekly_digests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  supabase_url text;
  service_key text;
  week_date text;
  payload text;
BEGIN
  supabase_url := current_setting('app.supabase_url', true);
  service_key  := current_setting('app.service_role_key', true);
  week_date    := to_char(now(), 'Mon DD, YYYY');

  FOR rec IN
    SELECT
      p.user_id,
      p.full_name,
      p.current_streak,
      p.stress_test_completed,
      a.email,
      COALESCE(ui.iq_score, 0) AS iq_score,
      COALESCE(jt.done, 0) AS journey_done
    FROM profiles p
    JOIN auth.users a ON a.id = p.user_id
    LEFT JOIN (
      SELECT user_id, MAX(iq_score) AS iq_score
      FROM user_ideas
      GROUP BY user_id
    ) ui ON ui.user_id = p.user_id
    LEFT JOIN (
      SELECT ui2.user_id, COUNT(*) AS done
      FROM journey_tasks jt2
      JOIN user_ideas ui2 ON ui2.id = jt2.user_idea_id
      WHERE jt2.is_completed = true
      GROUP BY ui2.user_id
    ) jt ON jt.user_id = p.user_id
    WHERE p.role IN ('founder', 'investor')
  LOOP
    payload := json_build_object(
      'to',            rec.email,
      'template_name', 'weekly-digest',
      'variables', json_build_object(
        'name',             COALESCE(rec.full_name, 'there'),
        'week_date',        week_date,
        'iq_score',         rec.iq_score::text,
        'streak',           rec.current_streak::text,
        'journey_pct',      LEAST(ROUND(rec.journey_done * 100.0 / 48), 100)::text,
        'weekly_tasks_html','<p style="color:#6B7280;font-size:14px;">Log in to see your current week tasks.</p>',
        'dashboard_url',    supabase_url || '/founder/dashboard',
        'unsubscribe_url',  supabase_url || '/settings'
      )
    )::text;

    PERFORM net.http_post(
      url     := supabase_url || '/functions/v1/send-email',
      headers := json_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || service_key
      )::jsonb,
      body    := payload::jsonb
    );
  END LOOP;
END;
$$;

-- Schedule every Monday at 9 AM UTC
SELECT cron.schedule(
  'weekly-digest-monday-9am',
  '0 9 * * 1',
  'SELECT send_weekly_digests()'
);
