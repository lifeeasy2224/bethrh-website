
-- Fix mutable search_path on all trigger/helper functions
ALTER FUNCTION public.trg_send_welcome_email() SET search_path = '';
ALTER FUNCTION public.trg_send_investor_match() SET search_path = '';
ALTER FUNCTION public.trg_send_investor_interested() SET search_path = '';
ALTER FUNCTION public.trg_send_new_message() SET search_path = '';
ALTER FUNCTION public.trg_send_validation_complete() SET search_path = '';

-- Revoke direct EXECUTE access from anon and authenticated on all
-- SECURITY DEFINER functions that should never be called via RPC

-- Trigger functions (only called by DB triggers, never directly)
REVOKE EXECUTE ON FUNCTION public.trg_send_welcome_email() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_send_investor_match() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_send_investor_interested() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_send_new_message() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_send_validation_complete() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_canvas_for_new_idea() FROM anon, authenticated;

-- Internal / service-only helpers
REVOKE EXECUTE ON FUNCTION public._call_edge_function(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_weekly_digests() FROM anon, authenticated;
