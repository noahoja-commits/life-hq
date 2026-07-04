import { useEffect, useState } from "react";
import { useGetIdentity, useNotify } from "ra-core";
import { Bell, BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "../providers/supabase/supabase";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export const PushReminders = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const [enabled, setEnabled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        const isOn = !!sub && Notification.permission === "granted";
        setEnabled(isOn);
        // Keep the device timezone fresh so routine/tracker nudges and the
        // evening wrap-up fire at the user's LOCAL time.
        if (isOn && sub?.endpoint) {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          getSupabaseClient()
            .from("push_subscriptions")
            .update({ tz })
            .eq("endpoint", sub.endpoint)
            .then(() => {});
        }
      })
      .catch(() => {});
  }, [supported]);

  const enable = async () => {
    if (!supported || !VAPID_PUBLIC) {
      notify("Push not supported on this device/browser", { type: "warning" });
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        notify("Reminders need notification permission", { type: "warning" });
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      const json = sub.toJSON();
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          sales_id: identity?.id ? Number(identity.id) : null,
          endpoint: json.endpoint,
          subscription: json,
          user_agent: navigator.userAgent,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        { onConflict: "endpoint" },
      );
      if (error) throw error;
      setEnabled(true);
      notify("Reminders are on 🔔", { type: "info" });
    } catch (e) {
      notify("Could not enable reminders", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (!supported || enabled || dismissed) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
      <BellRing className="size-5 text-primary shrink-0" />
      <div className="flex-1 text-sm">
        <span className="font-medium">Turn on reminders</span>
        <span className="text-muted-foreground">
          {" "}
          — get a nudge on your phone for what's due.
        </span>
      </div>
      <Button size="sm" onClick={enable} disabled={busy} className="gap-1">
        <Bell className="size-4" />
        {busy ? "…" : "Enable"}
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};
