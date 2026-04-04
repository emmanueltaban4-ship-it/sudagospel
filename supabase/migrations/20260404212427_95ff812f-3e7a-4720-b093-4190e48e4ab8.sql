
CREATE OR REPLACE FUNCTION public.increment_ad_impression(ad_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ads SET impression_count = impression_count + 1 WHERE id = ad_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_ad_click(ad_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ads SET click_count = click_count + 1 WHERE id = ad_id;
$$;
