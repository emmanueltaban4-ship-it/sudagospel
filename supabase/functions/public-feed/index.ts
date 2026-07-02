import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // API key check
  const expected = Deno.env.get("WEBSITE_FEED_KEY");
  if (!expected) return json({ error: "Feed not configured" }, 500);
  const provided = req.headers.get("x-api-key") ?? new URL(req.url).searchParams.get("api_key");
  if (provided !== expected) return json({ error: "Unauthorized" }, 401);

  const url = new URL(req.url);
  // Path looks like /public-feed/<resource>
  const parts = url.pathname.split("/").filter(Boolean);
  const resource = parts[parts.length - 1] || "";

  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    switch (resource) {
      case "songs": {
        const { data, error, count } = await supabase
          .from("songs")
          .select("id, title, slug, description, genre, cover_url, file_url, play_count, download_count, created_at, artists(id, name, avatar_url, is_verified)", { count: "exact" })
          .eq("is_approved", true)
          .eq("release_status", "published")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return json({ data, count, limit, offset });
      }
      case "artists": {
        const { data, error, count } = await supabase
          .from("artists")
          .select("id, name, bio, avatar_url, cover_url, is_verified, created_at", { count: "exact" })
          .eq("status", "approved")
          .order("name")
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return json({ data, count, limit, offset });
      }
      case "articles": {
        const { data, error, count } = await supabase
          .from("articles")
          .select("id, title, slug, excerpt, content, cover_url, category, published_at", { count: "exact" })
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return json({ data, count, limit, offset });
      }
      case "events": {
        const { data, error, count } = await supabase
          .from("events")
          .select("*", { count: "exact" })
          .gte("start_at", new Date().toISOString())
          .order("start_at", { ascending: true })
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return json({ data, count, limit, offset });
      }
      case "videos": {
        const { data, error, count } = await supabase
          .from("videos")
          .select("*, artists(id, name, avatar_url)", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return json({ data, count, limit, offset });
      }
      case "":
      case "public-feed":
        return json({
          endpoints: ["songs", "artists", "articles", "events", "videos"],
          usage: "GET /public-feed/<resource>?limit=50&offset=0 with header x-api-key: <WEBSITE_FEED_KEY>",
        });
      default:
        return json({ error: `Unknown resource: ${resource}` }, 404);
    }
  } catch (err: any) {
    console.error("public-feed error:", err);
    return json({ error: err.message ?? "Internal error" }, 500);
  }
});
