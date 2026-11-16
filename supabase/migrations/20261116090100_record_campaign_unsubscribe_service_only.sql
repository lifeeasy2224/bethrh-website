-- Campaign unsubscribes now go through the unsubscribe-campaign edge function, which
-- checks a signed link (or a real recipient row for older emails). Close the direct door.
revoke execute on function public.record_campaign_unsubscribe(text, text) from public, anon, authenticated;
grant  execute on function public.record_campaign_unsubscribe(text, text) to service_role;
