-- Add UPDATE and DELETE policies for avatars bucket
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Add UPDATE and DELETE policies for covers bucket
CREATE POLICY "Users can update own covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'covers' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'covers' AND (auth.uid())::text = (storage.foldername(name))[1]);