-- Fix trg_send_new_message: cast the function name literal to text so Postgres
-- can resolve _call_edge_function(text, jsonb) correctly.
CREATE OR REPLACE FUNCTION trg_send_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM _call_edge_function(
    'send-new-message'::text,
    jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$;
