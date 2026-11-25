/*
  # Founder welcome series: marketing consent + 3-email series

  Founders can tick an unchecked box on /signup to get founder tips, Bethra news
  and offers. Ticking it enrols them (once their email is confirmed) in a 3-email
  series at day 1, 3 and 6 after confirmation. Everything here is server-written.

  Consent
    profiles.marketing_opt_in (default false), marketing_opt_in_at,
    marketing_opt_in_source, marketing_consent_text_version -> marketing_consent_texts.
    handle_new_user sets them from signup metadata, only for founders, only when the
    box value is exactly 'true' and the consent-text version exists. Clients cannot
    change them (profiles_lock_privileged_columns) and a client INSERT cannot set
    them either (profiles_guard_insert). Existing users are never opted in: the new
    column defaults to false and there is no backfill.

  Series
    marketing_series_enrollments: one row per person (PK user_id) = once per person.
    marketing_series_sends: one row per (person, step) = at most one send per step.
    Enrolment happens when the email is confirmed (double opt-in), via triggers on
    auth.users that swallow every error, so a problem here can never block signup.
    founder_series_due / sweep / claim / finish are service_role only and are called
    by the send-founder-series edge function. Every send re-checks that the person is
    still an opted-in founder, active, confirmed, not suppressed, and enrolled.

    The existing welcome email (on_profile_insert_welcome -> send-welcome-email) is
    NOT touched: it fires once at profile creation for every role and is
    transactional. The series starts only after confirmation and at day 1, so the two
    never share a trigger, a ledger or a send.

  Unsubscribe
    unsubscribe_by_token now also clears marketing_opt_in, stops the enrolment and
    adds the address to email_suppression_list (reason 'unsubscribed'). It keeps its
    signature, grants and return value. Transactional email (Supabase Auth mail,
    password reset, security notices, the one-time welcome email, product
    notifications) is never blocked by an 'unsubscribed' row. resubscribe_by_token is
    unchanged: it restores only digest + inspiration, never marketing, and never
    removes a suppression row.

  Scheduling
    The hourly cron job is created INACTIVE. Turn it on only after the edge function
    is deployed:
      select cron.alter_job((select jobid from cron.job where jobname = 'send-founder-series-hourly'), active := true);

  Rollback (reverse order):
    select cron.unschedule('send-founder-series-hourly');
    drop trigger if exists on_auth_user_series_enroll_confirmed on auth.users;
    drop trigger if exists on_auth_user_series_enroll_insert on auth.users;
    drop trigger if exists trg_profiles_stop_series_on_opt_out on public.profiles;
    drop function if exists public.founder_series_finish(uuid, smallint, boolean, text);
    drop function if exists public.founder_series_claim(uuid, smallint);
    drop function if exists public.founder_series_sweep();
    drop function if exists public.founder_series_due(integer, uuid, smallint);
    drop function if exists public.founder_series_offset(smallint);
    drop function if exists public.stop_series_on_opt_out();
    drop function if exists public.enroll_founder_series();
    drop table if exists public.marketing_series_sends, public.marketing_series_enrollments;
    -- then restore handle_new_user, profiles_guard_insert, profiles_lock_privileged_columns
    -- and unsubscribe_by_token to the definitions captured in the PR description, then
    -- drop the four profiles columns and marketing_consent_texts.
*/

