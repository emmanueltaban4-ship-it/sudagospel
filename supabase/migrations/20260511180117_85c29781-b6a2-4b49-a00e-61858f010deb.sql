-- Make music bucket private. Cover bucket stays public (low-risk artwork).
update storage.buckets set public = false where id = 'music';

-- Storage RLS on objects already enabled. Add explicit policies for music bucket.
drop policy if exists "Admins read music" on storage.objects;
drop policy if exists "Owners read music" on storage.objects;

create policy "Admins read music"
on storage.objects for select
using (bucket_id = 'music' and public.has_role(auth.uid(), 'admin'));

create policy "Owners read music"
on storage.objects for select
using (bucket_id = 'music' and auth.uid()::text = (storage.foldername(name))[1]);

-- Note: anonymous/general listeners cannot SELECT directly. They obtain
-- short-lived signed URLs via the sign-media-url edge function, which uses
-- the service role key after validating the song is approved + published.
