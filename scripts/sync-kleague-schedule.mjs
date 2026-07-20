import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const KLEAGUE_SCHEDULE_API_URL = "https://www.kleague.com/getScheduleList.do";

const KLEAGUE_SCHEDULE_PAGE_URL = "https://www.kleague.com/schedule.do";

const { SUPABASE_URL, SUPABASE_SERVER_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVER_KEY) {
  throw new Error(
    ".env.sync의 SUPABASE_URL과 SUPABASE_SERVER_KEY를 확인해 주세요.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVER_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const LEAGUES = [
  {
    id: "1",
    name: "K LEAGUE 1",
  },
  {
    id: "2",
    name: "K LEAGUE 2",
  },
];

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

const createSlug = (value) => {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "");
};

const normalizeDate = (value) => {
  const rawDate = cleanText(value);

  if (/^\d{8}$/.test(rawDate)) {
    return [rawDate.slice(0, 4), rawDate.slice(4, 6), rawDate.slice(6, 8)].join(
      "-",
    );
  }

  if (/^\d{4}[.-]\d{2}[.-]\d{2}$/.test(rawDate)) {
    return rawDate.replace(/\./g, "-");
  }

  return "";
};

const normalizeTime = (value) => {
  const rawTime = cleanText(value);

  if (/^\d{4}$/.test(rawTime)) {
    return `${rawTime.slice(0, 2)}:${rawTime.slice(2, 4)}`;
  }

  if (/^\d{2}:\d{2}$/.test(rawTime)) {
    return rawTime;
  }

  return "";
};

const normalizeScore = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const score = Number(value);

  return Number.isFinite(score) ? score : null;
};

const getKoreaYearMonth = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);

  const month = Number(parts.find((part) => part.type === "month")?.value);

  if (!year || !month) {
    throw new Error("한국 시간 기준 현재 연월을 계산하지 못했습니다.");
  }

  return {
    year,
    month,
  };
};

const getKoreaDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const getScheduleTargets = () => {
  const { year, month } = getKoreaYearMonth();

  /*
   * 현재 월부터 세 달을 수집한다.
   * 연도가 넘어가도 Date가 자동으로 처리한다.
   */
  return Array.from({ length: 3 }, (_, index) => {
    const targetDate = new Date(Date.UTC(year, month - 1 + index, 1));

    return {
      year: targetDate.getUTCFullYear(),
      month: targetDate.getUTCMonth() + 1,
    };
  });
};

const fetchWithRetry = async (url, options, retryCount = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt < retryCount) {
        console.warn(`K리그 일정 요청 ${attempt}회 실패, 재시도합니다.`);

        await sleep(attempt * 1_000);
      }
    }
  }

  throw lastError;
};

const fetchKLeagueSchedule = async ({ leagueId, year, month }) => {
  const response = await fetchWithRetry(KLEAGUE_SCHEDULE_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      "Content-Type": "application/json; charset=UTF-8",
      Origin: "https://www.kleague.com",
      Referer: `${KLEAGUE_SCHEDULE_PAGE_URL}?leagueId=${leagueId}`,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({
      leagueId: String(leagueId),
      teamId: "",
      year: String(year),
      month: String(month).padStart(2, "0"),
      ticketYn: "",
    }),
  });

  const responseData = await response.json();

  const scheduleList =
    responseData?.data?.scheduleList ??
    responseData?.data?.gameList ??
    responseData?.data?.list ??
    [];

  if (!Array.isArray(scheduleList)) {
    throw new Error("K리그 일정 응답의 scheduleList 형식을 확인해 주세요.");
  }

  return scheduleList;
};

const getStatus = ({ match, date, awayScore, homeScore }) => {
  const statusText = [match.gameStatus, match.codeName, match.meetName]
    .map(cleanText)
    .join(" ");

  if (/연기|postponed/i.test(statusText)) {
    return "postponed";
  }

  if (/취소|중단|cancelled|canceled/i.test(statusText)) {
    return "cancelled";
  }

  /*
   * 미래 경기의 0:0 값을 종료 경기로 잘못 판단하지 않도록
   * 오늘 이후 경기는 항상 scheduled로 처리한다.
   */
  if (date > getKoreaDate()) {
    return "scheduled";
  }

  if (String(match.endYn).toUpperCase() === "Y") {
    return "finished";
  }

  if (/종료|finished|end/i.test(statusText)) {
    return "finished";
  }

  if (awayScore !== null && homeScore !== null) {
    return "finished";
  }

  return "scheduled";
};

