CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  video_type text NOT NULL DEFAULT 'music_video',
  artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  uploaded_by uuid,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view published videos
CREATE POLICY "Published videos viewable by everyone"
  ON public.videos FOR SELECT TO public
  USING (is_published = true);

-- Admins can view all videos
CREATE POLICY "Admins can view all videos"
  ON public.videos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can upload videos
CREATE POLICY "Authenticated users can upload videos"
  ON public.videos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Uploaders can update own videos
CREATE POLICY "Uploaders can update own videos"
  ON public.videos FOR UPDATE TO public
  USING (auth.uid() = uploaded_by);

-- Admins can manage all videos
CREATE POLICY "Admins can manage all videos"
  ON public.videos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Uploaders can delete own videos
CREATE POLICY "Uploaders can delete own videos"
  ON public.videos FOR DELETE TO public
  USING (auth.uid() = uploaded_by);

-- Timestamp trigger
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();