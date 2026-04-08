
ALTER TABLE public.songs ADD COLUMN scheduled_release_at timestamptz;
ALTER TABLE public.songs ADD COLUMN release_status text NOT NULL DEFAULT 'published';

-- Update the SELECT policy to hide scheduled songs from public until release time
DROP POLICY IF EXISTS "Songs viewable by everyone or admin" ON public.songs;
CREATE POLICY "Songs viewable by everyone or admin" ON public.songs
FOR SELECT USING (
  (is_approved = true AND (release_status = 'published' OR (release_status = 'scheduled' AND scheduled_release_at <= now())))
  OR auth.uid() = uploaded_by
  OR has_role(auth.uid(), 'admin'::app_role)
);
