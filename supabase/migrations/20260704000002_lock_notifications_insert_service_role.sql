-- Lock notifications INSERT to service-role only.
--
-- Cross-user notifications are now written exclusively by the send-notification
-- Edge Function (service role, which bypasses RLS), and the Edge Functions
-- send-investor-match / send-investor-interested / send-inspiration-upgrade
-- (also service role). No client (anon/authenticated) needs to INSERT directly.
--
-- Previously a permissive client INSERT policy let any authenticated user forge
-- a notification for any user_id. Removing every client INSERT policy closes
-- that spoofing vector: with no INSERT policy, anon/authenticated inserts
-- default-deny, while service-role writers are unaffected (they bypass RLS).
--
-- Drops by iteration so it works regardless of the policy's name.

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

-- (Intentionally no INSERT policy is created — service role bypasses RLS.)
