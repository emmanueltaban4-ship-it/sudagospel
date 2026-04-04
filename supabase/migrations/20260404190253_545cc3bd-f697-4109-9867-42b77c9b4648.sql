INSERT INTO storage.buckets (id, name, public) VALUES ('blog-covers', 'blog-covers', true);

CREATE POLICY "Anyone can view blog covers"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blog-covers');

CREATE POLICY "Admins can upload blog covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-covers' AND public.has_role(auth.uid(), 'admin'));