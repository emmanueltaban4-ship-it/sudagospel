/**
 * Convert an artist name to a URL-friendly slug.
 * e.g. "Daddy P Music 211" → "daddy-p-music-211"
 */
export function artistSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Build the artist detail path from a name.
 */
export function artistPath(name: string): string {
  return `/artist/${artistSlug(name)}`;
}
