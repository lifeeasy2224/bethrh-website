-- process-automations is retired. It ran hourly but sent nothing: every automation row has
-- no template, and it was branded "IdeaVault". The tables (marketing_automations,
-- automation_logs, milestone_logs) and their data are kept.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'process-automations-hourly') then
    perform cron.unschedule('process-automations-hourly');
  end if;
end;
$$;
