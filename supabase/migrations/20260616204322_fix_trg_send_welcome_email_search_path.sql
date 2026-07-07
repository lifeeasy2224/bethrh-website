-- Fix trg_send_welcome_email: empty search_path means public._call_edge_function
-- can't be resolved, causing every signup to fail with "Database error saving new user".
CREATE OR REPLACE FUNCTION public.trg_send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM _call_edge_function(
    'send-welcome-email',
    jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$;
