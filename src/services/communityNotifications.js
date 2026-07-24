import { supabase } from "../lib/supabase";

const NOTIFICATION_SELECT_FIELDS = `
  id,
  user_id,
  actor_user_id,
  post_id,
  comment_id,
  type,
  title,
  message,
  is_read,
  created_at
`;

const DEFAULT_NOTIFICATION_LIMIT = 10;

const createNotificationChannelName = (userId) => {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `community-notifications-${userId}-${suffix}`;
};

const isMissingNotificationTableError = (error) => error?.code === "42P01";

const normalizeNotification = (notification) => ({
  id: notification.id,
  userId: notification.user_id,
  actorUserId: notification.actor_user_id,
  postId: notification.post_id,
  commentId: notification.comment_id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  isRead: Boolean(notification.is_read),
  createdAt: notification.created_at,
});

export const fetchCommunityNotifications = async (
  userId,
  limit = DEFAULT_NOTIFICATION_LIMIT,
) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("community_notifications")
    .select(NOTIFICATION_SELECT_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingNotificationTableError(error)) {
      console.warn("커뮤니티 알림 테이블이 아직 준비되지 않았습니다.");
      return [];
    }

    throw error;
  }

  return (data ?? []).map(normalizeNotification);
};

export const markCommunityNotificationRead = async (notificationId, userId) => {
  if (!notificationId || !userId) return;

  const { error } = await supabase
    .from("community_notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error && !isMissingNotificationTableError(error)) {
    throw error;
  }
};

export const markAllCommunityNotificationsRead = async (userId) => {
  if (!userId) return;

  const { error } = await supabase
    .from("community_notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error && !isMissingNotificationTableError(error)) {
    throw error;
  }
};

export const subscribeToCommunityNotificationChanges = ({
  userId,
  onChange,
}) => {
  if (!userId) return () => {};

  let channel = null;

  try {
    channel = supabase
      .channel(createNotificationChannelName(userId))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_notifications",
          filter: `user_id=eq.${userId}`,
        },
        onChange,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("커뮤니티 알림 실시간 구독 연결에 실패했습니다.");
        }
      });
  } catch (error) {
    console.error("커뮤니티 알림 실시간 구독 초기화 오류:", error);
    return () => {};
  }

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
};
