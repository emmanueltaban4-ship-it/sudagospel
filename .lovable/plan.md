

# Rebuild Sudagospel as Audiomack-Style Mobile-First Music App

## Current State Assessment

The app already has a solid foundation with most of the requested features:
- Music streaming with player (play, pause, next, prev, seek, volume)
- Song detail pages with comments, likes, downloads
- Artist profiles with follow functionality
- Playlists (create, manage, add/remove songs)
- Search overlay
- Auth (email, phone, Google OAuth)
- Artist dashboard (upload, edit songs, manage profile)
- Admin dashboard (approve songs, manage users/artists, stats, monetization)
- Hall of Fame, Most Listened, New Songs pages
- Ad system, subscription page

**What's missing or needs rebuilding** to match the Audiomack-style spec:

1. **Splash screen** — does not exist
2. **Onboarding flow** — does not exist
3. **Color scheme change** — currently red/green, spec requests purple/gold/white
4. **Downloads screen** — no dedicated offline/downloads page
5. **Category filtering** (Worship, Praise, Choir, Sermons) — partial, genres exist but not these exact categories
6. **Bottom nav restructure** — currently Home/Explore/Videos/Artists/You; spec wants Home/Search/Library/Profile
7. **Full-screen player** — currently only mini player + song detail page
8. **Low data mode** — not implemented
9. **Overall UI polish** — needs Audiomack-like refinement

## Plan

### Step 1: Update Color Theme to Purple/Gold/White
- Modify `src/index.css` CSS variables
- Primary: purple (~270° hue), accent: gold (~45° hue)
- Update both light and dark theme tokens
- Keep the South Sudan gospel identity but with the new palette

### Step 2: Create Splash Screen
- New component `src/components/SplashScreen.tsx`
- App logo centered, purple/gold gradient background
- Auto-redirect after 2.5 seconds using state in `App.tsx`
- Only show on first visit (use localStorage flag)

### Step 3: Create Onboarding Flow
- New page `src/pages/OnboardingPage.tsx`
- 3 swipeable slides with illustrations (using icons/gradients)
  - "Discover South Sudan gospel music"
  - "Stream and download songs"
  - "Support gospel artists"
- Next/Back/Get Started navigation
- Store completion in localStorage, skip on return visits

### Step 4: Restructure Bottom Navigation
- Update `src/components/BottomNav.tsx`
- New tabs: Home, Search, Library (playlists + downloads), Profile
- Search tab opens the search overlay or navigates to a search page
- Library tab shows playlists and downloads in a combined view

### Step 5: Create Downloads Screen
- New page `src/pages/DownloadsPage.tsx`
- List songs the user has downloaded (track in localStorage or IndexedDB)
- Offline playback capability using Service Worker cache
- Remove download option per song
- Integrate into Library tab

### Step 6: Build Full-Screen Player View
- Enhance `src/pages/SongDetailPage.tsx` or create a dedicated full-screen player modal
- Large cover art, blurred background
- All controls: play/pause, next/prev, seek bar, like, download, share
- Swipe down to minimize back to mini player

### Step 7: Add Category Sections to Home
- Add category chips/cards on home page: Worship, Praise, Choir, Sermons
- Filter songs by genre/category when tapped
- These map to the existing `genre` field in the songs table

### Step 8: Performance Optimizations
- Add lazy loading for all route pages (React.lazy + Suspense)
- Image optimization with loading="lazy" (already partially done)
- Skeleton loading states for all data-dependent sections
- Consider adding a "Low Data Mode" toggle in settings that reduces image quality

### Step 9: UI Polish — Audiomack Style
- Rounded cards, smooth transitions, modern spacing
- Gradient accents on player and hero sections
- Improve mobile touch targets (min 44px)
- Safe area handling for notched devices (already has safe-area-bottom)

### Step 10: Wire Up Navigation & State
- Splash → Onboarding → Auth/Home flow
- Ensure all screens connect with proper back navigation
- Add route for `/downloads` and `/library`
- Update `App.tsx` with new routes

## Technical Details

**No database changes needed** — all existing tables support the required features. Downloads tracking can use the existing `song_downloads` table plus client-side caching.

**No new edge functions needed** — all functionality is client-side or already exists.

**Files to create:**
- `src/components/SplashScreen.tsx`
- `src/pages/OnboardingPage.tsx`
- `src/pages/DownloadsPage.tsx`
- `src/pages/LibraryPage.tsx`

**Files to modify:**
- `src/index.css` (color theme)
- `src/App.tsx` (splash logic, new routes)
- `src/components/BottomNav.tsx` (new nav structure)
- `src/components/Layout.tsx` (sidebar updates)
- `src/pages/Index.tsx` (category sections)
- `src/pages/SongDetailPage.tsx` (full-screen player enhancements)
- `src/components/MiniPlayer.tsx` (tap to expand to full-screen)

