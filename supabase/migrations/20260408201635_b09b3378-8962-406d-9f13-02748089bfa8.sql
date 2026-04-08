CREATE TABLE public.song_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  boost_type text NOT NULL DEFAULT 'homepage',
  status text NOT NULL DEFAULT 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.song_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active boosts viewable by everyone"
  ON public.song_boosts FOR SELECT TO public
  USING (status = 'active');

CREATE POLICY "Users can view own boosts"
  ON public.song_boosts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create boosts"
  ON public.song_boosts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all boosts"
  ON public.song_boosts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_song_boosts_updated_at
  BEFORE UPDATE ON public.song_boosts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();