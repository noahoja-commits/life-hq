/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Auto-update: take control as soon as the new SW is ready.
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Precache the built assets (manifest injected by vite-plugin-pwa).
precacheAndRoute(self.__WB_MANIFEST);

interface NotifAction {
  action: string;
  title: string;
}
interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotifAction[];
  doneUrl?: string;
  snoozeUrl?: string;
}

self.addEventListener("push", (event) => {
  let payload: PushPayload = {};
  try {
    payload = event.data ? (event.data.json() as PushPayload) : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Life HQ";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/appIcon/192.png",
      badge: "/appIcon/192.png",
      tag: payload.tag,
      requireInteraction: payload.requireInteraction,
      actions: payload.actions,
      data: {
        url: payload.url || "/",
        doneUrl: payload.doneUrl,
        snoozeUrl: payload.snoozeUrl,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const data =
    (event.notification.data as
      | { url?: string; doneUrl?: string; snoozeUrl?: string }
      | undefined) || {};

  // Action-button taps mutate via the signed endpoint WITHOUT opening the app.
  if (event.action === "done" && data.doneUrl) {
    event.notification.close();
    event.waitUntil(fetch(data.doneUrl).catch(() => {}));
    return;
  }
  if (event.action === "snooze" && data.snoozeUrl) {
    event.notification.close();
    event.waitUntil(fetch(data.snoozeUrl).catch(() => {}));
    return;
  }

  // Body tap → focus/open the app at the target route.
  event.notification.close();
  const url = data.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          if ("focus" in client) {
            const wc = client as WindowClient;
            wc.navigate(url).catch(() => {});
            return wc.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
