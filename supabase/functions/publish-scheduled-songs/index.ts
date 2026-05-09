import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  try {
    // Restrict to service-role callers (pg_cron / Supabase scheduled invocations).
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token || token !== supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find songs that are scheduled, past their release date, and already approved.
    // Scheduling never bypasses the admin approval queue.
    const { data: songs, error: fetchError } = await supabase
      .from("songs")
      .select("id, title, artist_id")
      .eq("release_status", "scheduled")
      .eq("is_approved", true)
      .lte("scheduled_release_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!songs || songs.length === 0) {
      return new Response(JSON.stringify({ published: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update each song to published
    const ids = songs.map((s) => s.id);
    const { error: updateError } = await supabase
      .from("songs")
      .update({ release_status: "published" })
      .in("id", ids);

    if (updateError) throw updateError;

    console.log(`Published ${ids.length} scheduled songs: ${ids.join(", ")}`);

    return new Response(JSON.stringify({ published: ids.length, ids }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error publishing scheduled songs:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
