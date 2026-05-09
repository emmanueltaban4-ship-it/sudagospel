
-- 1. Referrals: restrict reads to owner / admin
DROP POLICY IF EXISTS "Anyone reads referrals" ON public.referrals;
CREATE POLICY "Owner reads own referral" ON public.referrals
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2. Ownership claims: drop the policy that exposed admin_notes & claimant emails to uploaders
DROP POLICY IF EXISTS "Song uploader views claims on their songs" ON public.ownership_claims;

-- 3. RPCs: prevent cross-user enumeration
CREATE OR REPLACE FUNCTION public.is_song_purchased(_song_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM _user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.paid_downloads WHERE song_id = _song_id AND user_id = _user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_active_supporter(_artist_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM _user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.supporter_subscriptions
    WHERE artist_id = _artist_id AND user_id = _user_id
      AND status = 'active' AND (current_period_end IS NULL OR current_period_end > now())
  );
END;
$$;

-- 4. Email-assets bucket: lock writes to admins
DROP POLICY IF EXISTS "Admins can upload email assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update email assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete email assets" ON storage.objects;

CREATE POLICY "Admins upload email assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update email assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete email assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'));

-- 5. Music bucket: explicit owner-scoped UPDATE policy
DROP POLICY IF EXISTS "Music owners update own files" ON storage.objects;
CREATE POLICY "Music owners update own files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'music' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'music' AND owner = auth.uid());
