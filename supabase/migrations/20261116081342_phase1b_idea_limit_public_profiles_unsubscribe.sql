-- Phase 1b
--   A. Idea limit enforced in the database (the UI check was the only guard).
--   B. profiles is no longer readable by every signed-in user. Other people's names
--      and avatars come from public_profiles (safe columns only).
--   C. Unsubscribe by token as SECURITY DEFINER RPCs. The page used an anonymous
--      UPDATE on profiles, which RLS rejects, so every real link showed "invalid".

-- ── A. Idea limit ────────────────────────────────────────────────────────────
-- free 1, builder 3, family 3, launch 5; pro / growth / accelerator unlimited.
-- NULL means unlimited. An unknown plan name is treated as free.
create or replace function public.idea_limit_for_plan(p_plan text)
returns int
language sql
immutable
set search_path = public
as $$
  select case lower(coalesce(p_plan, 'free'))
    when 'free'        then 1
    when 'builder'     then 3
    when 'family'      then 3
    when 'launch'      then 5
    when 'pro'         then null
    when 'growth'      then null
    when 'accelerator' then null
    else 1
  end
$$;

-- Runs as the caller (not SECURITY DEFINER) so the same convention as
-- user_ideas_protect_server_columns holds: service_role / postgres skip it.
-- The caller can read their own profile row and their own ideas under RLS.
create or replace function public.enforce_idea_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_plan  text;
  v_limit int;
  v_count int;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  -- Two simultaneous inserts must not both pass the count.
  perform pg_advisory_xact_lock(hashtextextended('idea_limit:' || new.user_id::text, 0));

  select plan into v_plan from public.profiles where user_id = new.user_id;
  v_limit := public.idea_limit_for_plan(v_plan);
  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count from public.user_ideas where user_id = new.user_id;
  if v_count >= v_limit then
    raise exception using
      errcode = 'P0001',
      hint    = 'idea_limit',
      detail  = format('plan=%s limit=%s', coalesce(v_plan, 'free'), v_limit),
      message = case
        when coalesce(v_plan, 'free') = 'free'
          then 'وصلت إلى الحد الأقصى للأفكار في الخطة المجانية (فكرة واحدة). رقِّ خطتك لإضافة المزيد من الأفكار.'
        else format('وصلت إلى الحد الأقصى للأفكار في خطتك (%s أفكار). رقِّ خطتك لإضافة المزيد.', v_limit)
      end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_idea_limit on public.user_ideas;
create trigger trg_enforce_idea_limit
  before insert on public.user_ideas
  for each row execute function public.enforce_idea_limit();

-- ── B. Narrow profiles ───────────────────────────────────────────────────────
-- "Authenticated users can view public profiles" used (true): every signed-in user
-- could read every other user's stripe_customer_id, unsubscribe_token, plan,
-- revenue and lead score. Own-row read stays ("Users can read own profile").
-- Cross-user reads (names in groups / chats / connections) go through this view.
create or replace view public.public_profiles
  with (security_invoker = false)
as
  select user_id, id, full_name, avatar_url, role
  from public.profiles;

revoke all on public.public_profiles from public, anon;
grant select on public.public_profiles to authenticated;

drop policy if exists "Authenticated users can view public profiles" on public.profiles;

-- anon never had a profiles policy; remove the table grants too (defence in depth).
revoke all on public.profiles from anon;

-- ── C. Unsubscribe by token ──────────────────────────────────────────────────
create or replace function public.unsubscribe_by_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if p_token is null or length(p_token) < 16 then
    return false;
  end if;
  update public.profiles
     set email_digest_enabled = false,
         inspiration_enabled  = false
   where unsubscribe_token = p_token
   returning user_id into v_user;
  return v_user is not null;
end;
$$;

create or replace function public.resubscribe_by_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if p_token is null or length(p_token) < 16 then
    return false;
  end if;
  update public.profiles
     set email_digest_enabled = true,
         inspiration_enabled  = true
   where unsubscribe_token = p_token
   returning user_id into v_user;
  return v_user is not null;
end;
$$;

revoke all on function public.unsubscribe_by_token(text)  from public;
revoke all on function public.resubscribe_by_token(text)  from public;
grant execute on function public.unsubscribe_by_token(text)  to anon, authenticated;
grant execute on function public.resubscribe_by_token(text)  to anon, authenticated;
