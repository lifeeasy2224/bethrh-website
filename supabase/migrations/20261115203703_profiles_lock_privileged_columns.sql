/*
  # Lock privileged profile columns; close client INSERT; whitelist signup role

  Until now any signed-in user could run
      UPDATE profiles SET plan = 'accelerator', role = 'admin' WHERE user_id = auth.uid()
  because the "Users can update own profile" policy only checks user_id and anon /
  authenticated hold UPDATE on every column. That meant a free plan upgrade for
  anyone (plan drives idea limits, journey access, marketplace publishing) and a
  self-made profiles.role = 'admin', which seven policies on library_ideas,
  library_grabs and library_idea_views treat as an admin. It also allowed setting
  stripe_customer_id to another user's id (readable by any signed-in user through
  the "view public profiles" policy) and then opening that customer's billing portal
  through stripe-portal.

  What this does
    1. profiles_lock_privileged_columns (BEFORE UPDATE): for anon / authenticated,
       a change to plan, role, status, tier or stripe_customer_id raises 42501.
       service_role (stripe-webhook, stripe-checkout, admin-auth, the send-* functions)
       and postgres / SECURITY DEFINER code (handle_new_user, the cron helpers) are
       not affected. Its name sorts before trg_sync_tier_to_plan, so the lock sees
       only what the client sent; tier is then re-synced to plan as before.
    2. profiles_guard_insert (BEFORE INSERT): for anon / authenticated, plan is forced
       to 'free', stripe_customer_id to NULL, and role must be founder or investor
       (anything else raises). Defence in depth: clients cannot insert at all after 3.
    3. REVOKE INSERT ON profiles FROM anon, authenticated, and DROP POLICY
       "Users can insert own profile". Profiles are created by handle_new_user
       (SECURITY DEFINER, on auth.users insert) and by service_role only.
    4. handle_new_user: the role comes from raw_user_meta_data, which the caller of the
       public signup endpoint controls. Only 'founder' and 'investor' are accepted;
       anything else (including 'admin') becomes 'founder'.

  Not changed here: the "Authenticated users can view public profiles" SELECT policy
  (USING true) still exposes every profile column, including unsubscribe_token and
  stripe_customer_id, to any signed-in user. The app reads other users' names from it,
  so narrowing it needs a column-level change of its own.

  Rollback
    DROP TRIGGER IF EXISTS profiles_lock_privileged_columns ON public.profiles;
    DROP TRIGGER IF EXISTS profiles_guard_insert ON public.profiles;
    DROP FUNCTION IF EXISTS public.profiles_lock_privileged_columns();
    DROP FUNCTION IF EXISTS public.profiles_guard_insert();
    GRANT INSERT ON public.profiles TO anon, authenticated;
    CREATE POLICY "Users can insert own profile" ON public.profiles
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    -- handle_new_user: restore COALESCE(NEW.raw_user_meta_data->>'role', 'founder')
*/

-- ── 4. signup creates the profile; the role is whitelisted ───────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('founder', 'investor')
        THEN NEW.raw_user_meta_data->>'role'
      ELSE 'founder'
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- ── 1. UPDATE lock ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.profiles_lock_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF NEW.plan               IS DISTINCT FROM OLD.plan
       OR NEW.role            IS DISTINCT FROM OLD.role
       OR NEW.status          IS DISTINCT FROM OLD.status
       OR NEW.tier            IS DISTINCT FROM OLD.tier
       OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
      RAISE EXCEPTION 'غير مسموح بتعديل الخطة أو الدور أو حالة الحساب أو بيانات الدفع من حسابك.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.profiles_lock_privileged_columns() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER profiles_lock_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_lock_privileged_columns();

-- ── 2. INSERT guard (defence in depth) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.profiles_guard_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF NEW.role IS NULL OR NEW.role NOT IN ('founder', 'investor') THEN
      RAISE EXCEPTION 'دور غير مسموح به.' USING ERRCODE = '42501';
    END IF;
    NEW.plan               := 'free';
    NEW.stripe_customer_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.profiles_guard_insert() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER profiles_guard_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_insert();

-- ── 3. no client INSERT at all ───────────────────────────────────────────────
REVOKE INSERT ON public.profiles FROM anon, authenticated;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
