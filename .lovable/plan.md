

# Unified Profile + Enhanced Artist Features + Admin Expansion

## Summary
Merge artist and user profiles into one unified page, let artists edit songs and manage albums directly from their profile, and add more admin features for a gospel music streaming platform.

## What Changes

### 1. Unified Profile Page
Currently there are two separate pages: ProfilePage (user) and ArtistDashboardPage (artist studio). The plan is to merge them so that:
- If the user has an artist account, their profile page shows artist-specific sections (songs management, albums, analytics) inline — no separate "Artist Studio" page needed.
- The profile page detects if the user is an artist via the `artists` table and conditionally renders artist tools.
- The ArtistDashboardPage route (`/artist-dashboard`) redirects to `/profile` to avoid broken links.
- The public artist detail page (`/artist/:slug`) remains separate — it's the public-facing view.

### 2. Artist Song Editing on Profile
Move the song editing functionality (currently in ArtistDashboardPage) into the unified profile:
- Inline edit song title, description, genre, lyrics, album assignment
- Delete songs
- View pending/approved status
- Upload new songs (link to upload page or inline form)

### 3. Album Management on Profile
Artists can:
- Create new albums with title, description, genre, cover image upload
- Edit existing albums (title, description, cover)
- Delete albums
- Assign songs to albums during song edit
- Album cover upload using the existing `covers` storage bucket

### 4. Enhanced Admin Page
Add these new admin sections:

- **Genre Management** — Add/edit/delete genre categories used across the app (stored in `site_settings` as a JSON value)
- **Album Management** — View all albums, edit, delete, assign covers
- **Reports & Flagging** — View flagged/reported content (requires a new `reports` table)
- **Bulk Actions** — Bulk approve/reject songs, bulk delete
- **Email/Notifications** — View email send logs, manage suppressed emails (already have tables)
- **Storage Overview** — Show bucket usage stats
- **Featured Content Manager** — Enhanced hero/featured section management with drag-to-reorder

### 5. Database Changes
- Create a `reports` table for content flagging (user reports songs/comments)
- No other schema changes needed — existing tables support all features

## Technical Approach

### Files to modify:
- `src/pages/ProfilePage.tsx` — Major rewrite to include artist dashboard sections conditionally
- `src/pages/ArtistDashboardPage.tsx` — Convert to redirect to `/profile`
- `src/pages/AdminPage.tsx` — Add new tab entries
- `src/components/admin/AdminGenreManagement.tsx` — New component
- `src/components/admin/AdminAlbumManagement.tsx` — New component
- `src/components/admin/AdminReports.tsx` — New component
- `src/components/admin/AdminFeaturedContent.tsx` — New component
- `src/components/admin/AdminEmailLogs.tsx` — New component

### Database migration:
```sql
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  content_type text NOT NULL, -- 'song', 'comment', 'artist'
  content_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, reviewed, dismissed
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Users can view own reports
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- Admins can manage all reports
CREATE POLICY "Admins can manage reports" ON public.reports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

### Profile page structure (artist mode):
```text
┌─────────────────────────────┐
│  Hero Header (avatar, name) │
│  Stats row                  │
├─────────────────────────────┤
│  Tabs: Overview │ Songs │   │
│        Albums │ Settings    │
├─────────────────────────────┤
│  Tab content:               │
│  - Overview: quick stats,   │
│    top songs, recent uploads│
│  - Songs: full list with    │
│    edit/delete inline       │
│  - Albums: create/edit/del  │
│    with cover upload        │
│  - Settings: edit profile,  │
│    upload, playlists, etc   │
├─────────────────────────────┤
│  Following section          │
│  Sign out                   │
└─────────────────────────────┘
```

### Admin page new tabs:
- Genres, Albums, Reports, Featured, Email Logs (5 new tabs added to existing 10)

