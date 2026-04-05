INSERT INTO storage.buckets (id, name, public) VALUES ('email-assets', 'email-assets', true);

CREATE POLICY "Anyone can read email assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-assets');

CREATE POLICY "Admins can upload email assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-assets');