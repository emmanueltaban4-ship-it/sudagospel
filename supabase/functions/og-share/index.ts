import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const songId = url.searchParams.get("id");
  const type = url.searchParams.get("type") || "song";

  if (!songId) {
    return new Response("Missing id", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const SITE_ORIGIN = "https://sudagospel.com";

  let title = "Sudagospel";
  let description = "Stream and download gospel music from South Sudan.";
  let imageUrl = `${supabaseUrl}/storage/v1/object/public/covers/og-default.jpg`;
  let pageUrl = SITE_ORIGIN;

  if (type === "song") {
    const { data: song } = await supabase
      .from("songs")
      .select("title, cover_url, description, genre, artists(name)")
      .eq("id", songId)
      .single();

    if (song) {
      const artistName = (song.artists as any)?.name || "Unknown Artist";
      title = `${song.title} by ${artistName}`;
      description = song.description || `Listen to ${song.title} by ${artistName} on Sudagospel. ${song.genre || "Gospel"} music from South Sudan.`;
      if (song.cover_url) imageUrl = song.cover_url;
      pageUrl = `${SITE_ORIGIN}/song/${songId}`;
    }
  } else if (type === "artist") {
    const { data: artist } = await supabase
      .from("artists")
      .select("name, bio, avatar_url, genre")
      .eq("id", songId)
      .single();

    if (artist) {
      title = `${artist.name} - Sudagospel`;
      description = artist.bio || `Listen to ${artist.name}'s gospel music on Sudagospel. ${artist.genre || "Gospel"} artist from South Sudan.`;
      if (artist.avatar_url) imageUrl = artist.avatar_url;
      pageUrl = `${SITE_ORIGIN}/artist/${songId}`;
    }
  } else if (type === "article") {
    const { data: article } = await supabase
      .from("articles")
      .select("title, excerpt, cover_url, slug")
      .eq("id", songId)
      .single();

    if (article) {
      title = `${article.title} - Sudagospel`;
      description = article.excerpt || "Read the latest gospel news on Sudagospel.";
      if (article.cover_url) imageUrl = article.cover_url;
      pageUrl = `${SITE_ORIGIN}/news/${article.slug || songId}`;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="music.song">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:site_name" content="Sudagospel">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}">
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
