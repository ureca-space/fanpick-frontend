import { supabase } from "../lib/supabase";

const DEFAULT_DEBOUNCE_MS = 500;

const getChangedPostId = (payload) =>
  payload.new?.post_id ?? payload.old?.post_id ?? payload.new?.id ?? payload.old?.id;

export const subscribeToCommunityChanges = ({
  channelName,
  onChange,
  postId,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}) => {
  let refreshTimerId = null;
  const normalizedPostId = postId == null ? "" : String(postId);

  const shouldHandlePayload = (payload) => {
    if (!normalizedPostId) {
      return true;
    }

    return String(getChangedPostId(payload) ?? "") === normalizedPostId;
  };

  const scheduleRefresh = () => {
    if (refreshTimerId) {
      globalThis.clearTimeout(refreshTimerId);
    }

    refreshTimerId = globalThis.setTimeout(() => {
      onChange();
    }, debounceMs);
  };

  const handlePayload = (payload) => {
    if (shouldHandlePayload(payload)) {
      scheduleRefresh();
    }
  };

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "community_posts",
      },
      handlePayload,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "community_comments",
      },
      handlePayload,
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("커뮤니티 실시간 구독 연결에 실패했습니다.");
      }
    });

  return () => {
    if (refreshTimerId) {
      globalThis.clearTimeout(refreshTimerId);
    }

    supabase.removeChannel(channel);
  };
};
