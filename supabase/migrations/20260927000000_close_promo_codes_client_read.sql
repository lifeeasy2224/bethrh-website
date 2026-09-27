/*
  # Close client read access to promo_codes (launch audit P0-2)

  The policy "Authenticated users can read active promo codes" let any
  signed-in user list every active code — including 100%-off codes, which
  stripe-checkout turns into an active paid plan with no payment. It
  contradicted this table's own documented design
  (20260604195208_create_promo_codes_table.sql: "No public or authenticated
  user access").

  Promo validation now happens only inside the stripe-checkout edge function
  (service role, exact-code match). Admin reads/writes go through admin-auth
  (service role). Neither needs a policy: service_role bypasses RLS.

  Drift-proof: drops EVERY policy on the table, not just the known name, in
  case the live DB has others. RLS stays enabled, so with no policies the
  anon/authenticated roles see zero rows; grants are revoked as well.
*/

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_codes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.promo_codes', p.policyname);
  END LOOP;
END $$;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.promo_codes FROM anon, authenticated;
