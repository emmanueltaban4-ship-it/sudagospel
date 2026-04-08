

# Play/Download Count Tracking + Artist Video Sharing

## Summary
Add real-time play count and download count incrementing for songs, and give artists the ability to upload/manage their own videos from their profile page.

## What Changes

### 1. Increment Play Count When a Song Plays
Currently `play_count` on the `songs` table is never incremented. Add a database function `increment_play_count(song_id)` and call it from the player when a new track starts playing.

**Database migration:**
- Create `increment_play_count(song_uuid)` — SQL function that does `UPDATE songs SET play_count = COALESCE(play_count, 0) + 1 WHERE id = song_uuid`, with `SECURITY DEFINER` so any user (even anonymous via anon key) can increment.

**Code change:**
- `src/hooks/use-player.tsx` — In `playTrack()`, after setting the audio source, call `supabase.rpc('increment_play_count', { song_uuid: track.id })` (fire-and-forget).

### 2. Increment Download Count on Download
Currently the download logs to `song_downloads` table but never updates the `download_count` column on `songs`.

**Database migration:**
- Create `increment_download_count(song_uuid)` — same pattern as play count.

**Code change:**
- `src/pages/SongDetailPage.tsx` — In `handleDownload`, also call `supabase.rpc('increment_download_count', { song_uuid: song.id })`.

### 3. Artist Video Management on Profile Page
Give artists a "Videos" tab on their profile page where they can add, edit, and delete their own videos (music videos, interviews, etc.). The `videos` table already has `uploaded_by` and artist RLS policies.

**Code change — `src/pages/ProfilePage.tsx`:**
- Add a "Videos" tab to the artist section (alongside Songs, Albums, Settings)
- List artist's videos with title, type, view count
- Add video form: title, YouTube/video URL, description, thumbnail URL, video type selector
- Edit/delete existing videos
- Videos use `uploaded_by = user.id` and `artist_id = artist.id`

## Technical Details

### DB Functions (single migration)
```sql
CREATE OR REPLACE FUNCTION public.increment_play_count(song_uuid uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE songs SET play_count = COALESCE(play_count, 0) + 1 WHERE id = song_uuid;
$$;

CREATE OR REPLACE FUNCTION public.increment_download_count(song_uuid uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE songs SET download_count = COALESCE(download_count, 0) + 1 WHERE id = song_uuid;
$$;
```

### Player integration
```typescript
// In playTrack callback, fire-and-forget
supabase.rpc('increment_play_count', { song_uuid: track.id });
```

### Files to modify
- **New migration** — two increment functions
- `src/hooks/use-player.tsx` — add supabase import + rpc call in `playTrack`
- `src/pages/SongDetailPage.tsx` — add download count rpc call
- `src/pages/ProfilePage.tsx` — add Videos tab with CRUD for artist videos

