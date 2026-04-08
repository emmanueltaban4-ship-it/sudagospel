import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find songs that are scheduled and past their release date
    const { data: songs, error: fetchError } = await supabase
      .from("songs")
      .select("id, title, artist_id")
      .eq("release_status", "scheduled")
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
      .update({ release_status: "published", is_approved: true })
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
