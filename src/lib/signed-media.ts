// Resolves raw song file URLs to short-lived signed URLs for the private music bucket.
// Public sudagospel.net legacy URLs go through the existing download-proxy.
// In-memory cache keyed by storage path; refreshes ~5 min before expiry.

import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
const SAFETY_MS = 5 * 60 * 1000;

type Entry = { url: string; expiresAt: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<string>>();

const isLegacyExternal = (url: string) =>
  url.includes("sudagospel.com/get-track.php") ||
  url.includes("sudagospel.net/get-track.php");

const isMusicStorage = (url: string) =>
  url.includes("/storage/v1/object/") && url.includes("/music/");

const extractPath = (url: string): string | null => {
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/music\/(.+?)(?:\?|$)/);
  return m ? decodeURIComponent(m[1]) : null;
};

async function signMusic(path: string): Promise<string> {
  const cached = cache.get(path);
  if (cached && cached.expiresAt - SAFETY_MS > Date.now()) return cached.url;

  const existing = inflight.get(path);
  if (existing) return existing;

  const promise = (async () => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const res = await fetch(
      `https://${PROJECT_ID}.supabase.co/functions/v1/sign-media-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ path }),
      },
    );
    if (!res.ok) throw new Error(`sign-media-url ${res.status}`);
    const json = (await res.json()) as { url: string; expires_at: number };
    cache.set(path, { url: json.url, expiresAt: json.expires_at });
    return json.url;
  })().finally(() => inflight.delete(path));

  inflight.set(path, promise);
  return promise;
}

/** Resolve a song's file URL to something the browser can stream/download. */
export async function resolvePlayableUrl(rawUrl: string): Promise<string> {
  if (!rawUrl) return rawUrl;
  if (isLegacyExternal(rawUrl)) {
    return `${SUPABASE_URL}/functions/v1/download-proxy?url=${encodeURIComponent(rawUrl)}`;
  }
  if (isMusicStorage(rawUrl)) {
    const path = extractPath(rawUrl);
    if (!path) return rawUrl;
    try {
      return await signMusic(path);
    } catch {
      return rawUrl;
    }
  }
  return rawUrl;
}
