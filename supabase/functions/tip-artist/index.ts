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
    const { artist_id, amount_cents } = await req.json();
    if (!artist_id || !amount_cents || amount_cents < 100) {
      return new Response(JSON.stringify({ error: "Invalid input. Minimum tip is $1.00" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const authHeader = req.headers.get("Authorization");
    let userEmail: string | undefined;
    let userId: string | undefined;
    if (authHeader) {
      const { data } = await supa.auth.getUser(authHeader.replace("Bearer ", ""));
      userEmail = data.user?.email;
      userId = data.user?.id;
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: artist, error } = await admin.from("artists").select("id, name, tip_jar_enabled").eq("id", artist_id).maybeSingle();
    if (error || !artist) throw new Error("Artist not found");
    if (!artist.tip_jar_enabled) throw new Error("This artist is not accepting tips");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://sudagospel.com";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: userEmail,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Tip for ${artist.name}` },
          unit_amount: amount_cents,
        },
        quantity: 1,
      }],
      metadata: { type: "tip", artist_id, payer_user_id: userId ?? "" },
      success_url: `${origin}/purchases?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/artist/${artist_id}`,
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
