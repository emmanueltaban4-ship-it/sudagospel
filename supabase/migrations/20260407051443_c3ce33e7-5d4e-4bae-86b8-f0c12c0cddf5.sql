
-- Create albums table
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  release_date DATE,
  genre TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add album_id to songs
ALTER TABLE public.songs ADD COLUMN album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL;

-- Enable RLS on albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Anyone can view albums
CREATE POLICY "Albums viewable by everyone" ON public.albums FOR SELECT TO public USING (true);

-- Artists can create albums (match via artist ownership)
CREATE POLICY "Artists can create albums" ON public.albums FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.artists WHERE artists.id = albums.artist_id AND artists.user_id = auth.uid()));

-- Artists can update own albums
CREATE POLICY "Artists can update own albums" ON public.albums FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.artists WHERE artists.id = albums.artist_id AND artists.user_id = auth.uid()));

-- Artists can delete own albums
CREATE POLICY "Artists can delete own albums" ON public.albums FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.artists WHERE artists.id = albums.artist_id AND artists.user_id = auth.uid()));

-- Admins can manage albums
CREATE POLICY "Admins can manage albums" ON public.albums FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create a function for top songs of the week
CREATE OR REPLACE FUNCTION public.get_weekly_top_songs(lim INTEGER DEFAULT 10)
RETURNS TABLE(song_id UUID, title TEXT, cover_url TEXT, file_url TEXT, artist_name TEXT, artist_id UUID, weekly_plays BIGINT, weekly_downloads BIGINT, total_score BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH weekly_plays AS (
    SELECT s.id, COUNT(*) AS cnt
    FROM songs s
    LEFT JOIN song_likes sl ON sl.song_id = s.id AND sl.created_at >= now() - interval '7 days'
    WHERE s.is_approved = true
    GROUP BY s.id
  ),
  weekly_downloads AS (
    SELECT sd.song_id AS id, COUNT(*) AS cnt
    FROM song_downloads sd
    WHERE sd.created_at >= now() - interval '7 days'
    GROUP BY sd.song_id
  )
  SELECT
    s.id AS song_id,
    s.title,
    s.cover_url,
    s.file_url,
    a.name AS artist_name,
    a.id AS artist_id,
    COALESCE(wp.cnt, 0) AS weekly_plays,
    COALESCE(wd.cnt, 0) AS weekly_downloads,
    COALESCE(wp.cnt, 0) + COALESCE(wd.cnt, 0) AS total_score
  FROM songs s
  JOIN artists a ON a.id = s.artist_id
  LEFT JOIN weekly_plays wp ON wp.id = s.id
  LEFT JOIN weekly_downloads wd ON wd.id = s.id
  WHERE s.is_approved = true
  ORDER BY total_score DESC, s.play_count DESC
  LIMIT lim;
$$;
