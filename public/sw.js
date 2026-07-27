self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "FanPick 경기 알림", {
      body: payload.body ?? "설정한 경기가 곧 시작해요!",
      icon: "/fanpick_mascot.svg",
      badge: "/fanpick_mascot.svg",
      tag: payload.tag ?? `fanpick-match-${payload.matchId ?? "alert"}`,
      data: {
        url: payload.url ?? "/calendar",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(
    event.notification.data?.url ?? "/calendar",
    self.location.origin,
  ).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        const existingClient = clientList.find(
          (client) => new URL(client.url).origin === self.location.origin,
        );

        if (existingClient) {
          await existingClient.navigate(targetUrl);
          return existingClient.focus();
        }

        return clients.openWindow(targetUrl);
      }),
  );
});