-- 1. consent texts (what the checkbox said, per version) -----------------------
CREATE TABLE IF NOT EXISTS public.marketing_consent_texts (
  version    text PRIMARY KEY,
  text       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_consent_texts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketing_consent_texts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.marketing_consent_texts TO service_role;

-- v1 is the exact wording shown next to the signup checkbox (src/lib/marketingConsent.ts).
INSERT INTO public.marketing_consent_texts (version, text)
VALUES ('v1', 'أرسلوا لي نصائح المؤسسين وأخبار بذرة والعروض. يمكنني إلغاء الاشتراك في أي وقت.')
ON CONFLICT (version) DO NOTHING;

-- 2. consent columns on profiles ------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_source text,
  ADD COLUMN IF NOT EXISTS marketing_consent_text_version text
    REFERENCES public.marketing_consent_texts (version);

-- 3. clients cannot write the consent columns -----------------------------------
-- Same checks as before (plan, role, status, tier, stripe_customer_id) plus the four
-- consent columns.
CREATE OR REPLACE FUNCTION public.profiles_lock_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF NEW.plan               IS DISTINCT FROM OLD.plan
       OR NEW.role            IS DISTINCT FROM OLD.role
       OR NEW.status          IS DISTINCT FROM OLD.status
       OR NEW.tier            IS DISTINCT FROM OLD.tier
       OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.marketing_opt_in IS DISTINCT FROM OLD.marketing_opt_in
       OR NEW.marketing_opt_in_at IS DISTINCT FROM OLD.marketing_opt_in_at
       OR NEW.marketing_opt_in_source IS DISTINCT FROM OLD.marketing_opt_in_source
       OR NEW.marketing_consent_text_version IS DISTINCT FROM OLD.marketing_consent_text_version THEN
      RAISE EXCEPTION 'غير مسموح بتعديل الخطة أو الدور أو حالة الحساب أو بيانات الدفع أو الموافقة التسويقية من حسابك.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- A client INSERT could not set consent either (defence in depth: there is currently
-- no INSERT policy for clients, and this keeps it that way if one is ever added).
CREATE OR REPLACE FUNCTION public.profiles_guard_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF NEW.role IS NULL OR NEW.role NOT IN ('founder', 'investor') THEN
      RAISE EXCEPTION 'دور غير مسموح به.' USING ERRCODE = '42501';
    END IF;
    NEW.plan               := 'free';
    NEW.stripe_customer_id := NULL;
    NEW.marketing_opt_in                := false;
    NEW.marketing_opt_in_at             := NULL;
    NEW.marketing_opt_in_source         := NULL;
    NEW.marketing_consent_text_version  := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. handle_new_user records the (optional) consent ------------------------------
-- Unchanged apart from the consent: same role rule (founder or investor, anything
-- else becomes founder), same ON CONFLICT DO NOTHING. The opt-in is recorded only for
-- founders, only when the box value is exactly 'true', and only for a known consent
-- text version. COALESCE keeps v_opt from ever being NULL (a version with no box value
-- would otherwise insert NULL into a NOT NULL column and abort the signup).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role    text;
  v_version text;
  v_opt     boolean;
