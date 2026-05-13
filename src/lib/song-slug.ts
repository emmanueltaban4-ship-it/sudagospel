/**
 * Song URL slug helpers.
 * Pattern: /song/{title-slug}-{uuid}
 * The UUID is preserved at the end so lookups remain unique and stable
 * even when two songs share the same title.
 */

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function songSlug(title?: string | null): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Build a friendly song path: /song/title-slug-uuid (or /song/uuid if no title). */
export function songPath(id: string, title?: string | null): string {
  const slug = songSlug(title);
  return slug ? `/song/${slug}-${id}` : `/song/${id}`;
}

/** Extract the UUID from a route param that may be either a bare UUID or "slug-uuid". */
export function extractSongId(param?: string | null): string | null {
  if (!param) return null;
  const m = param.match(UUID_RE);
  return m ? m[0] : param;
}
