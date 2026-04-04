-- Site settings key-value store
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete site settings"
  ON public.site_settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Featured content for homepage control
CREATE TABLE public.featured_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read featured content"
  ON public.featured_content FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert featured content"
  ON public.featured_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update featured content"
  ON public.featured_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete featured content"
  ON public.featured_content FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'Sudagospel'),
  ('tagline', 'South Sudan''s Premier Gospel Music Platform'),
  ('logo_url', ''),
  ('footer_text', '© 2026 Sudagospel.net. All rights reserved.'),
  ('hero_quote', '"Make a joyful noise unto the Lord, all the earth." — Psalm 98:4');