const parseKLeagueSchedule = ({ matches, league }) => {
  const games = [];
  const matchupCounts = new Map();

  matches.forEach((match) => {
    const date = normalizeDate(
      match.gameDate ?? match.meetDate ?? match.matchDate,
    );

    const time = normalizeTime(
      match.gameTime ?? match.meetTime ?? match.matchTime,
    );

    const awayTeamCode = cleanText(
      match.awayTeam ?? match.awayTeamId ?? match.awayId,
    );

    const homeTeamCode = cleanText(
      match.homeTeam ?? match.homeTeamId ?? match.homeId,
    );

    const awayTeamName = cleanText(match.awayTeamName ?? match.awayName);

    const homeTeamName = cleanText(match.homeTeamName ?? match.homeName);

    if (
      !date ||
      !awayTeamCode ||
      !homeTeamCode ||
      !awayTeamName ||
      !homeTeamName
    ) {
      return;
    }

    const awayScore = normalizeScore(match.awayGoal ?? match.awayScore);

    const homeScore = normalizeScore(match.homeGoal ?? match.homeScore);

    const status = getStatus({
      match,
      date,
      awayScore,
      homeScore,
    });

    const officialGameId = cleanText(
      match.gameId ?? match.meetSeq ?? match.gameSeq ?? match.gameNo,
    );

    const matchupKey = [league.id, date, awayTeamCode, homeTeamCode].join("-");

    const matchupSequence = (matchupCounts.get(matchupKey) ?? 0) + 1;

    matchupCounts.set(matchupKey, matchupSequence);

    const externalId = officialGameId
      ? [
          "kleague",
          league.id,
          String(match.year || date.slice(0, 4)),
          officialGameId,
        ].join("-")
      : [
          "kleague",
          league.id,
          date,
          createSlug(awayTeamCode),
          createSlug(homeTeamCode),
          matchupSequence,
        ].join("-");

    const score =
      status === "finished" && awayScore !== null && homeScore !== null
        ? `${awayScore}:${homeScore}`
        : "";

    games.push({
      id: externalId,
      externalId,
      sport: "soccer",
      league: league.name,
      date,
      time,
      gameType: "REGULAR",
      awayTeam: awayTeamCode,
      homeTeam: homeTeamCode,
      awayTeamName,
      homeTeamName,
      score,
      status,
      broadcast: cleanText(
        match.broadcastName ?? match.broadcast ?? match.relayName,
      ),
      stadium: cleanText(
        match.fieldNameFull ??
          match.fieldName ??
          match.stadiumName ??
          match.venue,
      ),
      note: cleanText(match.gameStatus ?? match.codeName),
    });
  });

  return games;
};

const collectSchedules = async (targets) => {
  const monthlySchedules = [];

  for (const target of targets) {
    const monthlyGames = [];

    for (const league of LEAGUES) {
      const matches = await fetchKLeagueSchedule({
        leagueId: league.id,
        year: target.year,
        month: target.month,
      });

      const games = parseKLeagueSchedule({
        matches,
        league,
      });

      console.log(
        `${target.year}-${String(target.month).padStart(
          2,
          "0",
        )} ${league.name} 경기 ${games.length}개 추출`,
      );

      monthlyGames.push(...games);

      /*
       * 공식 서버에 짧은 시간 동안 요청이 몰리지 않도록
       * 요청 사이에 잠깐 대기한다.
       */
      await sleep(300);
    }

    monthlySchedules.push({
      target,
      games: monthlyGames.sort((firstGame, secondGame) =>
        `${firstGame.date} ${firstGame.time}`.localeCompare(
          `${secondGame.date} ${secondGame.time}`,
        ),
      ),
    });
  }

  return monthlySchedules;
};

const saveSchedulesToJson = async (monthlySchedules) => {
  const dataDirectory = path.resolve("public", "data");

  await mkdir(dataDirectory, {
    recursive: true,
  });

  const outputPaths = [];

  for (const { target, games } of monthlySchedules) {
    const scheduleMonth = [
      target.year,
      String(target.month).padStart(2, "0"),
    ].join("-");

    const outputPath = path.join(
      dataDirectory,
      `kleague-${scheduleMonth}.json`,
    );

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
    source: "KLEAGUE_OFFICIAL",
    source_url: KLEAGUE_SCHEDULE_PAGE_URL,
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
    const targets = getScheduleTargets();

    console.log(
      `K리그 일정 수집 대상: ${targets
        .map(({ year, month }) => `${year}-${String(month).padStart(2, "0")}`)
        .join(", ")}`,
    );

    const monthlySchedules = await collectSchedules(targets);

    const games = monthlySchedules
      .flatMap((schedule) => schedule.games)
      .sort((firstGame, secondGame) =>
        `${firstGame.date} ${firstGame.time}`.localeCompare(
          `${secondGame.date} ${secondGame.time}`,
        ),
      );

    if (games.length === 0) {
      throw new Error("현재 월부터 세 달 동안 추출된 K리그 경기가 없습니다.");
    }

    const outputPaths = await saveSchedulesToJson(monthlySchedules);

    const syncedCount = await syncScheduleToSupabase(games);

    console.log(`K리그 경기 총 ${games.length}개 추출 완료`);

    outputPaths.forEach((outputPath) => {
      console.log(`JSON 저장 위치: ${outputPath}`);
    });

    console.log(`Supabase 경기 ${syncedCount}개 동기화 완료`);
  } catch (error) {
    console.error("K리그 일정 동기화 실패");

    console.error(error instanceof Error ? error.message : error);

    process.exitCode = 1;
  }
};

main();
