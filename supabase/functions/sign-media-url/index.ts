// Mints short-lived signed URLs for the private `music` bucket.
// Public callers can stream/download a song only if it is approved + published.
// Owners, admins, and paying purchasers can always sign.
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SIGNED_TTL = 3600; // 1 hour

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Extract the storage path inside the music bucket from either:
//  - a full Supabase storage URL (public or sign endpoint)
//  - a bare object path (e.g. "uid/123-track.mp3")
function extractMusicPath(input: string): string | null {
  if (!input) return null;
  // Bare path heuristic: no protocol
  if (!/^https?:\/\//i.test(input)) {
    return input.replace(/^\/+/, "");
  }
  try {
    const u = new URL(input);
    const m = u.pathname.match(
      /\/storage\/v1\/object\/(?:public|sign|authenticated)\/music\/(.+)$/,
    );
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let body: { path?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const raw = body.path ?? body.url ?? "";
  const objectPath = extractMusicPath(raw);
  if (!objectPath) {
    return json(400, { error: "Missing or invalid music path" });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Identify caller (optional)
  const authHeader = req.headers.get("Authorization") || "";
  let userId: string | null = null;
  if (authHeader.startsWith("Bearer ")) {
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data } = await userClient.auth.getUser();
    userId = data.user?.id ?? null;
  }

  // Look up the song that owns this file. We match by suffix because file_url
  // historically stored the full public URL.
  const { data: songs, error: songErr } = await admin
    .from("songs")
    .select("id, uploaded_by, is_approved, release_status, file_url, is_paid")
    .ilike("file_url", `%${objectPath}`)
    .limit(1);

  if (songErr) return json(500, { error: "Lookup failed" });
  const song = songs?.[0];
  if (!song) return json(404, { error: "Track not found" });

  // Authorization
  let allowed = song.is_approved && song.release_status === "published" && !song.is_paid;

  if (!allowed && userId) {
    if (song.uploaded_by === userId) {
      allowed = true;
    } else {
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (roleRow) allowed = true;
    }
    if (!allowed && song.is_paid) {
      const { data: paid } = await admin
        .from("paid_downloads")
        .select("id")
        .eq("song_id", song.id)
        .eq("user_id", userId)
        .maybeSingle();
      if (paid) allowed = true;
    }
  }

  if (!allowed) return json(403, { error: "Forbidden" });

  const { data: signed, error: signErr } = await admin.storage
    .from("music")
    .createSignedUrl(objectPath, SIGNED_TTL);

  if (signErr || !signed) return json(500, { error: "Sign failed" });

  return json(200, {
    url: signed.signedUrl,
    expires_in: SIGNED_TTL,
    expires_at: Date.now() + SIGNED_TTL * 1000,
  });
});
