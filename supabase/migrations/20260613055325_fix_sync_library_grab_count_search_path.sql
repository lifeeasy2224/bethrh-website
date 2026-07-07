
-- Fix sync_library_grab_count: body uses unqualified table name but search_path is empty,
-- causing the trigger to fail and roll back the entire library_grabs INSERT.
-- Solution: qualify the table reference with the public schema.
CREATE OR REPLACE FUNCTION public.sync_library_grab_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.library_ideas SET grab_count = grab_count + 1 WHERE id = NEW.library_idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.library_ideas SET grab_count = GREATEST(grab_count - 1, 0) WHERE id = OLD.library_idea_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.sync_library_grab_count() FROM anon, authenticated;
