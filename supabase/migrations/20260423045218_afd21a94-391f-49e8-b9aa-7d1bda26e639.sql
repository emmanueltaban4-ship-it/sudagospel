-- 1. Artist social links
CREATE TABLE public.artist_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_artist_social_links_artist ON public.artist_social_links(artist_id);
ALTER TABLE public.artist_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social links viewable by everyone" ON public.artist_social_links
  FOR SELECT USING (true);
CREATE POLICY "Artists manage own social links" ON public.artist_social_links
  FOR ALL USING (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_social_links.artist_id AND artists.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_social_links.artist_id AND artists.user_id = auth.uid()));
CREATE POLICY "Admins manage all social links" ON public.artist_social_links
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_artist_social_links_updated_at
  BEFORE UPDATE ON public.artist_social_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Artist collaborators
CREATE TABLE public.artist_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  collaborator_user_id UUID,
  collaborator_email TEXT NOT NULL,
  collaborator_name TEXT,
  role TEXT NOT NULL DEFAULT 'featured',
  split_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (split_percent >= 0 AND split_percent <= 100),
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_collab_artist ON public.artist_collaborators(artist_id);
CREATE INDEX idx_collab_user ON public.artist_collaborators(collaborator_user_id);
CREATE INDEX idx_collab_email ON public.artist_collaborators(collaborator_email);
ALTER TABLE public.artist_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artist owner manages collaborators" ON public.artist_collaborators
  FOR ALL USING (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_collaborators.artist_id AND artists.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_collaborators.artist_id AND artists.user_id = auth.uid()));
CREATE POLICY "Collaborator views own invites" ON public.artist_collaborators
  FOR SELECT USING (collaborator_user_id = auth.uid());
CREATE POLICY "Collaborator can update own invite status" ON public.artist_collaborators
  FOR UPDATE USING (collaborator_user_id = auth.uid()) WITH CHECK (collaborator_user_id = auth.uid());
CREATE POLICY "Admins manage all collaborators" ON public.artist_collaborators
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_artist_collaborators_updated_at
  BEFORE UPDATE ON public.artist_collaborators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Ownership claims (DMCA-style)
CREATE TABLE public.ownership_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL,
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'ownership',
  description TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_claims_song ON public.ownership_claims(song_id);
CREATE INDEX idx_claims_claimant ON public.ownership_claims(claimant_id);
CREATE INDEX idx_claims_status ON public.ownership_claims(status);
ALTER TABLE public.ownership_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claimants view own claims" ON public.ownership_claims
  FOR SELECT USING (claimant_id = auth.uid());
CREATE POLICY "Claimants create claims" ON public.ownership_claims
  FOR INSERT WITH CHECK (claimant_id = auth.uid());
CREATE POLICY "Song uploader views claims on their songs" ON public.ownership_claims
  FOR SELECT USING (EXISTS (SELECT 1 FROM songs WHERE songs.id = ownership_claims.song_id AND songs.uploaded_by = auth.uid()));
CREATE POLICY "Admins manage all claims" ON public.ownership_claims
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ownership_claims_updated_at
  BEFORE UPDATE ON public.ownership_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();