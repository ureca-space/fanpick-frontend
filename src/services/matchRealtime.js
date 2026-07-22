import { supabase } from "../lib/supabase";

const DEFAULT_DEBOUNCE_MS = 500;

export const subscribeToMatchChanges = ({
  channelName,
  onChange,
  shouldHandlePayload = () => true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}) => {
  let refreshTimerId = null;

  const scheduleRefresh = () => {
    if (refreshTimerId) {
      globalThis.clearTimeout(refreshTimerId);
    }

    refreshTimerId = globalThis.setTimeout(() => {
      onChange();
    }, debounceMs);
  };

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "matches",
      },
      (payload) => {
        if (shouldHandlePayload(payload)) {
          scheduleRefresh();
        }
      },
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("경기 실시간 구독 연결에 실패했습니다.");
      }
    });

  return () => {
    if (refreshTimerId) {
      globalThis.clearTimeout(refreshTimerId);
    }

    supabase.removeChannel(channel);
  };
};
