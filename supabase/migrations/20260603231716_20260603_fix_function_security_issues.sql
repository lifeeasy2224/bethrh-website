/*
  # Fix Function Security Issues

  ## Summary
  Addresses multiple security vulnerabilities flagged in the Supabase security advisor:

  1. **Mutable search_path on `update_idea_library_updated_at`**
     - Recreates the trigger function with `SET search_path = ''`
     - Uses fully qualified schema names (`public.`) inside the function body
     - Prevents search_path injection attacks

  2. **Mutable search_path on `handle_library_selection_change`**
     - Same fix: recreates with `SET search_path = ''` and qualified names
     - Revokes EXECUTE from `anon` and `authenticated` roles (trigger functions
       should never be callable directly via RPC — they are invoked by triggers only)

  3. **Public/authenticated can execute SECURITY DEFINER `grab_seed`**
     - Adds an explicit auth check inside `grab_seed`: rejects calls where
       `p_user_id` does not match `auth.uid()`, preventing impersonation
     - Revokes EXECUTE from `anon` (anonymous users must not call this)
     - Keeps EXECUTE for `authenticated` (founders must be able to grab seeds)
     - Fixes search_path by using empty string (already had SET but wrong value)

  4. **HIBP (leaked password protection)**
     - Re-applies the HIBP enable in case the previous migration did not take effect

  ## Security Changes
  - `anon` can no longer call `grab_seed` or `handle_library_selection_change`
  - `authenticated` can no longer call `handle_library_selection_change` via RPC
  - `grab_seed` validates caller identity before operating
  - Both trigger functions are hardened against search_path injection
*/

-- ─── 1. Fix update_idea_library_updated_at: set immutable search_path ─────────
CREATE OR REPLACE FUNCTION public.update_idea_library_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke direct RPC execution — it's a trigger function only
REVOKE EXECUTE ON FUNCTION public.update_idea_library_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_idea_library_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_idea_library_updated_at() FROM public;


-- ─── 2. Fix handle_library_selection_change: search_path + revoke RPC access ──
CREATE OR REPLACE FUNCTION public.handle_library_selection_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.idea_library
    SET current_entrepreneurs = current_entrepreneurs + 1
    WHERE id = NEW.library_idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.idea_library
    SET current_entrepreneurs = GREATEST(current_entrepreneurs - 1, 0)
    WHERE id = OLD.library_idea_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger functions must not be directly callable via REST/RPC
REVOKE EXECUTE ON FUNCTION public.handle_library_selection_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_library_selection_change() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_library_selection_change() FROM public;


-- ─── 3. Fix grab_seed: empty search_path + identity check + revoke anon ───────
CREATE OR REPLACE FUNCTION public.grab_seed(p_seed_id uuid, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_idea_id uuid;
  v_seed    record;
BEGIN
  -- Reject if caller is not authenticated or is impersonating another user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  -- Lock the seed row to prevent race conditions
  SELECT * INTO v_seed
  FROM public.seeds
  WHERE id = p_seed_id AND status = 'active'
  FOR UPDATE;

  IF v_seed IS NULL THEN
    RAISE EXCEPTION 'SEED_NOT_FOUND';
  END IF;

  IF v_seed.spots_taken >= v_seed.max_spots THEN
    RAISE EXCEPTION 'NO_SPOTS';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.seed_grabs
    WHERE seed_id = p_seed_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'ALREADY_GRABBED';
  END IF;

  -- Create idea in founder's dashboard
  INSERT INTO public.ideas (user_id, title, description, sector, stage, week, validation_score)
  VALUES (p_user_id, v_seed.name, v_seed.short_description, v_seed.sector_id, 'ideation', 1, 0)
  RETURNING id INTO v_idea_id;

  -- Record the grab
  INSERT INTO public.seed_grabs (seed_id, user_id, idea_id)
  VALUES (p_seed_id, p_user_id, v_idea_id);

  -- Increment counters
  UPDATE public.seeds
  SET spots_taken = spots_taken + 1,
      grabs       = grabs + 1,
      updated_at  = now()
  WHERE id = p_seed_id;

  RETURN v_idea_id;
END;
$$;

-- Anonymous users must never call grab_seed
REVOKE EXECUTE ON FUNCTION public.grab_seed(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grab_seed(uuid, uuid) FROM public;

-- Only authenticated (signed-in) founders may call it
GRANT EXECUTE ON FUNCTION public.grab_seed(uuid, uuid) TO authenticated;


-- ─── 4. Re-enable HIBP leaked-password protection ─────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth'
      AND table_name   = 'config'
      AND column_name  = 'password_hibp_enabled'
  ) THEN
    UPDATE auth.config SET password_hibp_enabled = true;
  END IF;
END $$;
