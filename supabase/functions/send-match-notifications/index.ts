import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type ScheduledNotification = {
  id: string;
  user_id: string;
  match_id: string;
  payload: Record<string, unknown> | null;
  retry_count: number | null;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const getRequiredEnvironmentValue = (name: string) => {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
};

const createNotificationMessage = (notification: ScheduledNotification) => {
  const payload = notification.payload ?? {};
  const matchTitle = String(payload.matchTitle ?? "설정한 경기");
  const offsetMinutes = Number(payload.offsetMinutes);
  const timingLabel =
    Number.isFinite(offsetMinutes) && offsetMinutes > 0
      ? `${offsetMinutes}분 후`
      : "곧";

  return {
    title: "FanPick 경기 알림",
    body: `${matchTitle} 경기가 ${timingLabel} 시작해요!`,
    matchId: notification.match_id,
    tag: `fanpick-match-${notification.match_id}`,
    url: String(payload.url ?? `/calendar?match=${notification.match_id}`),
  };
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const cronSecret = getRequiredEnvironmentValue("CRON_SECRET");

    if (request.headers.get("x-cron-secret") !== cronSecret) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const supabaseUrl = getRequiredEnvironmentValue("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnvironmentValue(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
    const vapidSubject = getRequiredEnvironmentValue("VAPID_SUBJECT");
    const vapidPublicKey = getRequiredEnvironmentValue("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = getRequiredEnvironmentValue("VAPID_PRIVATE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const { data: dueNotifications, error: dueError } = await supabase
      .from("scheduled_notifications")
      .select("id, user_id, match_id, payload, retry_count")
      .eq("notification_type", "match_start_reminder")
      .eq("status", "scheduled")
      .lte("send_at", new Date().toISOString())
      .order("send_at", { ascending: true })
      .limit(100);

    if (dueError) {
      throw dueError;
    }

    const results = [];

    for (const notification of (dueNotifications ??
      []) as ScheduledNotification[]) {
      const { data: claimedNotification, error: claimError } = await supabase
        .from("scheduled_notifications")
        .update({
          status: "processing",
          processed_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", notification.id)
        .eq("status", "scheduled")
        .select("id")
        .maybeSingle();

      if (claimError || !claimedNotification) {
        continue;
      }

      const { data: subscriptions, error: subscriptionError } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", notification.user_id);

      if (subscriptionError) {
        throw subscriptionError;
      }

      const message = JSON.stringify(createNotificationMessage(notification));
      let sentCount = 0;
      const failures: string[] = [];

      for (const subscription of (subscriptions ?? []) as PushSubscriptionRow[]) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            message,
          );
          sentCount += 1;
        } catch (error) {
          const statusCode = Number(
            (error as { statusCode?: number })?.statusCode,
          );

          if (statusCode === 404 || statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);
          } else {
            failures.push(
              error instanceof Error ? error.message : "Unknown push error",
            );
          }
        }
      }

      const retryCount = Number(notification.retry_count ?? 0) + 1;
      const shouldRetry = sentCount === 0 && failures.length > 0 && retryCount < 3;
      const finalStatus = sentCount > 0 ? "sent" : shouldRetry ? "scheduled" : "failed";
      const lastError =
        sentCount === 0
          ? failures[0] ?? "No active push subscription was found."
          : failures[0] ?? null;

      await supabase
        .from("scheduled_notifications")
        .update({
          status: finalStatus,
          retry_count: retryCount,
          last_error: lastError,
          processed_at: new Date().toISOString(),
          ...(shouldRetry
            ? { send_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() }
            : {}),
        })
        .eq("id", notification.id);

      results.push({
        id: notification.id,
        status: finalStatus,
        sentCount,
      });
    }

    return jsonResponse({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Failed to send match notifications.", error);

    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Unknown notification error",
      },
      500,
    );
  }
});
