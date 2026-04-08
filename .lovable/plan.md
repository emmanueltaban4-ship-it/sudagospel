
# Upgraded Upload Experience + Scheduled Releases

## Summary
Replace the current single-form upload page with a polished multi-step wizard. Add scheduled release support with countdown timers and follower notifications via email.

## What Changes

### 1. Database: Add `scheduled_release_at` and `release_status` to Songs
- `scheduled_release_at` (timestamptz, nullable) — future publish date
- `release_status` (text, default 'published') — values: `draft`, `scheduled`, `published`
- Songs with `release_status = 'scheduled'` are hidden until the scheduled date
- Update the SELECT RLS policy so scheduled songs are only visible to the uploader/admin until release

**Migration:**
```sql
ALTER TABLE public.songs ADD COLUMN scheduled_release_at timestamptz;
ALTER TABLE public.songs ADD COLUMN release_status text NOT NULL DEFAULT 'published';
```

### 2. Multi-Step Upload Wizard (`src/pages/UploadPage.tsx`)
Rewrite as a 4-step wizard with progress indicator:

**Step 1 — Audio File**
- Drag & drop or click to upload audio (MP3, WAV)
- Show file name, size, duration preview
- Visual upload progress

**Step 2 — Cover Artwork**
- Upload cover image with live preview
- Square aspect ratio guidance

**Step 3 — Metadata**
- Title, Description, Genre selector, Lyrics
- Artist selector (with create-new inline)
- Album selector (with create-new inline, including type/cover)

**Step 4 — Release Options**
- Choose: Publish Now or Schedule Release
- If scheduled: date/time picker for future release
- Summary card showing all entered info
- Submit button

### 3. Countdown Timer Component (`src/components/CountdownTimer.tsx`)
- Shows days/hours/minutes/seconds until release
- Used on song detail page and in song cards for scheduled songs
- Animated, clean design

### 4. Scheduled Release Display
- Song detail page shows countdown for upcoming releases
- Song cards show "Coming Soon" badge with countdown
- Home page "New Releases" can show upcoming scheduled songs

### 5. Edge Function: Auto-Publish Scheduled Songs
- `publish-scheduled-songs` edge function triggered by pg_cron every minute
- Checks for songs where `scheduled_release_at <= now()` and `release_status = 'scheduled'`
- Updates them to `release_status = 'published'` and `is_approved = true`

### 6. Edge Function: Notify Followers
- When a song gets published (either immediately or via schedule), notify followers
- Query `artist_follows` for the artist, send notification emails
- Uses the existing email infrastructure if configured, otherwise stores in a notifications approach

## Files to Create/Modify
- **New migration** — `scheduled_release_at` + `release_status` columns, updated RLS
- `src/pages/UploadPage.tsx` — Complete rewrite as multi-step wizard
- `src/components/CountdownTimer.tsx` — New countdown component
- `src/pages/SongDetailPage.tsx` — Show countdown for scheduled songs
- `supabase/functions/publish-scheduled-songs/index.ts` — Auto-publish cron function
- pg_cron job for auto-publishing

## Technical Details
- Wizard state managed with useState, step transitions with framer-motion
- Audio file duration extracted via Web Audio API on upload
- Countdown uses `setInterval` with 1-second ticks
- Scheduled songs visible only to uploader until release date
