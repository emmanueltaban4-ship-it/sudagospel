
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'homepage_banner',
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  click_count INTEGER NOT NULL DEFAULT 0,
  impression_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ads viewable by everyone" ON public.ads FOR SELECT TO public USING (true);
CREATE POLICY "Admins can create ads" ON public.ads FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ads" ON public.ads FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete ads" ON public.ads FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true);

CREATE POLICY "Anyone can view ad images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'ads');
CREATE POLICY "Admins can upload ad images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ad images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete ad images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));
