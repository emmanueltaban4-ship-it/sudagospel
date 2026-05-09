
-- ============ SERMONS ============
CREATE TABLE public.sermons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  uploaded_by UUID,
  title TEXT NOT NULL,
  description TEXT,
  preacher TEXT,
  series TEXT,
  scripture_ref TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration_seconds INTEGER,
  play_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sermons viewable by all" ON public.sermons FOR SELECT USING (is_published = true OR auth.uid() = uploaded_by OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Approved artists or admins create sermons" ON public.sermons FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by AND (has_role(auth.uid(),'admin'::app_role) OR artist_id IS NULL OR is_artist_approved(artist_id)));
CREATE POLICY "Owners update sermons" ON public.sermons FOR UPDATE USING (auth.uid() = uploaded_by OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Owners delete sermons" ON public.sermons FOR DELETE USING (auth.uid() = uploaded_by OR has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_sermons_upd BEFORE UPDATE ON public.sermons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_sermons_published ON public.sermons(is_published, published_at DESC);

-- ============ EVENTS ============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  created_by UUID,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  city TEXT,
  country TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  cover_url TEXT,
  ticket_url TEXT,
  price_text TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all" ON public.events FOR SELECT USING (is_published = true OR auth.uid() = created_by OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Approved artists or admins create events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND (has_role(auth.uid(),'admin'::app_role) OR (artist_id IS NOT NULL AND is_artist_approved(artist_id))));
CREATE POLICY "Owners update events" ON public.events FOR UPDATE USING (auth.uid() = created_by OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Owners delete events" ON public.events FOR DELETE USING (auth.uid() = created_by OR has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_events_upd BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_events_starts ON public.events(starts_at);

-- ============ PRAYER WALL ============
CREATE TABLE public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  prayer_count INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public prayer requests visible" ON public.prayer_requests FOR SELECT USING (is_hidden = false OR auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Auth users post requests" ON public.prayer_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates own request" ON public.prayer_requests FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Owner or admin deletes" ON public.prayer_requests FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_prayer_upd BEFORE UPDATE ON public.prayer_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.prayer_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);
ALTER TABLE public.prayer_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions visible to all" ON public.prayer_reactions FOR SELECT USING (true);
CREATE POLICY "Auth users react" ON public.prayer_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users unreact" ON public.prayer_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.bump_prayer_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE prayer_requests SET prayer_count = prayer_count + 1 WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE prayer_requests SET prayer_count = GREATEST(prayer_count - 1, 0) WHERE id = OLD.request_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_prayer_bump AFTER INSERT OR DELETE ON public.prayer_reactions FOR EACH ROW EXECUTE FUNCTION public.bump_prayer_count();

-- ============ DEVOTIONALS ============
CREATE TABLE public.devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scripture_ref TEXT,
  scripture_text TEXT,
  image_url TEXT,
  author TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Devotionals public" ON public.devotionals FOR SELECT USING (is_published = true OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage devotionals" ON public.devotionals FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_dev_upd BEFORE UPDATE ON public.devotionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MOODS ============
CREATE TABLE public.moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  color TEXT DEFAULT '#DC2626',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Moods public" ON public.moods FOR SELECT USING (is_active = true OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage moods" ON public.moods FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_moods_upd BEFORE UPDATE ON public.moods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.mood_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mood_id UUID NOT NULL REFERENCES public.moods(id) ON DELETE CASCADE,
  song_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mood_id, song_id)
);
ALTER TABLE public.mood_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mood songs public" ON public.mood_songs FOR SELECT USING (true);
CREATE POLICY "Admins manage mood songs" ON public.mood_songs FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Seed default moods
INSERT INTO public.moods (slug, name, description, color, position) VALUES
('worship','Worship','Reverent songs to draw close to God','#7C3AED',1),
('praise','Praise','Upbeat songs of celebration','#DC2626',2),
('prayer','Prayer','Quiet, reflective songs for intercession','#0EA5E9',3),
('thanksgiving','Thanksgiving','Songs of gratitude','#F59E0B',4),
('healing','Healing','Songs of comfort and restoration','#10B981',5),
('sunday-service','Sunday Service','Anthems for congregational worship','#EF4444',6);

-- Add scripture_refs to songs for lyrics tab
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS scripture_refs TEXT;

-- Seed default site_settings rows used by features
INSERT INTO public.site_settings (key, value) VALUES
('live_radio_url',''),('live_radio_title','Sudagospel Live'),('live_radio_enabled','false')
ON CONFLICT (key) DO NOTHING;
