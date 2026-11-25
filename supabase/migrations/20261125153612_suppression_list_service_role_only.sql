/*
  # email_suppression_list: service_role only

  The table had four policies for `authenticated` (select, insert, update, delete, all
  `true`) plus matching table grants for anon and authenticated. Any signed-in user could
  read every suppressed address, delete rows (so an unsubscribed or bounced address gets
  mailed again) or insert rows (suppress anyone's address).

  Nothing in the app needs that: the admin pages go through admin-db (service role), the
  edge functions use the service role, and record_campaign_unsubscribe /
  unsubscribe_by_token are SECURITY DEFINER. This keeps only the existing
  service_role_all_suppression policy, drops the four authenticated ones, and revokes the
  table grants from anon and authenticated. RLS stays enabled.

  Rollback:
    create policy auth_select_suppression on public.email_suppression_list for select to authenticated using (true);
    create policy auth_insert_suppression on public.email_suppression_list for insert to authenticated with check (true);
    create policy auth_update_suppression on public.email_suppression_list for update to authenticated using (true) with check (true);
    create policy auth_delete_suppression on public.email_suppression_list for delete to authenticated using (true);
    grant select, insert, update, delete, references on public.email_suppression_list to anon, authenticated;
*/

DROP POLICY IF EXISTS auth_select_suppression ON public.email_suppression_list;
DROP POLICY IF EXISTS auth_insert_suppression ON public.email_suppression_list;
DROP POLICY IF EXISTS auth_update_suppression ON public.email_suppression_list;
DROP POLICY IF EXISTS auth_delete_suppression ON public.email_suppression_list;

REVOKE ALL ON public.email_suppression_list FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_suppression_list TO service_role;

ALTER TABLE public.email_suppression_list ENABLE ROW LEVEL SECURITY;
