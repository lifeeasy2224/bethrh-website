-- Survey responses table for بذرة co-working space validation
create table if not exists public.survey_responses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  token        text unique not null,          -- anonymous link token
  q1_workspace text[],                        -- current workspace options
  q2_factors   text[],                        -- ideal workspace factors (ranked)
  q3_lost_opp  boolean,                       -- lost opportunity yes/no
  q3_details   text,                          -- optional free text
  q4_price     text,                          -- acceptable monthly price range
  q5_feedback  text,                          -- open feedback
  submitted_at timestamptz,
  created_at   timestamptz default now()
);

-- RLS: users can only insert/update their own row via token (no auth required)
alter table public.survey_responses enable row level security;

create policy "Anyone can insert via token"
  on public.survey_responses for insert
  with check (true);

create policy "Update own row via token"
  on public.survey_responses for update
  using (true);

create policy "Admins can read all"
  on public.survey_responses for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
    )
  );
