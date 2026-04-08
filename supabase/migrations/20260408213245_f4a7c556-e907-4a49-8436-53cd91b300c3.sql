CREATE OR REPLACE FUNCTION public.increment_play_count(song_uuid uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE songs SET play_count = COALESCE(play_count, 0) + 1 WHERE id = song_uuid;
$$;

CREATE OR REPLACE FUNCTION public.increment_download_count(song_uuid uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE songs SET download_count = COALESCE(download_count, 0) + 1 WHERE id = song_uuid;
$$;