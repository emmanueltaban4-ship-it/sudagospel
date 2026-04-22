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
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return new Response(JSON.stringify({ status: "pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const md = session.metadata || {};
    const type = md.type;
    const artist_id = md.artist_id;
    const payer_user_id = md.payer_user_id || null;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Idempotency: check if earnings already recorded
    const { data: existingEarning } = await admin.from("artist_earnings").select("id").eq("stripe_session_id", session.id).maybeSingle();
    if (existingEarning) {
      return new Response(JSON.stringify({ status: "already_recorded", type }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const amount_cents = session.amount_total ?? 0;
    const currency = session.currency ?? "usd";

    if (type === "tip") {
      await admin.from("artist_earnings").insert({
        artist_id, source: "tip", amount_cents, currency,
        payer_user_id, stripe_session_id: session.id,
      });
    } else if (type === "download") {
      const song_id = md.song_id;
      await admin.from("paid_downloads").insert({
        user_id: payer_user_id, song_id, amount_cents, stripe_session_id: session.id,
      });
      await admin.from("artist_earnings").insert({
        artist_id, source: "download", amount_cents, currency,
        song_id, payer_user_id, stripe_session_id: session.id,
      });
    } else if (type === "supporter") {
      const sub_id = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      let current_period_end: string | null = null;
      let stripe_customer_id: string | null = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
      if (sub_id) {
        const sub = await stripe.subscriptions.retrieve(sub_id);
        current_period_end = new Date(sub.current_period_end * 1000).toISOString();
      }
      await admin.from("supporter_subscriptions").upsert({
        user_id: payer_user_id, artist_id, stripe_subscription_id: sub_id,
        stripe_customer_id, status: "active", current_period_end, amount_cents,
      }, { onConflict: "stripe_subscription_id" });
      await admin.from("artist_earnings").insert({
        artist_id, source: "supporter", amount_cents, currency,
        payer_user_id, stripe_session_id: session.id, stripe_subscription_id: sub_id,
      });
    }

    return new Response(JSON.stringify({ status: "ok", type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
