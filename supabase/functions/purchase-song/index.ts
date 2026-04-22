import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { song_id } = await req.json();
    if (!song_id) throw new Error("song_id required");

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Auth required");
    const { data: userData } = await supa.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: song, error } = await admin
      .from("songs")
      .select("id, title, artist_id, is_paid_download, download_price_cents, artists!inner(name)")
      .eq("id", song_id).maybeSingle();
    if (error || !song) throw new Error("Song not found");
    if (!song.is_paid_download) throw new Error("Song is not for sale");

    // Already purchased?
    const { data: existing } = await admin.from("paid_downloads").select("id").eq("user_id", user.id).eq("song_id", song_id).maybeSingle();
    if (existing) throw new Error("Already purchased");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://sudagospel.com";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `${song.title} — ${(song as any).artists.name}` },
          unit_amount: song.download_price_cents,
        },
        quantity: 1,
      }],
      metadata: { type: "download", song_id, artist_id: song.artist_id, payer_user_id: user.id },
      success_url: `${origin}/purchases?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/song/${song_id}`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
