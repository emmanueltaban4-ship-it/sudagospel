// Send announcement push notifications.
// Admin call: POST { id } with user auth → sends that announcement immediately.
// Cron call: POST {} with service role → sends every announcement scheduled <= now and not yet sent.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@ssdguna.net";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function sendOne(a: any) {
  const { data: subs } = await admin.from("push_subscriptions").select("id,endpoint,p256dh,auth");
  const payload = JSON.stringify({
    title: a.title,
    body: a.body,
    url: a.url || "/",
    icon: a.icon_url || "/icon-192.png",
    image: a.image_url || undefined,
    tag: a.tag || `ann-${a.id}`,
  });
  let sent = 0; let removed = 0; const errors: any[] = [];
  await Promise.all((subs ?? []).map(async (s: any) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      sent++;
    } catch (e: any) {
      const code = e?.statusCode;
      if (code === 404 || code === 410) { await admin.from("push_subscriptions").delete().eq("id", s.id); removed++; }
      else errors.push({ code, msg: String(e?.message || e) });
    }
  }));
  await admin.from("announcements").update({
    sent_at: new Date().toISOString(),
    status: "sent",
    recipients_count: sent,
    errors_count: errors.length,
  }).eq("id", a.id);
  return { sent, removed, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));

    // Admin path: send a specific announcement now → require admin auth.
    if (body.id) {
      const auth = req.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "");
      if (!token) return json({ error: "Unauthorized" }, 401);
      const isServiceRole = token === SERVICE_ROLE;
      let isAdmin = isServiceRole;
      if (!isServiceRole) {
        const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
        const { data: claimsData, error: cErr } = await userClient.auth.getClaims(token);
        if (cErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
        const uid = claimsData.claims.sub as string;
        const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
        isAdmin = !!roleRow;
      }
      if (!isAdmin) return json({ error: "Forbidden" }, 403);

      const { data: a, error } = await admin.from("announcements").select("*").eq("id", body.id).maybeSingle();
      if (error || !a) return json({ error: "Announcement not found" }, 404);
      if (a.sent_at) return json({ error: "Already sent", a }, 400);
      const result = await sendOne(a);
      return json({ ok: true, ...result });
    }

    // Cron path: pick all due unsent — require service-role token (pg_cron only).
    const cronAuth = req.headers.get("Authorization") || "";
    const cronToken = cronAuth.replace("Bearer ", "").trim();
    if (!cronToken || cronToken !== SERVICE_ROLE) {
      return json({ error: "Forbidden" }, 403);
    }

    const { data: due } = await admin
      .from("announcements")
      .select("*")
      .is("sent_at", null)
      .in("status", ["scheduled"])
      .lte("scheduled_for", new Date().toISOString())
      .limit(20);

    let total = 0;
    for (const a of due ?? []) {
      const r = await sendOne(a);
      total += r.sent;
    }
    return json({ ok: true, processed: due?.length ?? 0, total_sent: total });
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
