CREATE OR REPLACE FUNCTION public.increment_promo_uses(code_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.promo_codes
  SET uses_count = uses_count + 1
  WHERE id = code_id;
$$;
