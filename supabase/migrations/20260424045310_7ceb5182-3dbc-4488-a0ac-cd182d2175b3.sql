
-- Extend artists table
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#DC2626',
  ADD COLUMN IF NOT EXISTS banner_position TEXT NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS pinned_song_id UUID;

-- artist_links
CREATE TABLE IF NOT EXISTS public.artist_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'custom',
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Links viewable by everyone"
  ON public.artist_links FOR SELECT USING (true);

CREATE POLICY "Artist owner manages own links"
  ON public.artist_links FOR ALL
  USING (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_links.artist_id AND artists.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_links.artist_id AND artists.user_id = auth.uid()));

CREATE POLICY "Admins manage all links"
  ON public.artist_links FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_artist_links_updated
  BEFORE UPDATE ON public.artist_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_artist_links_artist ON public.artist_links(artist_id, position);

-- artist_top_tracks
CREATE TABLE IF NOT EXISTS public.artist_top_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  song_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (artist_id, song_id),
  UNIQUE (artist_id, position)
);

ALTER TABLE public.artist_top_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Top tracks viewable by everyone"
  ON public.artist_top_tracks FOR SELECT USING (true);

CREATE POLICY "Artist owner manages own top tracks"
  ON public.artist_top_tracks FOR ALL
  USING (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_top_tracks.artist_id AND artists.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_top_tracks.artist_id AND artists.user_id = auth.uid()));

CREATE POLICY "Admins manage all top tracks"
  ON public.artist_top_tracks FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_top_tracks_artist ON public.artist_top_tracks(artist_id, position);
