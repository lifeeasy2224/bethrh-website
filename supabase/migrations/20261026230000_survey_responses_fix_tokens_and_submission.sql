-- One survey row per user, so send-survey-email's token lookup/insert is reliable.
alter table public.survey_responses add constraint survey_responses_user_id_key unique (user_id);

-- Close the open policies: anonymous visitors could insert rows and update ANY row.
drop policy if exists "public insert" on public.survey_responses;
drop policy if exists "token update" on public.survey_responses;

-- Submissions go through this function only: it updates the single row that
-- matches the emailed token, once, and reports back if the token is unknown.
create or replace function public.submit_survey(
  p_token text,
  p_q1 text[],
  p_q2 text[],
  p_q3 boolean,
  p_q3_details text,
  p_q4 text,
  p_q5 text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_submitted timestamptz;
begin
  if p_token is null or length(p_token) < 10 then
    return 'not_found';
  end if;
  select id, submitted_at into v_id, v_submitted from public.survey_responses where token = p_token;
  if v_id is null then
    return 'not_found';
  end if;
  if v_submitted is not null then
    return 'already';
  end if;
  update public.survey_responses set
    q1_workspace = p_q1[1:20],
    q2_factors   = p_q2[1:20],
    q3_lost_opp  = p_q3,
    q3_details   = left(nullif(trim(p_q3_details), ''), 2000),
    q4_price     = left(p_q4, 100),
    q5_feedback  = left(nullif(trim(p_q5), ''), 4000),
    submitted_at = now()
  where id = v_id;
  return 'ok';
end;
$$;

revoke all on function public.submit_survey(text, text[], text[], boolean, text, text, text) from public;
grant execute on function public.submit_survey(text, text[], text[], boolean, text, text, text) to anon, authenticated;
