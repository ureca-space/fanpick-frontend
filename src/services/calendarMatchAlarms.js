import { supabase } from "../lib/supabase.js";

const SCHEDULED_NOTIFICATIONS_TABLE = "scheduled_notifications";
const MATCH_START_REMINDER_TYPE = "match_start_reminder";
const ACTIVE_STATUSES = ["scheduled", "pending"];

const normalizeScheduledNotification = (notification) => ({
  id: notification.id,
  userId: notification.user_id,
  matchId: String(notification.match_id),
  notificationType: notification.notification_type,
  sendAt: notification.send_at,
  status: notification.status,
  payload: notification.payload ?? {},
  createdAt: notification.created_at,
});

const getReminderOffsetMinutes = ({ presetId, customAmount, customUnit }) => {
  if (presetId === "custom") {
    const amount = Number(customAmount);
    const normalizedAmount = Number.isFinite(amount) && amount > 0 ? amount : 15;

    return customUnit === "hours" ? normalizedAmount * 60 : normalizedAmount;
  }

  const presetMinutes = Number(presetId);
  return Number.isFinite(presetMinutes) && presetMinutes > 0 ? presetMinutes : 60;
};

const buildMatchDateTime = (matchDate, matchTime) => {
  if (!matchDate) {
    return null;
  }

  const normalizedTime = String(matchTime ?? "")
    .trim()
    .toUpperCase();

  const timeValue = (() => {
    if (!normalizedTime || normalizedTime === "TBD") {
      return "00:00:00";
    }

    if (/^\d{2}:\d{2}$/.test(normalizedTime)) {
      return `${normalizedTime}:00`;
    }

    if (/^\d{2}:\d{2}:\d{2}$/.test(normalizedTime)) {
      return normalizedTime;
    }

    return normalizedTime;
  })();
  const matchDateTime = new Date(`${matchDate}T${timeValue}`);

  return Number.isNaN(matchDateTime.getTime()) ? null : matchDateTime;
};

const buildSendAt = (matchDate, matchTime, offsetMinutes) => {
  const matchDateTime = buildMatchDateTime(matchDate, matchTime);

  if (!matchDateTime) {
    return null;
  }

  return new Date(matchDateTime.getTime() - offsetMinutes * 60 * 1000).toISOString();
};

export const fetchCalendarMatchAlarmIds = async (userId) => {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from(SCHEDULED_NOTIFICATIONS_TABLE)
    .select("match_id, status, notification_type, created_at")
    .eq("user_id", userId)
    .eq("notification_type", MATCH_START_REMINDER_TYPE)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return [...new Set((data ?? []).map((item) => String(item.match_id)))];
};

export const fetchCalendarMatchAlarm = async (userId, matchId) => {
  if (!userId || !matchId) {
    return null;
  }

  const { data, error } = await supabase
    .from(SCHEDULED_NOTIFICATIONS_TABLE)
    .select("id, user_id, match_id, notification_type, send_at, status, payload, created_at")
    .eq("user_id", userId)
    .eq("match_id", String(matchId))
    .eq("notification_type", MATCH_START_REMINDER_TYPE)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const notification = data?.[0] ?? null;

  return notification ? normalizeScheduledNotification(notification) : null;
};

export const saveCalendarMatchAlarm = async (
  userId,
  { matchId, presetId, customAmount, customUnit, matchDate, matchTime },
) => {
  if (!userId || !matchId) {
    return null;
  }

  const offsetMinutes = getReminderOffsetMinutes({
    presetId,
    customAmount,
    customUnit,
  });
  const sendAt = buildSendAt(matchDate, matchTime, offsetMinutes);

  if (!sendAt) {
    throw new Error("Unable to calculate reminder time for this match.");
  }

  const payload = {
    presetId,
    customAmount:
      presetId === "custom" ? Number(customAmount) || null : Number(presetId),
    customUnit: presetId === "custom" ? customUnit : "minutes",
    offsetMinutes,
    matchDate,
    matchTime,
  };

  const existingNotificationQuery = await supabase
    .from(SCHEDULED_NOTIFICATIONS_TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("match_id", String(matchId))
    .eq("notification_type", MATCH_START_REMINDER_TYPE)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingNotificationQuery.error) {
    throw existingNotificationQuery.error;
  }

  const existingNotification = existingNotificationQuery.data?.[0] ?? null;

  if (existingNotification?.id) {
    const { data, error } = await supabase
      .from(SCHEDULED_NOTIFICATIONS_TABLE)
      .update({
        send_at: sendAt,
        status: "scheduled",
        payload,
      })
      .eq("id", existingNotification.id)
      .select("id, user_id, match_id, notification_type, send_at, status, payload, created_at")
      .single();

    if (error) {
      throw error;
    }

    return normalizeScheduledNotification(data);
  }

  const { data, error } = await supabase
    .from(SCHEDULED_NOTIFICATIONS_TABLE)
    .insert({
      user_id: userId,
      match_id: String(matchId),
      notification_type: MATCH_START_REMINDER_TYPE,
      send_at: sendAt,
      status: "scheduled",
      payload,
    })
    .select("id, user_id, match_id, notification_type, send_at, status, payload, created_at")
    .single();

  if (error) {
    throw error;
  }

  return normalizeScheduledNotification(data);
};

export const cancelCalendarMatchAlarm = async (userId, matchId) => {
  if (!userId || !matchId) {
    return null;
  }

  const existingAlarm = await fetchCalendarMatchAlarm(userId, matchId);

  if (!existingAlarm?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from(SCHEDULED_NOTIFICATIONS_TABLE)
    .update({ status: "canceled" })
    .eq("id", existingAlarm.id)
    .select("id, user_id, match_id, notification_type, send_at, status, payload, created_at")
    .single();

  if (error) {
    throw error;
  }

  return normalizeScheduledNotification(data);
};
