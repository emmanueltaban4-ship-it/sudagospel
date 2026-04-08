

# Full Album System Enhancement

## Summary
The album infrastructure (table, detail page, basic CRUD) already exists. This plan adds: (1) album type support (Album/EP/Single), (2) cover art upload for albums, (3) release date picker, (4) total duration calculation on the album detail page, (5) "Download All" button, and (6) better album creation flow in both the profile page and upload page.

## What Changes

### 1. Database: Add `album_type` Column
Add an `album_type` text column to the `albums` table with values: `album`, `ep`, `single`. Default: `album`.

**Migration:**
```sql
ALTER TABLE public.albums ADD COLUMN album_type text NOT NULL DEFAULT 'album';
```

### 2. Album Creation with Cover Art Upload (Profile Page)
Enhance the existing album creation form on `src/pages/ProfilePage.tsx`:
- Add cover image upload (to `covers` bucket)
- Add release date picker
- Add album type selector (Album / EP / Single)
- Show album type badge on album cards

### 3. Upload Page: Create Album Inline
On `src/pages/UploadPage.tsx`, add a "New Album" option in the album dropdown that opens an inline form to create an album (with cover, type, release date) before uploading the song.

### 4. Album Detail Page Enhancements (`src/pages/AlbumDetailPage.tsx`)
- Show album type badge (Album / EP / Single)
- Calculate and display total duration from all songs' `duration_seconds`
- Add "Download All" button that downloads each track sequentially
- Show track numbers properly

### 5. Artist Detail Page: Better Album Display
On `src/pages/ArtistDetailPage.tsx`, ensure the albums tab shows album type badges and links to album detail pages with cover art.

### 6. Admin Album Management
Update `src/components/admin/AdminAlbumManagement.tsx` to show and edit album type.

## Technical Details

### Database migration
Single migration adding `album_type` column to `albums`.

### Cover art upload flow
Reuse the existing `covers` storage bucket. On album creation, upload the image and store the public URL in `albums.cover_url`.

### Total duration calculation
Sum `duration_seconds` from all songs in the album query result, displayed as "X min Y sec".

### Download All
Iterate through tracks, fetch each blob, and trigger downloads with a small delay between each to avoid browser blocking.

### Files to modify
- **New migration** — add `album_type` to `albums`
- `src/pages/ProfilePage.tsx` — enhanced album create form with cover upload, type, release date
- `src/pages/UploadPage.tsx` — inline album creation option
- `src/pages/AlbumDetailPage.tsx` — total duration, download all, album type badge
- `src/pages/ArtistDetailPage.tsx` — album type badges in albums tab
- `src/components/admin/AdminAlbumManagement.tsx` — album type column and edit

