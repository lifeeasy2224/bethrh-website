-- Reconcile production fixes applied live on 2026-07-03 (Bolt -> Supabase drift).
-- These changes already exist in the live DB (project uxbkzumndwdjtocvmbdb); this
-- migration brings the repo in line so the two no longer diverge.
-- All statements are idempotent and safe to re-run.

-- ============================================================================
-- 1. Plan CHECK constraints
--    The storefront uses pro/growth/accelerator; the tables previously only
--    allowed free/builder/launch/family, which blocked subscription + profile
--    writes for the current plans. Allow the current names plus the legacy ones
--    (so any existing rows stay valid).
-- ============================================================================
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'pro', 'growth', 'accelerator', 'builder', 'launch', 'family'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'growth', 'accelerator', 'builder', 'launch', 'family'));

-- ============================================================================
-- 2. user_ideas SELECT policies
--    Without a SELECT policy, insert().select() readback was rolled back
--    ("Failed to add idea"), and founders couldn't list their own ideas.
--    Owner-read + published-marketplace-read (investors browse published ideas).
-- ============================================================================
DROP POLICY IF EXISTS "Users can read own ideas" ON public.user_ideas;
CREATE POLICY "Users can read own ideas"
  ON public.user_ideas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can read published marketplace ideas" ON public.user_ideas;
CREATE POLICY "Anyone can read published marketplace ideas"
  ON public.user_ideas FOR SELECT
  TO authenticated
  USING (in_marketplace = true);
