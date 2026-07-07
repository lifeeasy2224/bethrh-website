-- create_canvas_for_new_idea is a trigger function; it should never be called
-- directly via RPC. Revoke EXECUTE from all public roles.
REVOKE EXECUTE ON FUNCTION public.create_canvas_for_new_idea() FROM anon, authenticated;

-- increment_promo_uses already only allows service_role, but revoke public grant
-- to be explicit (the = in proacl means public/anon implicit grant).
REVOKE EXECUTE ON FUNCTION public.increment_promo_uses(uuid) FROM PUBLIC;
