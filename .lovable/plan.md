# Audiomack-style Redesign for Sudagospel

Adopt Audiomack's layout language across the app while keeping the Sudagospel **red + dark** brand. No business logic changes — pure presentation, tokens, and component shells.

## 1. Design tokens (`src/index.css`, `tailwind.config.ts`)

- Make **dark the default** (Audiomack is dark-first). Light theme stays available but app boots dark.
- Tighten palette:
  - `--background`: near-black `0 0% 6%`
  - `--card`: `0 0% 9%`
  - `--muted`: `0 0% 13%`
  - `--primary`: keep red `0 84% 55%` (Audiomack uses orange — we keep red as the accent everywhere they use orange)
  - `--border`: `0 0% 15%` (very subtle)
- Add utilities: `bg-gradient-am-hero` (radial red→black), `bg-blur-art` (for blurred-artwork backdrops), `text-am-label` (uppercase 11px tracked label).
- Typography: keep Figtree/DM Sans but tighten to Audiomack scale (display 28/32, h2 20, body 14, label 11 uppercase).

## 2. Bottom nav (`src/components/BottomNav.tsx`)

Replace tabs with Audiomack's exact 5:

```text
[ Feed ] [ Browse ] [ Search ] [ My Library ] [ Premium ]
   /        /music     (opens     /library        /subscription
                       SearchOverlay)
```

- Larger icons, thin label under, active tab in red with a tiny dot indicator.
- Solid dark background with hairline top border, no blur.

## 3. Top bar (`src/components/TopBar.tsx`)

- Mobile: logo left, avatar right only (search moves to bottom nav). Cleaner, less crowded.
- Desktop: keep search but restyle as Audiomack's pill (rounded, muted bg, no kbd hint).

## 4. Home / Feed (`src/pages/Index.tsx`, `HeroSection.tsx`, carousels)

Audiomack feed pattern:
- **Trending Now** hero: large square artwork left, song title + artist + play CTA right, blurred art backdrop.
- Horizontal **rails** with section header (`TITLE` uppercase + "See all" link), 2.5 cards visible on mobile, snap-scroll.
- Rails to include: Trending Now, Top Songs This Week, New Releases, Recommended Artists, Made for You.
- Card style: square art with rounded-lg, title bold sm, artist muted xs, no card chrome.

## 5. Player

**MiniPlayer** (`src/components/MiniPlayer.tsx`):
- Sits directly above bottom nav, full-width, dark solid bg, hairline top border.
- Layout: 40px art • title/artist stacked • play/pause • next. Thin 2px progress line at the very top edge.

**FullScreenPlayer** (`src/components/FullScreenPlayer.tsx`):
- Blurred album art covers entire background with dark overlay.
- Centered large square art (80% width), title (display), artist (muted).
- Scrubber with elapsed/remaining times.
- Big circular red play button, prev/next/shuffle/repeat around it.
- Action row: like, add to playlist, download, share, more.

## 6. Song & Artist detail pages (`SongDetailPage.tsx`, `ArtistDetailPage.tsx`)

- Cinematic header: full-bleed blurred artwork backdrop → vertical gradient to background.
- Foreground: square art (or circular for artist), title, artist (verified badge), meta row (plays · uploaded date · genre).
- Sticky action bar: red Play button, Follow/Like, Share, More.
- Below: tabs (Overview / Comments / Related). Comments and tracklist styled as flat dense rows.

## 7. Cards & rows (`SongCard.tsx`, `ArtistCard.tsx`)

- Remove heavy card chrome; rely on artwork + tight typography.
- Square art with hover-floating red play button (Audiomack signature).
- Track row variant (used in detail pages & library): index • art • title/artist • plays • duration • more.

## Out of scope

- No DB, RLS, auth, or hook logic changes.
- No new pages/routes; we restyle existing surfaces.
- Admin & artist dashboard untouched (already polished).
