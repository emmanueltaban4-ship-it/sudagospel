# Project Memory

## Core
Sudagospel.net — gospel music platform for South Sudan. Spotify-inspired design.
Primary red (#DC2626), secondary green (#16A34A), dark background. Figtree headings, DM Sans body.
Mobile-first with bottom nav. Lovable Cloud enabled. Auth via email/phone.
Storage: music, covers, avatars, blog-covers buckets.
Admin system uses user_roles table with has_role() security definer function.
Stripe integration: Premium $4.99/mo, Artist Pro $9.99/mo, donations.

## Memories
- [Branding](mem://design/branding) — Red/green/dark palette from South Sudan flag colors, gospel theme
- [Database schema](mem://features/database) — profiles, artists, songs, likes, comments, downloads, user_roles tables with RLS
