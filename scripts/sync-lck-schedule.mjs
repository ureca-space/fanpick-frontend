import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PANDASCORE_API_URL = "https://api.pandascore.co";
const PANDASCORE_SOURCE_URL = "https://www.pandascore.co";

const { SUPABASE_URL, SUPABASE_SERVER_KEY, PANDASCORE_API_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVER_KEY) {
  throw new Error(
    ".env.sync의 SUPABASE_URL과 SUPABASE_SERVER_KEY를 확인해 주세요.",
  );
}

if (!PANDASCORE_API_KEY) {
  throw new Error(".env.sync의 PANDASCORE_API_KEY를 확인해 주세요.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVER_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const sleep = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

const cleanText = (value) => {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
};

const createTeamCode = (team) => {
  const source = team?.acronym || team?.slug || team?.name || team?.id;

  return cleanText(source)
    .toUpperCase()
    .replace(/[^A-Z0-9가-힣]/g, "")
    .slice(0, 30);
};

const fetchPandaScore = async (pathname, searchParams = {}) => {
  const url = new URL(pathname, PANDASCORE_API_URL);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${PANDASCORE_API_KEY}`,
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const responseText = await response.text();

        throw new Error(
          `${response.status} ${response.statusText}${
            responseText ? ` - ${responseText.slice(0, 300)}` : ""
          }`,
        );
      }

      return {
        data: await response.json(),
        headers: response.headers,
      };
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        console.warn(`PandaScore 요청 ${attempt}회 실패, 재시도합니다.`);

        await sleep(attempt * 1_000);
      }
    }
  }

  throw lastError;
};

const fetchAllPages = async (pathname, searchParams = {}, maxPages = 10) => {
  const results = [];
  const pageSize = 100;

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const { data } = await fetchPandaScore(pathname, {
      ...searchParams,
      "page[size]": pageSize,
      "page[number]": pageNumber,
    });

    if (!Array.isArray(data)) {
      throw new Error(`${pathname} 응답이 배열 형식이 아닙니다.`);
    }

    results.push(...data);

    if (data.length < pageSize) {
      break;
    }
  }

  return results;
};

const findLckLeague = async () => {
  const { data } = await fetchPandaScore("/lol/leagues", {
    "search[name]": "LCK",
    "page[size]": 100,
    "page[number]": 1,
  });

  if (!Array.isArray(data)) {
    throw new Error("PandaScore 리그 응답 형식을 확인해 주세요.");
  }

  const exactLeague = data.find((league) => {
    const name = cleanText(league?.name).toLowerCase();

    const slug = cleanText(league?.slug).toLowerCase();

    return name === "lck" || slug === "lck";
  });

  if (exactLeague) {
    return exactLeague;
  }

  const fallbackLeague = data.find((league) => {
    const searchableText = [league?.name, league?.slug]
      .map(cleanText)
      .join(" ")
      .toLowerCase();

    return (
      searchableText.includes("lck") &&
      !searchableText.includes("challenger") &&
      !searchableText.includes("academy")
    );
  });

  if (!fallbackLeague) {
    const foundLeagueNames = data
      .map((league) => cleanText(league?.name))
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `PandaScore에서 LCK 리그를 찾지 못했습니다.${
        foundLeagueNames ? ` 검색 결과: ${foundLeagueNames}` : ""
      }`,
    );
  }

  return fallbackLeague;
};

const getKoreaDateParts = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const getPart = (type) => {
    return parts.find((part) => part.type === type)?.value ?? "";
  };

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");

  if (!year || !month || !day || !hour || !minute) {
    return null;
  }

  return {
    year,
    month,
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
};

const getMatchStatus = (status) => {
  const normalizedStatus = cleanText(status).toLowerCase();

  if (["finished", "completed"].includes(normalizedStatus)) {
    return "finished";
  }

  if (["canceled", "cancelled"].includes(normalizedStatus)) {
    return "cancelled";
  }

  if (["postponed", "delayed"].includes(normalizedStatus)) {
    return "postponed";
  }

  if (["running", "in_progress"].includes(normalizedStatus)) {
    return "live";
  }

  return "scheduled";
};

const getGameType = (match) => {
  const stageText = [
    match?.tournament?.name,
    match?.serie?.name,
    match?.serie?.full_name,
    match?.name,
  ]
    .map(cleanText)
    .join(" ");

  if (/playoff|knockout|final|결승|플레이오프/i.test(stageText)) {
    return "POSTSEASON";
  }

  return "REGULAR";
};

const getTeamScore = (match, teamId) => {
  const result = (match?.results ?? []).find(
    (item) => String(item?.team_id) === String(teamId),
  );

  const score = Number(result?.score);

  return Number.isFinite(score) ? score : null;
};

const parseLckMatch = (match) => {
  const opponents = (match?.opponents ?? [])
    .map((item) => item?.opponent)
    .filter(Boolean);

  if (opponents.length < 2 || !match?.begin_at || !match?.id) {
    return null;
  }

  const homeTeam = opponents[0];
  const awayTeam = opponents[1];

  const homeTeamCode = createTeamCode(homeTeam);

  const awayTeamCode = createTeamCode(awayTeam);

  const koreaDate = getKoreaDateParts(match.begin_at);

  if (!homeTeamCode || !awayTeamCode || !koreaDate) {
    return null;
  }

  const status = getMatchStatus(match.status);

  const homeScore = getTeamScore(match, homeTeam.id);

  const awayScore = getTeamScore(match, awayTeam.id);

  const hasScore = homeScore !== null && awayScore !== null;

  return {
    id: `pandascore-lck-${match.id}`,
    externalId: `pandascore-lck-${match.id}`,

    sport: "esports",
    league: "LCK",

    date: koreaDate.date,
    time: koreaDate.time,
    year: koreaDate.year,
    month: koreaDate.month,

    gameType: getGameType(match),

    homeTeam: homeTeamCode,
    awayTeam: awayTeamCode,

    homeTeamName: cleanText(homeTeam.name) || homeTeamCode,

    awayTeamName: cleanText(awayTeam.name) || awayTeamCode,

    homeTeamLogo: cleanText(homeTeam.image_url),

    awayTeamLogo: cleanText(awayTeam.image_url),

    /*
     * 기존 KBO·K리그와 동일하게
     * 원정팀 점수:홈팀 점수 순서로 저장한다.
     */
    score: hasScore ? `${awayScore}:${homeScore}` : "",

    status,

    broadcast: "LCK",

    stadium: cleanText(match?.venue?.name) || "LoL PARK",

    note: [
      cleanText(match?.serie?.full_name || match?.serie?.name),
      cleanText(match?.tournament?.name),
      cleanText(match?.match_type),
    ]
      .filter(Boolean)
      .join(" · "),
  };
};

const fetchLckMatches = async (leagueId) => {
  const upcomingMatches = await fetchAllPages(
    `/leagues/${leagueId}/matches/upcoming`,
    {
      sort: "begin_at",
    },
  );

  const runningMatches = await fetchAllPages(
    `/leagues/${leagueId}/matches/running`,
    {
      sort: "begin_at",
    },
    2,
  );

  let recentlyFinishedMatches = [];

  try {
    const finishedMatches = await fetchAllPages(
      `/leagues/${leagueId}/matches`,
      {
        "filter[status]": "finished",
        sort: "-begin_at",
      },
      1,
    );

    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1_000;

    recentlyFinishedMatches = finishedMatches.filter((match) => {
      const matchTime = new Date(match?.begin_at).getTime();

      return Number.isFinite(matchTime) && matchTime >= fourteenDaysAgo;
    });
  } catch (error) {
    console.warn(
      `최근 종료 경기 조회를 건너뜁니다: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }

  const uniqueMatches = new Map();

  [...recentlyFinishedMatches, ...runningMatches, ...upcomingMatches].forEach(
    (match) => {
      if (match?.id) {
        uniqueMatches.set(String(match.id), match);
      }
    },
  );

  return [...uniqueMatches.values()];
};

const groupMatchesByMonth = (games) => {
  const schedules = new Map();

  games.forEach((game) => {
    const scheduleMonth = [game.year, game.month].join("-");

    if (!schedules.has(scheduleMonth)) {
      schedules.set(scheduleMonth, []);
    }

    schedules.get(scheduleMonth).push(game);
  });

  return [...schedules.entries()]
    .sort(([firstMonth], [secondMonth]) =>
      firstMonth.localeCompare(secondMonth),
    )
    .map(([scheduleMonth, monthlyGames]) => ({
      scheduleMonth,

      games: monthlyGames.sort((firstGame, secondGame) =>
        `${firstGame.date} ${firstGame.time}`.localeCompare(
          `${secondGame.date} ${secondGame.time}`,
        ),
      ),
    }));
};

const saveSchedulesToJson = async (monthlySchedules) => {
  const dataDirectory = path.resolve("public", "data");

  await mkdir(dataDirectory, {
    recursive: true,
  });

  const outputPaths = [];

  for (const { scheduleMonth, games } of monthlySchedules) {
    const outputPath = path.join(dataDirectory, `lck-${scheduleMonth}.json`);

    await writeFile(outputPath, JSON.stringify(games, null, 2), "utf8");

    outputPaths.push(outputPath);
  }

  return outputPaths;
};

const syncScheduleToSupabase = async (games) => {
  if (games.length === 0) {
    return 0;
  }

  const updatedAt = new Date().toISOString();

  const rows = games.map((game) => ({
    external_id: game.externalId,
    sport: game.sport,
    league: game.league,

    match_date: game.date,

    match_time: game.time ? `${game.time}:00` : null,

    game_type: game.gameType,

    away_team_code: game.awayTeam,
    home_team_code: game.homeTeam,

    score: game.score || null,
    status: game.status,

    venue: game.stadium || null,

    broadcast: game.broadcast || null,

    note: game.note || null,

    source: "PANDASCORE",

    source_url: PANDASCORE_SOURCE_URL,

    updated_at: updatedAt,
  }));

  const { error } = await supabase.from("matches").upsert(rows, {
    onConflict: "external_id",
  });

  if (error) {
    throw new Error(`Supabase 저장 실패: ${error.message}`);
  }

  return rows.length;
};

const main = async () => {
  try {
    const lckLeague = await findLckLeague();

    console.log(
      `PandaScore LCK 리그 확인: ${lckLeague.name} (${lckLeague.id})`,
    );

    const rawMatches = await fetchLckMatches(lckLeague.id);

    const games = rawMatches
      .map(parseLckMatch)
      .filter(Boolean)
      .sort((firstGame, secondGame) =>
        `${firstGame.date} ${firstGame.time}`.localeCompare(
          `${secondGame.date} ${secondGame.time}`,
        ),
      );

    if (games.length === 0) {
      throw new Error("PandaScore에서 팀이 확정된 LCK 일정을 찾지 못했습니다.");
    }

    const monthlySchedules = groupMatchesByMonth(games);

    const outputPaths = await saveSchedulesToJson(monthlySchedules);

    const syncedCount = await syncScheduleToSupabase(games);

    console.log(`LCK 경기 총 ${games.length}개 추출 완료`);

    outputPaths.forEach((outputPath) => {
      console.log(`JSON 저장 위치: ${outputPath}`);
    });

    console.log(`Supabase 경기 ${syncedCount}개 동기화 완료`);
  } catch (error) {
    console.error("LCK 일정 동기화 실패");

    console.error(error instanceof Error ? error.message : error);

    process.exitCode = 1;
  }
};

main();
