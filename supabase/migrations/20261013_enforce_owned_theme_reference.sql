CREATE OR REPLACE FUNCTION public.enforce_owned_theme_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.theme_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.big_themes
    WHERE id = NEW.theme_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'The selected wrapper does not belong to this account';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_entries_owned_theme ON public.blog_entries;
CREATE TRIGGER blog_entries_owned_theme
  BEFORE INSERT OR UPDATE OF theme_id, user_id ON public.blog_entries
  FOR EACH ROW EXECUTE FUNCTION public.enforce_owned_theme_reference();

DROP TRIGGER IF EXISTS milestones_owned_theme ON public.milestones_2027;
CREATE TRIGGER milestones_owned_theme
  BEFORE INSERT OR UPDATE OF theme_id, user_id ON public.milestones_2027
  FOR EACH ROW EXECUTE FUNCTION public.enforce_owned_theme_reference();
