// 개발 중에는 Vite 프록시를 거쳐 호출하여 브라우저 CORS 차단을 피합니다.
const BASE_URL = "/football-api/v4";
const SOCCER_API_KEY = import.meta.env.VITE_SOCCER_API_KEY;

// football-data.org의 UTC 시간을 한국 날짜(YYYY-MM-DD)로 변환합니다.
const formatKoreanDate = (dateString) => {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString));
};

// football-data.org의 UTC 시간을 한국 시간(HH:mm)으로 변환합니다.
const formatKoreanTime = (dateString) => {
  if (!dateString) return "--:--";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
};

// football-data.org의 경기 상태를 화면에서 사용하는 상태로 바꿉니다.
const normalizeStatus = (status) => {
  if (status === "FINISHED") return "finished";

  if (status === "IN_PLAY" || status === "PAUSED" || status === "LIVE") {
    return "running";
  }

  if (status === "CANCELLED") return "canceled";
  if (status === "POSTPONED") return "postponed";

  return "not_started";
};

// football-data.org 응답을 PredictionPage가 사용하는 공통 형태로 바꿉니다.
const normalizeMatch = (match) => {
  const homeScore = match.score?.fullTime?.home ?? null;
  const awayScore = match.score?.fullTime?.away ?? null;

  return {
    // LoL 경기 ID와 겹치지 않도록 soccer- 접두사를 붙입니다.
    id: `soccer-${match.id}`,
    sourceId: match.id,
    dateKey: formatKoreanDate(match.utcDate),
    beginAt: match.utcDate,
    sport: "soccer",
    sportLabel: "축구",
    league: match.competition?.name ?? "EPL",
    tournament: match.season?.startDate
      ? `${match.season.startDate.slice(0, 4)}-${match.season.endDate?.slice(0, 4) ?? ""}`
      : "",
    time: formatKoreanTime(match.utcDate),
    status: normalizeStatus(match.status),

    // 참여자 수와 예측 비율은 추후 Supabase 집계값으로 교체합니다.
    participants: 0,
    homeRate: 50,

    homeTeam: {
      id: match.homeTeam?.id ?? null,
      name: match.homeTeam?.shortName ?? match.homeTeam?.name ?? "홈팀",
      shortName:
        match.homeTeam?.tla ?? match.homeTeam?.name?.slice(0, 1) ?? "홈",
      logo: match.homeTeam?.crest ?? "",
    },

    awayTeam: {
      id: match.awayTeam?.id ?? null,
      name: match.awayTeam?.shortName ?? match.awayTeam?.name ?? "원정팀",
      shortName:
        match.awayTeam?.tla ?? match.awayTeam?.name?.slice(0, 1) ?? "원",
      logo: match.awayTeam?.crest ?? "",
    },

    homeScore,
    awayScore,
    isFinished: match.status === "FINISHED",
  };
};

// football-data.org API를 호출하는 공통 함수입니다.
const requestSoccerApi = async (endpoint, params = {}) => {
  if (!SOCCER_API_KEY) {
    throw new Error(".env에 VITE_SOCCER_API_KEY를 추가해주세요.");
  }

  const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": SOCCER_API_KEY,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("football-data.org API 오류:", response.status, errorBody);

    if (response.status === 401 || response.status === 403) {
      throw new Error("축구 API 키가 없거나 사용할 권한이 없습니다.");
    }

    if (response.status === 429) {
      throw new Error("축구 API 요청 한도를 초과했습니다.");
    }

    throw new Error(`EPL 경기 호출에 실패했습니다. (${response.status})`);
  }

  return response.json();
};

/**
 * 지정한 날짜 범위에서 무료 플랜으로 접근 가능한 전체 축구 경기를 가져옵니다.
 * 함수 이름은 기존 import 호환을 위해 그대로 유지합니다.
 */
export const fetchEplMatchesByDateRange = async (dateFrom, dateTo) => {
  const data = await requestSoccerApi("/matches", {
    dateFrom,
    dateTo,
  });

  return Array.isArray(data.matches) ? data.matches.map(normalizeMatch) : [];
};
