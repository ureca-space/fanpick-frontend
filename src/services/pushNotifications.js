import { supabase } from "../lib/supabase.js";

const urlBase64ToUint8Array = (value) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
};

export const ensurePushSubscription = async (userId) => {
  if (!userId) {
    throw new Error("로그인 후 경기 알림을 설정해 주세요.");
  }

  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    throw new Error("이 브라우저는 푸시 알림을 지원하지 않아요.");
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();

  if (!vapidPublicKey) {
    throw new Error("푸시 알림 서버 설정이 아직 완료되지 않았어요.");
  }

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

  if (permission !== "granted") {
    throw new Error("브라우저 설정에서 FanPick 알림을 허용해 주세요.");
  }

  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));
  const subscriptionJson = subscription.toJSON();

  if (
    !subscriptionJson.endpoint ||
    !subscriptionJson.keys?.p256dh ||
    !subscriptionJson.keys?.auth
  ) {
    throw new Error("브라우저 푸시 주소를 생성하지 못했어요.");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscriptionJson.endpoint,
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth,
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    throw error;
  }

  return subscription;
};