BEGIN
  v_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('founder', 'investor')
      THEN NEW.raw_user_meta_data->>'role'
    ELSE 'founder'
  END;
  v_version := NEW.raw_user_meta_data->>'marketing_consent_text_version';

  v_opt := COALESCE(
    v_role = 'founder'
    AND (NEW.raw_user_meta_data->>'marketing_opt_in') = 'true'
    AND v_version IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.marketing_consent_texts t WHERE t.version = v_version),
    false
  );

  INSERT INTO public.profiles (
    user_id, full_name, role,
    marketing_opt_in, marketing_opt_in_at, marketing_opt_in_source, marketing_consent_text_version
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role,
    v_opt,
    CASE WHEN v_opt THEN now() END,
    CASE WHEN v_opt THEN 'signup_form' END,
    CASE WHEN v_opt THEN v_version END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. series tables --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_series_enrollments (
  user_id        uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  series         text NOT NULL DEFAULT 'founder_welcome',
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped')),
  stopped_reason text,
  enrolled_at    timestamptz NOT NULL DEFAULT now(),
  stopped_at     timestamptz
);

CREATE TABLE IF NOT EXISTS public.marketing_series_sends (
  user_id    uuid NOT NULL REFERENCES public.marketing_series_enrollments (user_id) ON DELETE CASCADE,
  step       smallint NOT NULL CHECK (step BETWEEN 1 AND 3),
  status     text NOT NULL CHECK (status IN ('sending', 'sent', 'failed')),
  attempts   smallint NOT NULL DEFAULT 1,
  last_error text,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  sent_at    timestamptz,
  PRIMARY KEY (user_id, step)
);

ALTER TABLE public.marketing_series_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_series_sends ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketing_series_enrollments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.marketing_series_sends FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.marketing_series_enrollments TO service_role;
GRANT ALL ON public.marketing_series_sends TO service_role;

-- 6. enrolment on email confirmation --------------------------------------------
CREATE OR REPLACE FUNCTION public.enroll_founder_series()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  p record;
  v_suppressed boolean;
BEGIN
  BEGIN
    SELECT pr.role, pr.marketing_opt_in INTO p FROM public.profiles pr WHERE pr.user_id = NEW.id;
    IF NOT FOUND OR p.role IS DISTINCT FROM 'founder' OR NOT p.marketing_opt_in THEN
      RETURN NEW;
    END IF;

    v_suppressed := EXISTS (
      SELECT 1 FROM public.email_suppression_list s WHERE lower(s.email) = lower(NEW.email)
    );

    -- Once per person: the PK makes a second confirmation a no-op and keeps the
    -- original enrolled_at, so the day-1/3/6 schedule never restarts.
    INSERT INTO public.marketing_series_enrollments (user_id, status, stopped_reason, stopped_at)
    VALUES (
      NEW.id,
      CASE WHEN v_suppressed THEN 'stopped' ELSE 'active' END,
      CASE WHEN v_suppressed THEN 'suppressed' END,
      CASE WHEN v_suppressed THEN now() END
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'enroll_founder_series failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enroll_founder_series() FROM PUBLIC, anon, authenticated;

-- Trigger names sort after on_auth_user_created (handle_new_user), so on a confirmed
-- INSERT the profile already exists when this runs.
CREATE OR REPLACE TRIGGER on_auth_user_series_enroll_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.enroll_founder_series();

CREATE OR REPLACE TRIGGER on_auth_user_series_enroll_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.enroll_founder_series();

-- 7. opting out stops the enrolment immediately -----------------------------------
CREATE OR REPLACE FUNCTION public.stop_series_on_opt_out()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.marketing_series_enrollments
     SET status = 'stopped', stopped_reason = 'unsubscribed', stopped_at = now()
   WHERE user_id = NEW.user_id AND status = 'active';
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.stop_series_on_opt_out() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_profiles_stop_series_on_opt_out
  AFTER UPDATE OF marketing_opt_in ON public.profiles
  FOR EACH ROW
  WHEN (OLD.marketing_opt_in AND NOT NEW.marketing_opt_in)
  EXECUTE FUNCTION public.stop_series_on_opt_out();

-- 8. unsubscribe stops all marketing and suppresses the address -------------------
-- Same signature, grants (anon, authenticated, service_role) and return value as
-- before (true if a profile matched). It still clears the digest and inspiration
-- flags, and now also the marketing opt-in, the enrolment, and adds the address to
-- the suppression list. Idempotent: a second click changes nothing.
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user  uuid;
  v_email text;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
     SET email_digest_enabled = false,
         inspiration_enabled  = false,
         marketing_opt_in     = false
   WHERE unsubscribe_token = p_token
  RETURNING user_id INTO v_user;

  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  -- Also direct (the trigger on marketing_opt_in covers the true -> false change;
  -- this covers a person whose flag was already false).
  UPDATE public.marketing_series_enrollments
     SET status = 'stopped', stopped_reason = 'unsubscribed', stopped_at = now()
   WHERE user_id = v_user AND status = 'active';

  SELECT lower(btrim(u.email)) INTO v_email FROM auth.users u WHERE u.id = v_user;
  IF v_email IS NOT NULL AND v_email <> '' THEN
    INSERT INTO public.email_suppression_list (email, reason, source)
    VALUES (v_email, 'unsubscribed', 'profile_unsubscribe')
    ON CONFLICT (email) DO NOTHING;
  END IF;

  RETURN true;
END;
$$;

-- 9. the sender's database side (service_role only) -----------------------------
-- Days after email confirmation: step 1 = day 1, step 2 = day 3, step 3 = day 6.
CREATE OR REPLACE FUNCTION public.founder_series_offset(p_step smallint)
RETURNS interval
LANGUAGE sql
IMMUTABLE
SET search_path TO ''
AS $$
  SELECT CASE p_step WHEN 1 THEN interval '1 day' WHEN 2 THEN interval '3 days' WHEN 3 THEN interval '6 days' END;
$$;

-- Who should get which step right now. Read-only: the sender's dry_run report is
-- exactly this. A step is due when its day has arrived and is not more than 72 hours
-- late; a step that failed is retried on later runs up to 3 attempts; steps are
-- independent, so a failed or missed step never blocks the next one. Re-checks
-- consent, role, account status, confirmed email, enrolment status and suppression on
-- every call.
CREATE OR REPLACE FUNCTION public.founder_series_due(
  p_limit integer DEFAULT 50,
  p_user  uuid DEFAULT NULL,
  p_step  smallint DEFAULT NULL
)
RETURNS TABLE (
  user_id           uuid,
  step              smallint,
  email             text,
  full_name         text,
  unsubscribe_token text,
  due_at            timestamptz,
  attempts          smallint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT e.user_id,
         s.step,
         u.email::text,
         p.full_name,
         p.unsubscribe_token,
         e.enrolled_at + public.founder_series_offset(s.step),
         COALESCE(x.attempts, 0)::smallint
    FROM public.marketing_series_enrollments e
    JOIN public.profiles p ON p.user_id = e.user_id
    JOIN auth.users u ON u.id = e.user_id
    CROSS JOIN (VALUES (1::smallint), (2::smallint), (3::smallint)) AS s(step)
    LEFT JOIN public.marketing_series_sends x ON x.user_id = e.user_id AND x.step = s.step
   WHERE e.status = 'active'
     AND p.role = 'founder'
     AND p.marketing_opt_in
     AND p.status = 'active'
     AND p.suspended_at IS NULL
     AND u.email IS NOT NULL
     AND u.email_confirmed_at IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.email_suppression_list z WHERE lower(z.email) = lower(u.email))
     AND (x.user_id IS NULL OR (x.status = 'failed' AND x.attempts < 3))
     AND e.enrolled_at + public.founder_series_offset(s.step) <= now()
     AND e.enrolled_at + public.founder_series_offset(s.step) + interval '72 hours' > now()
     AND (p_user IS NULL OR e.user_id = p_user)
     AND (p_step IS NULL OR s.step = p_step)
   ORDER BY 6, 1, 2
   LIMIT GREATEST(p_limit, 1);
$$;

-- Housekeeping: close enrolments whose last step can no longer be sent.
CREATE OR REPLACE FUNCTION public.founder_series_sweep()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE n integer;
BEGIN
  UPDATE public.marketing_series_enrollments
     SET status = 'completed', stopped_at = now()
   WHERE status = 'active'
     AND enrolled_at + public.founder_series_offset(3::smallint) + interval '72 hours' <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- Claim one step before sending: at most one claim per step (a crash after the claim
-- skips the step rather than sending it twice). Re-checks eligibility, so a person who
-- unsubscribed between the due() read and now is not mailed.
CREATE OR REPLACE FUNCTION public.founder_series_claim(p_user uuid, p_step smallint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE n integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.founder_series_due(1, p_user, p_step)) THEN
    RETURN false;
  END IF;

  INSERT INTO public.marketing_series_sends AS x (user_id, step, status, attempts)
  VALUES (p_user, p_step, 'sending', 1)
  ON CONFLICT (user_id, step) DO UPDATE
     SET status = 'sending', attempts = x.attempts + 1, claimed_at = now(), last_error = NULL
   WHERE x.status = 'failed' AND x.attempts < 3;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.founder_series_finish(
  p_user uuid, p_step smallint, p_ok boolean, p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.marketing_series_sends
     SET status = CASE WHEN p_ok THEN 'sent' ELSE 'failed' END,
         sent_at = CASE WHEN p_ok THEN now() END,
         last_error = CASE WHEN p_ok THEN NULL ELSE left(coalesce(p_error, 'send failed'), 500) END
   WHERE user_id = p_user AND step = p_step AND status = 'sending';

  IF p_ok AND p_step = 3 THEN
    UPDATE public.marketing_series_enrollments
       SET status = 'completed', stopped_at = now()
     WHERE user_id = p_user AND status = 'active';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.founder_series_offset(smallint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.founder_series_due(integer, uuid, smallint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.founder_series_sweep() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.founder_series_claim(uuid, smallint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.founder_series_finish(uuid, smallint, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.founder_series_offset(smallint) TO service_role;
GRANT EXECUTE ON FUNCTION public.founder_series_due(integer, uuid, smallint) TO service_role;
GRANT EXECUTE ON FUNCTION public.founder_series_sweep() TO service_role;
GRANT EXECUTE ON FUNCTION public.founder_series_claim(uuid, smallint) TO service_role;
GRANT EXECUTE ON FUNCTION public.founder_series_finish(uuid, smallint, boolean, text) TO service_role;

-- 10. hourly job, created INACTIVE (turn on after the edge function is deployed) ---
-- Same call shape as the other cron jobs: Vault bearer, verify_jwt=false function.
SELECT cron.schedule(
  'send-founder-series-hourly',
  '17 * * * *',
  $cron$select net.http_post(
    url := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/send-founder-series',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_bearer_token'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )$cron$
);
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'send-founder-series-hourly'),
  active := false
);
