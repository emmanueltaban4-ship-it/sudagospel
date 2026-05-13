// Send a web push notification to a user (or list of users / a single subscription).
// Body: { user_ids?: string[], user_id?: string, payload: { title, body, url?, icon?, image?, tag?, data? } }
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@ssdguna.net";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const callerId = claimsData.claims.sub as string;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
    const isAdmin = !!roleRow;

    const body = await req.json().catch(() => ({}));
    const payload = body.payload;
    if (!payload || !payload.title) return json({ error: "payload.title required" }, 400);

    let userIds: string[] = [];
    if (Array.isArray(body.user_ids)) userIds = body.user_ids;
    else if (body.user_id) userIds = [body.user_id];
    else if (isAdmin && body.broadcast === true) userIds = []; // means all
    else userIds = [callerId];

    // Non-admins can only target themselves
    if (!isAdmin) userIds = userIds.filter((u) => u === callerId);
    if (!isAdmin && userIds.length === 0) return json({ error: "Forbidden" }, 403);

    let q = admin.from("push_subscriptions").select("id,endpoint,p256dh,auth,user_id");
    if (userIds.length) q = q.in("user_id", userIds);
    const { data: subs, error: sErr } = await q;
    if (sErr) return json({ error: sErr.message }, 500);

    const json_payload = JSON.stringify(payload);
    let sent = 0; let removed = 0; const errors: any[] = [];

    await Promise.all((subs ?? []).map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json_payload,
        );
        sent++;
      } catch (e: any) {
        const code = e?.statusCode;
        if (code === 404 || code === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
          removed++;
        } else {
          errors.push({ id: s.id, code, msg: String(e?.message || e) });
        }
      }
    }));

    return json({ ok: true, sent, removed, errors });
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
