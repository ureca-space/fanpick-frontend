const BASE_URL = "https://api.pandascore.co";
const LOL_API_KEY = import.meta.env.VITE_LOL_API_KEY;

// PandaScore의 UTC 시간을 한국 날짜(YYYY-MM-DD)로 변환합니다.
const formatKoreanDate = (dateString) => {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString));
};

// PandaScore의 UTC 시간을 한국 시간(HH:mm)으로 변환합니다.
const formatKoreanTime = (dateString) => {
  if (!dateString) return "--:--";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
};

// results 배열에서 해당 팀의 세트 스코어를 찾습니다.
const getTeamScore = (results, teamId) =>
  results?.find((result) => Number(result.team_id) === Number(teamId))?.score ??
  null;

// PandaScore 응답을 PredictionPage가 사용하는 공통 경기 형태로 바꿉니다.
const normalizeMatch = (match) => {
  const homeTeam = match.opponents?.[0]?.opponent;
  const awayTeam = match.opponents?.[1]?.opponent;

  return {
    id: `lol-${match.id}`,
    sourceId: match.id,
    dateKey: formatKoreanDate(match.begin_at),
    beginAt: match.begin_at,
    sport: "lol",
    sportLabel: "LoL",
    league: match.league?.name ?? "LoL",
    tournament: match.tournament?.name ?? "",
    time: formatKoreanTime(match.begin_at),
    status: match.status,
    // 참여자 수는 PandaScore에 없으므로 추후 Supabase 데이터로 교체합니다.
    participants: 0,
    homeTeam: {
      id: homeTeam?.id ?? null,
      name: homeTeam?.name ?? "미정",
      shortName: homeTeam?.acronym ?? homeTeam?.name?.slice(0, 1) ?? "홈",
      logo: homeTeam?.image_url ?? "",
    },
    awayTeam: {
      id: awayTeam?.id ?? null,
      name: awayTeam?.name ?? "미정",
      shortName: awayTeam?.acronym ?? awayTeam?.name?.slice(0, 1) ?? "원",
      logo: awayTeam?.image_url ?? "",
    },
    homeRate: 50,
    homeScore: getTeamScore(match.results, homeTeam?.id),
    awayScore: getTeamScore(match.results, awayTeam?.id),
    winnerId: match.winner?.id ?? null,
    isFinished: match.status === "finished",
  };
};

// 인증 헤더와 쿼리스트링 처리를 담당하는 공통 요청 함수입니다.
const requestLolApi = async (endpoint, params = {}) => {
  if (!LOL_API_KEY) {
    throw new Error(".env에 VITE_LOL_API_KEY를 추가해주세요.");
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${LOL_API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("PandaScore API 오류:", response.status, errorBody);
    throw new Error(`LoL 경기 호출에 실패했습니다. (${response.status})`);
  }

  return response.json();
};

// 전체 LoL 경기에서 upcoming, running, past 상태별로 요청합니다.
const fetchLolMatchesByStatus = async (status, sort) => {
  const matches = await requestLolApi(`/lol/matches/${status}`, {
    sort,
    "page[size]": 100,
  });

  return Array.isArray(matches)
    ? matches
        .filter((match) => match.opponents?.length === 2)
        .map(normalizeMatch)
    : [];
};

export const fetchUpcomingLolMatches = () =>
  fetchLolMatchesByStatus("upcoming", "begin_at");

export const fetchRunningLolMatches = () =>
  fetchLolMatchesByStatus("running", "begin_at");

export const fetchPastLolMatches = () =>
  fetchLolMatchesByStatus("past", "-begin_at");

// 지정한 한국 날짜 범위의 전체 LoL 경기를 한 번에 가져옵니다.
export const fetchLolMatchesByDateRange = async (startDate, endDate) => {
  const startAt = new Date(`${startDate}T00:00:00+09:00`).toISOString();
  const endAt = new Date(`${endDate}T23:59:59+09:00`).toISOString();
  const pageSize = 100;
  const allMatches = [];

  // 전체 LoL은 경기 수가 많으므로 마지막 페이지가 나올 때까지 반복합니다.
  for (let page = 1; page <= 10; page += 1) {
    const matches = await requestLolApi("/lol/matches", {
      "range[begin_at]": `${startAt},${endAt}`,
      sort: "begin_at",
      "page[size]": pageSize,
      "page[number]": page,
    });

    if (!Array.isArray(matches)) break;
    allMatches.push(...matches);
    if (matches.length < pageSize) break;
  }

  return allMatches
    .filter((match) => match.opponents?.length === 2)
    .map(normalizeMatch);
};

export const fetchAllLolMatches = async () => {
  // 세 요청은 서로 의존하지 않으므로 동시에 호출합니다.
  const [upcoming, running, past] = await Promise.all([
    fetchUpcomingLolMatches(),
    fetchRunningLolMatches(),
    fetchPastLolMatches(),
  ]);

  // 상태가 갱신되는 순간 같은 경기가 두 목록에 들어와도 하나만 남깁니다.
  const matchesById = new Map();
  [...running, ...upcoming, ...past].forEach((match) => {
    matchesById.set(match.id, match);
  });

  // 화면에서 날짜순으로 출력할 수 있도록 시작 시간이 빠른 순으로 정렬합니다.
  return [...matchesById.values()].sort(
    (a, b) => new Date(a.beginAt) - new Date(b.beginAt),
  );
};
