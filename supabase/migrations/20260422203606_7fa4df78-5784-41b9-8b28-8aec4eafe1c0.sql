ALTER FUNCTION public.get_artist_balance(UUID) SET search_path = public;
ALTER FUNCTION public.is_song_purchased(UUID, UUID) SET search_path = public;
ALTER FUNCTION public.is_active_supporter(UUID, UUID) SET search_path = public;
ALTER FUNCTION public.admin_artists_with_balance() SET search_path = public;