
CREATE OR REPLACE FUNCTION public.increment_promo_uses(code_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.promo_codes
  SET uses_count = uses_count + 1
  WHERE id = code_id;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_promo_uses(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_promo_uses(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_promo_uses(uuid) TO service_role;
