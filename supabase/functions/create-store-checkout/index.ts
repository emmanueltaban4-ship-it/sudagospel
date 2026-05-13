import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem { product_id: string; quantity: number; variant_label?: string | null; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { items, shipping } = (await req.json()) as { items: CartItem[]; shipping?: any };
    if (!Array.isArray(items) || items.length === 0) throw new Error("Empty cart");

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const auth = req.headers.get("Authorization");
    let user: any = null;
    if (auth) {
      const { data } = await supa.auth.getUser(auth.replace("Bearer ", ""));
      user = data.user;
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ids = items.map(i => i.product_id);
    const { data: products, error } = await admin.from("store_products").select("*").in("id", ids).eq("is_active", true);
    if (error || !products?.length) throw new Error("Products not found");

    // Verify all items belong to one artist (single-checkout per artist)
    const artistIds = new Set(products.map(p => p.artist_id));
    if (artistIds.size > 1) throw new Error("All items must be from the same artist");
    const artist_id = [...artistIds][0];

    let total = 0;
    const line_items = items.map(it => {
      const p = products.find(x => x.id === it.product_id)!;
      total += p.price_cents * it.quantity;
      return {
        price_data: {
          currency: p.currency || "usd",
          product_data: { name: p.title + (it.variant_label ? ` (${it.variant_label})` : ""), images: p.image_url ? [p.image_url] : undefined },
          unit_amount: p.price_cents,
        },
        quantity: it.quantity,
      };
    });

    // Platform fee
    const { data: feeRow } = await admin.from("site_settings").select("value").eq("key", "platform_fee_percent").maybeSingle();
    const feePct = parseFloat(feeRow?.value || "15");
    const platform_fee_cents = Math.round((total * feePct) / 100);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://sudagospel.net";
    const needsShipping = products.some(p => p.is_physical);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user?.email,
      line_items,
      shipping_address_collection: needsShipping ? { allowed_countries: ["US","GB","KE","UG","SS","TZ","CA","AU","DE","FR","NL","ZA","NG","GH"] } : undefined,
      metadata: {
        type: "store",
        artist_id,
        payer_user_id: user?.id || "",
        items_json: JSON.stringify(items),
        platform_fee_cents: String(platform_fee_cents),
      },
      success_url: `${origin}/purchases?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/artist/${artist_id}`,
    });

    return new Response(JSON.stringify({ url: session.url }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
