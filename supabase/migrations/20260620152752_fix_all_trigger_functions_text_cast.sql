-- Fix all trigger functions that call _call_edge_function with untyped string literals.
-- Postgres resolves 'literal' as type `unknown` and fails to match _call_edge_function(text, jsonb).
-- Adding ::text casts fixes the overload resolution.

CREATE OR REPLACE FUNCTION trg_send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM _call_edge_function(
    'send-welcome-email'::text,
    jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_send_investor_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.in_marketplace = true AND (TG_OP = 'INSERT' OR OLD.in_marketplace IS DISTINCT FROM true) THEN
    PERFORM _call_edge_function(
      'send-investor-match'::text,
      jsonb_build_object('record', row_to_json(NEW))
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_send_investor_interested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM _call_edge_function(
    'send-investor-interested'::text,
    jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_send_validation_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.notes ILIKE 'Idea Stress Test%' OR NEW.type = 'stress_test' THEN
    PERFORM _call_edge_function(
      'send-validation-complete'::text,
      jsonb_build_object('record', row_to_json(NEW))
    );
  END IF;
  RETURN NEW;
END;
$$;
