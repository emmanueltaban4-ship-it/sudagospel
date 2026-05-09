import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isPushSupported, getPushPermission, subscribePush, unsubscribePush, isCurrentlySubscribed } from "@/lib/push";

const PushNotificationToggle = () => {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission>("default");

  useEffect(() => {
    const ok = isPushSupported();
    setSupported(ok);
    if (!ok) return;
    setPerm(getPushPermission());
    isCurrentlySubscribed().then(setEnabled);
  }, []);

  if (!supported) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">
        Push notifications are not supported on this device or browser.
      </div>
    );
  }

  const toggle = async () => {
    setBusy(true);
    try {
      if (enabled) {
        await unsubscribePush();
        setEnabled(false);
        toast.success("Push notifications disabled");
      } else {
        await subscribePush();
        setEnabled(true);
        setPerm("granted");
        toast.success("Push notifications enabled");
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not update notifications");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm">Push notifications</p>
          <p className="text-xs text-muted-foreground">
            {perm === "denied"
              ? "Blocked in browser settings — allow notifications to enable."
              : enabled
              ? "You'll get alerts for new releases, replies and tips."
              : "Get alerts for new releases, replies and tips on this device."}
          </p>
        </div>
      </div>
      <Button size="sm" variant={enabled ? "outline" : "default"} disabled={busy || perm === "denied"} onClick={toggle}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : enabled ? "Disable" : "Enable"}
      </Button>
    </div>
  );
};

export default PushNotificationToggle;
