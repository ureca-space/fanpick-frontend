import { supabase } from "../lib/supabase.js";

const NOTIFICATION_PREFERENCES_TABLE = "notification_preferences";
const DEFAULT_MATCH_REMINDER_SETTINGS = {
  presetId: "60",
  customAmount: "15",
  customUnit: "minutes",
};

const normalizeNotificationPreferences = (preferences) => ({
  id: preferences.id,
  userId: preferences.user_id,
  pushEnabled: Boolean(preferences.push_enabled),
  matchStart10mEnabled: Boolean(preferences.match_start_10m_enabled),
  createdAt: preferences.created_at,
  updatedAt: preferences.updated_at,
  enabled: Boolean(preferences.enabled),
  matchStartReminderEnabled: Boolean(preferences.match_start_reminder_enabled),
  matchStartReminderOffsetMinutes:
    preferences.match_start_reminder_offset_minutes,
});

export const fetchNotificationPreferences = async (userId) => {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from(NOTIFICATION_PREFERENCES_TABLE)
    .select(
      "id, user_id, push_enabled, match_start_10m_enabled, created_at, updated_at, enabled, match_start_reminder_enabled, match_start_reminder_offset_minutes",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeNotificationPreferences(data) : null;
};

export const getDefaultMatchReminderSettings = (preferences) => {
  if (!preferences) {
    return DEFAULT_MATCH_REMINDER_SETTINGS;
  }

  const offsetMinutes = Number(preferences.matchStartReminderOffsetMinutes);

  if (
    preferences.matchStartReminderEnabled &&
    Number.isFinite(offsetMinutes) &&
    offsetMinutes > 0
  ) {
    if ([60, 30, 10, 5].includes(offsetMinutes)) {
      return {
        presetId: String(offsetMinutes),
        customAmount: "15",
        customUnit: "minutes",
      };
    }

    if (offsetMinutes >= 60 && offsetMinutes % 60 === 0) {
      return {
        presetId: "custom",
        customAmount: String(offsetMinutes / 60),
        customUnit: "hours",
      };
    }

    return {
      presetId: "custom",
      customAmount: String(offsetMinutes),
      customUnit: "minutes",
    };
  }

  if (preferences.matchStart10mEnabled) {
    return {
      presetId: "10",
      customAmount: "15",
      customUnit: "minutes",
    };
  }

  return DEFAULT_MATCH_REMINDER_SETTINGS;
};
