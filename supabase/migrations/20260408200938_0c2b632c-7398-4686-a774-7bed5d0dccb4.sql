ALTER TABLE public.artists ADD COLUMN cover_url text;

COMMENT ON COLUMN public.artists.cover_url IS 'Cover banner image URL for artist profile page';