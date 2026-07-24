import { supabase } from "../lib/supabase.js";

const FAVORITE_TEAMS_TABLE = "favorite_teams";
const FAVORITE_TEAMS_STORAGE_PREFIX = "fanpick:favorite-teams";
export const FAVORITE_TEAMS_CHANGED_EVENT = "fanpick:favorite-teams-changed";

const getStorageKey = (userId) => `${FAVORITE_TEAMS_STORAGE_PREFIX}:${userId}`;

const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

const normalizeTeamIds = (teamIds) =>
  [
    ...new Set(
      (Array.isArray(teamIds) ? teamIds : [])
        .filter((teamId) => typeof teamId === "string")
        .map((teamId) => teamId.trim())
        .filter(Boolean),
    ),
  ];

const dispatchFavoriteTeamsChanged = (userId, teamIds) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(FAVORITE_TEAMS_CHANGED_EVENT, {
      detail: {
        userId,
        teamIds,
      },
    }),
  );
};

const warnRemoteFailure = (action, error) => {
  console.warn(`관심 팀 ${action} 중 Supabase 요청이 실패했습니다.`, error);
};

export const getFavoriteTeamIds = (userId) => {
  if (!userId || !canUseStorage()) {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(getStorageKey(userId));
    const parsedValue = JSON.parse(storedValue || "[]");

    return Array.isArray(parsedValue)
      ? parsedValue.filter((teamId) => typeof teamId === "string")
      : [];
  } catch {
    return [];
  }
};

const setLocalFavoriteTeamIds = (
  userId,
  teamIds,
  { shouldDispatch = true } = {},
) => {
  if (!userId || !canUseStorage()) {
    return [];
  }

  const uniqueTeamIds = normalizeTeamIds(teamIds);

  window.localStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(uniqueTeamIds),
  );

  if (shouldDispatch) {
    dispatchFavoriteTeamsChanged(userId, uniqueTeamIds);
  }

  return uniqueTeamIds;
};

const fetchRemoteFavoriteTeamIds = async (userId) => {
  const { data, error } = await supabase
    .from(FAVORITE_TEAMS_TABLE)
    .select("team_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return normalizeTeamIds((data || []).map((favoriteTeam) => favoriteTeam.team_id));
};

const setRemoteFavoriteTeamIds = async (userId, teamIds) => {
  const nextTeamIds = normalizeTeamIds(teamIds);
  const currentTeamIds = await fetchRemoteFavoriteTeamIds(userId);
  const teamIdsToRemove = currentTeamIds.filter(
    (teamId) => !nextTeamIds.includes(teamId),
  );
  const teamIdsToAdd = nextTeamIds.filter(
    (teamId) => !currentTeamIds.includes(teamId),
  );

  if (teamIdsToRemove.length > 0) {
    const { error } = await supabase
      .from(FAVORITE_TEAMS_TABLE)
      .delete()
      .eq("user_id", userId)
      .in("team_id", teamIdsToRemove);

    if (error) {
      throw error;
    }
  }

  if (teamIdsToAdd.length > 0) {
    const { error } = await supabase.from(FAVORITE_TEAMS_TABLE).upsert(
      teamIdsToAdd.map((teamId) => ({
        user_id: userId,
        team_id: teamId,
      })),
      {
        onConflict: "user_id,team_id",
        ignoreDuplicates: true,
      },
    );

    if (error) {
      throw error;
    }
  }

  return nextTeamIds;
};

export const fetchFavoriteTeamIds = async (userId) => {
  if (!userId) {
    return [];
  }

  const localTeamIds = getFavoriteTeamIds(userId);

  try {
    const remoteTeamIds = await fetchRemoteFavoriteTeamIds(userId);

    if (remoteTeamIds.length === 0 && localTeamIds.length > 0) {
      const migratedTeamIds = await setRemoteFavoriteTeamIds(userId, localTeamIds);

      setLocalFavoriteTeamIds(userId, migratedTeamIds, {
        shouldDispatch: false,
      });

      return migratedTeamIds;
    }

    setLocalFavoriteTeamIds(userId, remoteTeamIds, {
      shouldDispatch: false,
    });

    return remoteTeamIds;
  } catch (error) {
    warnRemoteFailure("조회", error);
    return localTeamIds;
  }
};

export const setFavoriteTeamIds = async (userId, teamIds) => {
  if (!userId) {
    return [];
  }

  const nextTeamIds = normalizeTeamIds(teamIds);

  try {
    const savedTeamIds = await setRemoteFavoriteTeamIds(userId, nextTeamIds);

    return setLocalFavoriteTeamIds(userId, savedTeamIds);
  } catch (error) {
    warnRemoteFailure("저장", error);

    return setLocalFavoriteTeamIds(userId, nextTeamIds);
  }
};

export const toggleFavoriteTeamId = async (
  userId,
  teamId,
  currentTeamIds,
) => {
  const favoriteTeamIds = Array.isArray(currentTeamIds)
    ? normalizeTeamIds(currentTeamIds)
    : await fetchFavoriteTeamIds(userId);

  if (favoriteTeamIds.includes(teamId)) {
    return setFavoriteTeamIds(
      userId,
      favoriteTeamIds.filter((favoriteTeamId) => favoriteTeamId !== teamId),
    );
  }

  return setFavoriteTeamIds(userId, [...favoriteTeamIds, teamId]);
};
