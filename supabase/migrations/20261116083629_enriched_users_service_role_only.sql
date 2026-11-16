-- enriched_users joins profiles with scoring/CRM fields (name, tier, lead score, logins).
-- It had default privileges for anon and authenticated, so anyone could read every user.
-- Every reader goes through admin-db or send-campaign (service role).
revoke all on public.enriched_users from anon, authenticated;
grant select on public.enriched_users to service_role;
