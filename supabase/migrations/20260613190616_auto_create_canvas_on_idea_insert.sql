-- Auto-create canvas_data row whenever a new user_idea is inserted
CREATE OR REPLACE FUNCTION create_canvas_for_new_idea()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.canvas_data (user_idea_id)
  VALUES (NEW.id)
  ON CONFLICT (user_idea_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_create_canvas_on_idea_insert
  AFTER INSERT ON public.user_ideas
  FOR EACH ROW
  EXECUTE FUNCTION create_canvas_for_new_idea();
