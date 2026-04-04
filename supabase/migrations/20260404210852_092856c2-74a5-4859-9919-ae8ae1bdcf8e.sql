-- Artist follows table
CREATE TABLE public.artist_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, artist_id)
);

-- Enable RLS
ALTER TABLE public.artist_follows ENABLE ROW LEVEL SECURITY;

-- Anyone can see follow counts
CREATE POLICY "Follows viewable by everyone" ON public.artist_follows
  FOR SELECT USING (true);

-- Authenticated users can follow artists
CREATE POLICY "Users can follow artists" ON public.artist_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow artists" ON public.artist_follows
  FOR DELETE USING (auth.uid() = user_id);

-- Add account_type to profiles for role-based registration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'fan';

-- Enable realtime for follows
ALTER PUBLICATION supabase_realtime ADD TABLE public.artist_follows;