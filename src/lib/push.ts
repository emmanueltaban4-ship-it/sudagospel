import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const getPushPermission = (): NotificationPermission =>
  isPushSupported() ? Notification.permission : "denied";

const urlBase64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

const getReg = async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) return reg;
  return await navigator.serviceWorker.ready;
};

const fetchPublicKey = async (): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("push-public-key");
  if (error) throw error;
  if (!data?.publicKey) throw new Error("Push not configured");
  return data.publicKey as string;
};

export const subscribePush = async () => {
  if (!isPushSupported()) throw new Error("Push notifications are not supported on this device");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to enable notifications");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notifications permission denied");

  const reg = await getReg();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const publicKey = await fetchPublicKey();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const json: any = sub.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    user_agent: navigator.userAgent,
  }, { onConflict: "endpoint" });
  if (error) throw error;
  return sub;
};

export const unsubscribePush = async () => {
  if (!isPushSupported()) return;
  const reg = await getReg();
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
};

export const isCurrentlySubscribed = async () => {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch { return false; }
};

export { PROJECT_ID };
