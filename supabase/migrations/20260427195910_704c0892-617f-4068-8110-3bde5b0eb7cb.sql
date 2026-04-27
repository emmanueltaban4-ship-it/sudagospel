
-- 1. Add approval columns to artists
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Validate allowed status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'artists_status_check'
  ) THEN
    ALTER TABLE public.artists
      ADD CONSTRAINT artists_status_check
      CHECK (status IN ('pending','approved','rejected'));
  END IF;
END $$;

-- 2. Backfill: keep all existing artists working
UPDATE public.artists SET status = 'approved' WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_artists_status ON public.artists(status);

-- 3. Helper function used by RLS to check approval
CREATE OR REPLACE FUNCTION public.is_artist_approved(_artist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.artists
    WHERE id = _artist_id AND status = 'approved'
  );
$$;

-- 4. Update artists SELECT policy: public sees only approved; owner & admin see all
DROP POLICY IF EXISTS "Artists viewable by everyone" ON public.artists;

CREATE POLICY "Approved artists viewable by everyone"
  ON public.artists
  FOR SELECT
  USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 5. Tighten songs INSERT policy — only approved artists can upload
DROP POLICY IF EXISTS "Authenticated users can upload songs" ON public.songs;

CREATE POLICY "Approved artists can upload songs"
  ON public.songs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR public.is_artist_approved(artist_id)
    )
  );

-- 6. Notify artist owner on status change
CREATE OR REPLACE FUNCTION public.notify_artist_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.user_id IS NOT NULL THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        '🎉 Artist approved',
        'Your artist profile "' || NEW.name || '" has been approved. You can now upload music.',
        'success',
        '/artist-dashboard'
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        'Artist application update',
        'Your artist profile "' || NEW.name || '" was not approved.'
          || COALESCE(' Reason: ' || NEW.rejection_reason, ''),
        'warning',
        '/profile'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_artist_status_change ON public.artists;
CREATE TRIGGER trg_notify_artist_status_change
AFTER UPDATE ON public.artists
FOR EACH ROW
EXECUTE FUNCTION public.notify_artist_status_change();
