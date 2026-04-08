CREATE INDEX IF NOT EXISTS idx_songs_approved_created ON public.songs (is_approved, created_at DESC) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON public.songs (artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_play_count ON public.songs (play_count DESC NULLS LAST) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_songs_album_id ON public.songs (album_id) WHERE album_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_song_likes_user ON public.song_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_song_likes_song_user ON public.song_likes (song_id, user_id);

CREATE INDEX IF NOT EXISTS idx_song_downloads_song_created ON public.song_downloads (song_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_artist_follows_user_artist ON public.artist_follows (user_id, artist_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles (is_published, published_at DESC) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_videos_published_type ON public.videos (is_published, video_type) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_song_boosts_status ON public.song_boosts (status, ends_at) WHERE status = 'active';