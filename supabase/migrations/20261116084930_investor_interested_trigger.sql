-- Email the founder when an investor asks to connect. The browser used to try this with
-- get_user_email (service_role-only), so the email was never sent. Same pattern as
-- on_message_insert / on_profile_insert_welcome: SECURITY DEFINER wrapper → _call_edge_function.
create or replace function public.trg_send_investor_interested()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending' then
    perform public._call_edge_function(
      'send-investor-interested'::text,
      jsonb_build_object('record', row_to_json(new))
    );
  end if;
  return new;
end;
$$;

revoke all on function public.trg_send_investor_interested() from public, anon, authenticated;

drop trigger if exists on_connection_request_insert on public.connection_requests;
create trigger on_connection_request_insert
  after insert on public.connection_requests
  for each row execute function public.trg_send_investor_interested();
