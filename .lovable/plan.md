

# Share Links, Light/Dark Mode, and Admin Video Management

## Summary
Three changes: (1) hardcode share URLs to `https://sudagospel.com` instead of `window.location.origin`, (2) ensure the existing light/dark mode toggle works properly with full theme support, and (3) add a Video Content Management tab to the admin dashboard.

## What Changes

### 1. Share Links → sudagospel.com Domain
Replace `window.location.origin` with `https://sudagospel.com` in all share URL constructions.

**Files to edit:**
- `src/pages/SongDetailPage.tsx` — change `ogShareUrl`
- `src/components/FullScreenPlayer.tsx` — change `shareUrl`
- `src/pages/ArtistDetailPage.tsx` — change `artistShareUrl`

### 2. Light/Dark Mode
The app already has `next-themes` ThemeProvider (defaultTheme="dark") and a ThemeToggle component in the TopBar. This is already functional. I will verify the CSS supports both themes properly and ensure the toggle is also accessible on mobile (add it to BottomNav or a settings area if missing).

**Files to review/edit:**
- `src/index.css` — ensure light theme CSS variables are properly defined
- `src/components/BottomNav.tsx` — optionally add theme toggle access on mobile

### 3. Admin Video Content Management
Add a new "Videos" tab to the admin dashboard for managing video content (music videos, interviews, spotlight features).

**New file:** `src/components/admin/AdminVideoManagement.tsx`
- List all videos with title, type, artist, publish status, view count
- Add/edit video (title, URL, description, thumbnail, type, artist, featured flag)
- Delete videos
- Toggle publish/featured status
- Filter by video type (music_video, interview, spotlight)

**Edit:** `src/pages/AdminPage.tsx`
- Add "Videos" tab with Video icon between existing tabs

## Technical Details

### Share URL change
```typescript
// Before
const shareUrl = `${window.location.origin}/song/${id}`;
// After  
const shareUrl = `https://sudagospel.com/song/${id}`;
```

### Admin Video Management component
Will query the existing `videos` table which already has columns for title, video_url, description, thumbnail_url, video_type, artist_id, is_featured, is_published, view_count. RLS policies already allow admins full access. No database changes needed.

