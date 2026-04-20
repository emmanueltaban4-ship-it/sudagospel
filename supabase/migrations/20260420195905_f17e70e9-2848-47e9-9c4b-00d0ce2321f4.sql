
CREATE TABLE public.song_reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, song_id)
);
CREATE INDEX idx_song_reposts_user ON public.song_reposts(user_id, created_at DESC);
CREATE INDEX idx_song_reposts_song ON public.song_reposts(song_id);
ALTER TABLE public.song_reposts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reposts viewable by everyone" ON public.song_reposts FOR SELECT USING (true);
CREATE POLICY "Users can repost" ON public.song_reposts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reposts" ON public.song_reposts FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.user_listening_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_listening_user_time ON public.user_listening_history(user_id, played_at DESC);
CREATE INDEX idx_listening_song ON public.user_listening_history(song_id);
ALTER TABLE public.user_listening_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own history" ON public.user_listening_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own history" ON public.user_listening_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own history" ON public.user_listening_history FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.song_comments ADD COLUMN parent_id UUID REFERENCES public.song_comments(id) ON DELETE CASCADE;
CREATE INDEX idx_song_comments_parent ON public.song_comments(parent_id);

CREATE OR REPLACE FUNCTION public.get_trending_songs(period TEXT DEFAULT 'week', genre_filter TEXT DEFAULT NULL, lim INT DEFAULT 50)
RETURNS TABLE(song_id UUID, title TEXT, cover_url TEXT, file_url TEXT, artist_id UUID, artist_name TEXT, genre TEXT, plays BIGINT, likes BIGINT, downloads BIGINT, score BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ws AS (SELECT CASE period WHEN 'day' THEN now()-interval '1 day' WHEN 'week' THEN now()-interval '7 days' WHEN 'month' THEN now()-interval '30 days' ELSE now()-interval '7 days' END AS ts),
  p AS (SELECT h.song_id, COUNT(*) AS c FROM user_listening_history h, ws WHERE h.played_at >= ws.ts GROUP BY h.song_id),
  l AS (SELECT sl.song_id, COUNT(*) AS c FROM song_likes sl, ws WHERE sl.created_at >= ws.ts GROUP BY sl.song_id),
  d AS (SELECT sd.song_id, COUNT(*) AS c FROM song_downloads sd, ws WHERE sd.created_at >= ws.ts GROUP BY sd.song_id),
  agg AS (
    SELECT s.id AS song_id, s.title, s.cover_url, s.file_url, a.id AS artist_id, a.name AS artist_name, s.genre,
      COALESCE(p.c,0) AS plays, COALESCE(l.c,0) AS likes, COALESCE(d.c,0) AS downloads,
      COALESCE(p.c,0) + COALESCE(l.c,0)*2 + COALESCE(d.c,0)*3 AS score, s.play_count
    FROM songs s JOIN artists a ON a.id = s.artist_id
    LEFT JOIN p ON p.song_id = s.id LEFT JOIN l ON l.song_id = s.id LEFT JOIN d ON d.song_id = s.id
    WHERE s.is_approved = true AND s.release_status = 'published' AND (genre_filter IS NULL OR s.genre = genre_filter)
  )
  SELECT song_id, title, cover_url, file_url, artist_id, artist_name, genre, plays, likes, downloads, score
  FROM agg ORDER BY score DESC NULLS LAST, play_count DESC NULLS LAST LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_mix(_user_id UUID, lim INT DEFAULT 30)
RETURNS TABLE(song_id UUID, title TEXT, cover_url TEXT, file_url TEXT, artist_id UUID, artist_name TEXT, genre TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH fa AS (SELECT s.artist_id, COUNT(*) c FROM user_listening_history h JOIN songs s ON s.id=h.song_id WHERE h.user_id=_user_id AND h.played_at > now()-interval '60 days' GROUP BY s.artist_id ORDER BY c DESC LIMIT 10),
  fg AS (SELECT s.genre, COUNT(*) c FROM user_listening_history h JOIN songs s ON s.id=h.song_id WHERE h.user_id=_user_id AND h.played_at > now()-interval '60 days' AND s.genre IS NOT NULL GROUP BY s.genre ORDER BY c DESC LIMIT 5),
  rs AS (SELECT song_id FROM user_listening_history WHERE user_id=_user_id AND played_at > now()-interval '7 days')
  SELECT s.id, s.title, s.cover_url, s.file_url, a.id, a.name, s.genre
  FROM songs s JOIN artists a ON a.id=s.artist_id
  WHERE s.is_approved=true AND s.release_status='published' AND s.id NOT IN (SELECT song_id FROM rs)
    AND (s.artist_id IN (SELECT artist_id FROM fa) OR s.genre IN (SELECT genre FROM fg))
  ORDER BY random() LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION public.get_artist_radio(_artist_id UUID, lim INT DEFAULT 30)
RETURNS TABLE(song_id UUID, title TEXT, cover_url TEXT, file_url TEXT, artist_id UUID, artist_name TEXT, genre TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ag AS (SELECT DISTINCT genre FROM songs WHERE artist_id=_artist_id AND genre IS NOT NULL),
  combined AS (
    SELECT s.id AS song_id, s.title, s.cover_url, s.file_url, a.id AS artist_id, a.name AS artist_name, s.genre, 0 AS sort_pri, random() AS r
    FROM songs s JOIN artists a ON a.id=s.artist_id
    WHERE s.artist_id=_artist_id AND s.is_approved=true AND s.release_status='published'
    UNION
    SELECT s.id, s.title, s.cover_url, s.file_url, a.id, a.name, s.genre, 1 AS sort_pri, random() AS r
    FROM songs s JOIN artists a ON a.id=s.artist_id
    WHERE s.artist_id<>_artist_id AND s.is_approved=true AND s.release_status='published' AND s.genre IN (SELECT genre FROM ag)
  )
  SELECT song_id, title, cover_url, file_url, artist_id, artist_name, genre FROM combined ORDER BY sort_pri, r LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION public.get_for_you_feed(_user_id UUID, lim INT DEFAULT 40)
RETURNS TABLE(feed_type TEXT, song_id UUID, title TEXT, cover_url TEXT, file_url TEXT, artist_id UUID, artist_name TEXT, actor_id UUID, actor_name TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH combined AS (
    SELECT 'new_release'::TEXT AS feed_type, s.id AS song_id, s.title, s.cover_url, s.file_url, a.id AS artist_id, a.name AS artist_name, NULL::UUID AS actor_id, NULL::TEXT AS actor_name, s.created_at
    FROM songs s JOIN artists a ON a.id=s.artist_id
    JOIN artist_follows af ON af.artist_id=a.id AND af.user_id=_user_id
    WHERE s.is_approved=true AND s.release_status='published' AND s.created_at > now()-interval '30 days'
    UNION ALL
    SELECT 'repost'::TEXT, s.id, s.title, s.cover_url, s.file_url, a.id, a.name, p.user_id, p.display_name, r.created_at
    FROM song_reposts r
    JOIN songs s ON s.id=r.song_id
    JOIN artists a ON a.id=s.artist_id
    JOIN profiles p ON p.user_id=r.user_id
    WHERE s.is_approved=true AND r.created_at > now()-interval '30 days'
      AND EXISTS (SELECT 1 FROM artist_follows af JOIN artists a2 ON a2.id=af.artist_id WHERE af.user_id=_user_id AND a2.user_id=r.user_id)
  )
  SELECT feed_type, song_id, title, cover_url, file_url, artist_id, artist_name, actor_id, actor_name, created_at
  FROM combined ORDER BY created_at DESC LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_follow() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE artist_owner UUID; aname TEXT; fname TEXT;
BEGIN
  SELECT user_id, name INTO artist_owner, aname FROM artists WHERE id = NEW.artist_id;
  IF artist_owner IS NULL OR artist_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT display_name INTO fname FROM profiles WHERE user_id = NEW.user_id;
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (artist_owner, 'New follower', COALESCE(fname,'Someone') || ' is now following ' || aname, 'follow', '/artist-dashboard');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.artist_follows FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

CREATE OR REPLACE FUNCTION public.notify_on_repost() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner UUID; stitle TEXT; rname TEXT;
BEGIN
  SELECT uploaded_by, title INTO owner, stitle FROM songs WHERE id = NEW.song_id;
  IF owner IS NULL OR owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT display_name INTO rname FROM profiles WHERE user_id = NEW.user_id;
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (owner, 'New repost', COALESCE(rname,'Someone') || ' reposted "' || stitle || '"', 'repost', '/song/' || NEW.song_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_repost AFTER INSERT ON public.song_reposts FOR EACH ROW EXECUTE FUNCTION public.notify_on_repost();

CREATE OR REPLACE FUNCTION public.notify_on_reply() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE puser UUID; rname TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id INTO puser FROM song_comments WHERE id = NEW.parent_id;
  IF puser IS NULL OR puser = NEW.user_id THEN RETURN NEW; END IF;
  SELECT display_name INTO rname FROM profiles WHERE user_id = NEW.user_id;
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (puser, 'New reply', COALESCE(rname,'Someone') || ' replied to your comment', 'reply', '/song/' || NEW.song_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_reply AFTER INSERT ON public.song_comments FOR EACH ROW EXECUTE FUNCTION public.notify_on_reply();

CREATE OR REPLACE FUNCTION public.notify_followers_new_song() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE aname TEXT;
BEGIN
  IF NEW.is_approved = true AND NEW.release_status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.is_approved IS DISTINCT FROM NEW.is_approved OR OLD.release_status IS DISTINCT FROM NEW.release_status) THEN
    SELECT name INTO aname FROM artists WHERE id = NEW.artist_id;
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT af.user_id, 'New release', aname || ' released "' || NEW.title || '"', 'new_release', '/song/' || NEW.id
    FROM artist_follows af WHERE af.artist_id = NEW.artist_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_followers_new_song AFTER INSERT OR UPDATE ON public.songs FOR EACH ROW EXECUTE FUNCTION public.notify_followers_new_song();
