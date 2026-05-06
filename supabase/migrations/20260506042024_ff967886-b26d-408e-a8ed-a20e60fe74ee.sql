
-- Performance indexes for high-traffic queries

-- Approved + published feed (Home, ForYou, MusicPage) sorted by created_at
CREATE INDEX IF NOT EXISTS idx_songs_published_created
  ON public.songs (created_at DESC)
  WHERE is_approved = true AND release_status = 'published';

-- Approved songs by artist, newest first (artist detail page)
CREATE INDEX IF NOT EXISTS idx_songs_artist_published_created
  ON public.songs (artist_id, created_at DESC)
  WHERE is_approved = true AND release_status = 'published';

-- Genre filter for trending / browse
CREATE INDEX IF NOT EXISTS idx_songs_genre_published
  ON public.songs (genre, created_at DESC)
  WHERE is_approved = true AND release_status = 'published';

-- Scheduled publish job lookup
CREATE INDEX IF NOT EXISTS idx_songs_scheduled
  ON public.songs (scheduled_release_at)
  WHERE release_status = 'scheduled';

-- Comments per song, threaded chronologically
CREATE INDEX IF NOT EXISTS idx_song_comments_song_created
  ON public.song_comments (song_id, created_at DESC);

-- Listening history lookups by user (most-recent)
CREATE INDEX IF NOT EXISTS idx_listening_user_played
  ON public.user_listening_history (user_id, played_at DESC);

-- Playlist songs by position
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_position
  ON public.playlist_songs (playlist_id, "position");

-- User downloads history
CREATE INDEX IF NOT EXISTS idx_song_downloads_user_created
  ON public.song_downloads (user_id, created_at DESC);

-- Active boosts lookup (homepage feature)
CREATE INDEX IF NOT EXISTS idx_song_boosts_active
  ON public.song_boosts (song_id, ends_at)
  WHERE status = 'active';

-- Notifications: user_id + created_at for inbox
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

-- Artist follows reverse lookup (followers of artist)
CREATE INDEX IF NOT EXISTS idx_artist_follows_artist
  ON public.artist_follows (artist_id);

-- Supporter subs status checks
CREATE INDEX IF NOT EXISTS idx_supporter_subs_user_artist
  ON public.supporter_subscriptions (user_id, artist_id, status);
