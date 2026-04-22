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
    const { artist_id } = await req.json();
    if (!artist_id) throw new Error("artist_id required");

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Auth required");
    const { data: userData } = await supa.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData.user?.email) throw new Error("Not authenticated");
    const user = userData.user;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: artist, error } = await admin.from("artists").select("id, name, supporter_enabled, supporter_price_cents").eq("id", artist_id).maybeSingle();
    if (error || !artist) throw new Error("Artist not found");
    if (!artist.supporter_enabled) throw new Error("Artist is not accepting supporters");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://sudagospel.com";

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        price_data: {
          currency: "usd",
          recurring: { interval: "month" },
          product_data: { name: `Monthly Supporter — ${artist.name}` },
          unit_amount: artist.supporter_price_cents,
        },
        quantity: 1,
      }],
      metadata: { type: "supporter", artist_id, payer_user_id: user.id },
      subscription_data: {
        metadata: { type: "supporter", artist_id, payer_user_id: user.id },
      },
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
