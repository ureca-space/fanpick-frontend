import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const KBO_SCHEDULE_API_URL =
  "https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList";

const KBO_SCHEDULE_PAGE_URL =
  "https://www.koreabaseball.com/Schedule/Schedule.aspx";

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

const TEAM_CODES = {
  LG: "LG",
  한화: "HANWHA",
  SSG: "SSG",
  삼성: "SAMSUNG",
  NC: "NC",
  KT: "KT",
  롯데: "LOTTE",
  KIA: "KIA",
  두산: "DOOSAN",
  키움: "KIWOOM",
  나눔: "NANUM",
  드림: "DREAM",
};

const cleanCell = (html = "") => {
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
};

const createSlug = (value) => {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
};

const normalizeTeamCode = (teamName) => {
  const matchedTeam = Object.entries(TEAM_CODES).find(([keyword]) =>
    teamName.includes(keyword),
  );

  return matchedTeam?.[1] ?? teamName;
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

  return { year, month };
};

const getScheduleTargets = () => {
  const { year, month } = getKoreaYearMonth();

  return Array.from({ length: 4 }, (_, index) => {
    /*
     * Date의 month는 0부터 시작한다.
     * 현재 month - 2에 index를 더해 이전 월부터 계산한다.
     *
     * 1월 → 이전 해 12월처럼 역방향 연도 변경과
     * 11월 → 12월 → 다음 해 1월처럼 순방향 연도 변경이
     * 연도가 넘어가는 경우도 자동 처리된다.
     */
    const targetDate = new Date(Date.UTC(year, month - 2 + index, 1));

    return {
      year: targetDate.getUTCFullYear(),
      month: targetDate.getUTCMonth() + 1,
    };
  });
};

const fetchKboSchedule = async ({ year, month }) => {
  const body = new URLSearchParams({
    leId: "1",
    srIdList: "0,1,3,4,5,6,7,9",
    seasonId: String(year),
    gameMonth: String(month).padStart(2, "0"),
    teamId: "",
  });

  const response = await fetch(KBO_SCHEDULE_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Origin: "https://www.koreabaseball.com",
      Referer: KBO_SCHEDULE_PAGE_URL,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const targetMonth = `${year}-${String(month).padStart(2, "0")}`;

    throw new Error(
      `${targetMonth} KBO 일정 요청 실패: ${response.status} ${response.statusText}`,
    );
  }

  const responseData = await response.json();

  /*
   * ASP.NET 응답에 따라 실제 데이터가
   * responseData.d 안에 JSON 문자열로 들어올 수 있다.
   */
  if (typeof responseData.d === "string") {
    return JSON.parse(responseData.d);
  }

  return responseData.d ?? responseData;
};

const findCellByClass = (cells, className) => {
  return cells.find((cell) => cell?.Class === className);
};

const findCellByClasses = (cells, classNames) => {
  return cells.find((cell) => classNames.includes(cell?.Class));
};

const parsePlayCell = (html = "") => {
  const spans = [
    ...String(html).matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi),
  ].map((match) => cleanCell(match[1]));

  const versusIndex = spans.findIndex((value) => value.toLowerCase() === "vs");

  if (versusIndex < 0) {
    return null;
  }

  const parseScore = (value) => {
    return /^\d+$/.test(value) ? Number(value) : null;
  };

  const awayTeamName = spans[0] ?? "";
  const homeTeamName = spans.at(-1) ?? "";

  const awayScore = spans
    .slice(1, versusIndex)
    .map(parseScore)
    .find((score) => score !== null);

  const homeScore = spans
    .slice(versusIndex + 1, -1)
    .map(parseScore)
    .find((score) => score !== null);

  if (!awayTeamName || !homeTeamName) {
    return null;
  }

  return {
    awayTeam: normalizeTeamCode(awayTeamName),
    homeTeam: normalizeTeamCode(homeTeamName),
    awayScore: awayScore ?? null,
    homeScore: homeScore ?? null,
  };
};

const getGameStatus = ({ awayScore, homeScore, rowText }) => {
  if (/연기|그라운드사정|postponed/i.test(rowText)) {
    return "postponed";
  }

  if (/취소|노게임|cancelled|canceled/i.test(rowText)) {
    return "cancelled";
  }

  if (awayScore !== null && homeScore !== null) {
    if (
      /경기중|진행|라이브|live|playing|in progress|\d+\s*회(?:초|말)/i.test(
        rowText,
      ) &&
      !/종료|final|finished/i.test(rowText)
    ) {
      return "live";
    }

    return "finished";
  }

  return "scheduled";
};

const getGameType = ({ awayTeam, homeTeam, rowText }) => {
  if (
    /올스타|allstar/i.test(rowText) ||
    [awayTeam, homeTeam].some((team) => ["NANUM", "DREAM"].includes(team))
  ) {
    return "ALLSTAR";
  }

  if (/시범|preseason/i.test(rowText)) {
    return "PRESEASON";
  }

  if (/포스트|와일드카드|준플레이오프|플레이오프|한국시리즈/i.test(rowText)) {
    return "POSTSEASON";
  }

  return "REGULAR";
};

const parseKboSchedule = (scheduleData, targetYear) => {
  const rows = scheduleData?.rows ?? [];

  let currentMonth = null;
  let currentDay = null;

  const games = [];
  const matchupCounts = new Map();

  rows.forEach((rowObject) => {
    const cells = rowObject?.row ?? [];

    if (cells.length === 0) {
      return;
    }

    /*
     * 같은 날짜의 첫 번째 경기 행에만 day 셀이 존재한다.
     * 이후 경기들은 이전 날짜를 계속 사용한다.
     */
    const dayCell = findCellByClass(cells, "day");

    if (dayCell) {
      const dayMatch = cleanCell(dayCell.Text).match(
        /(?<month>\d{1,2})\.(?<day>\d{1,2})/,
      );

      if (dayMatch?.groups) {
        currentMonth = Number(dayMatch.groups.month);
        currentDay = Number(dayMatch.groups.day);
      }
    }

    if (!currentMonth || !currentDay) {
      return;
    }

    const timeCell = findCellByClass(cells, "time");
    const playCell = findCellByClass(cells, "play");
    const parsedPlay = parsePlayCell(playCell?.Text);

    if (!parsedPlay) {
      return;
    }

    const time = cleanCell(timeCell?.Text);

    if (!/^\d{2}:\d{2}$/.test(time)) {
      return;
    }

    const rowText = cells.map((cell) => cleanCell(cell?.Text)).join(" ");

    /*
     * 일정 응답의 마지막 두 셀은 일반적으로 구장과 비고다.
     * 응답 구조가 짧은 경우 알려진 셀을 구장이나 비고로
     * 잘못 인식하지 않도록 검사한다.
     */
    const stadiumCell = cells.at(-2);
    const noteCell = cells.at(-1);

    const broadcastCell = findCellByClasses(cells, ["broadcast", "tv"]);

    const knownCells = new Set([dayCell, timeCell, playCell].filter(Boolean));

    const broadcast = cleanCell(broadcastCell?.Text);

    const stadium = knownCells.has(stadiumCell)
      ? ""
      : cleanCell(stadiumCell?.Text);

    const note = knownCells.has(noteCell) ? "" : cleanCell(noteCell?.Text);

    const month = String(currentMonth).padStart(2, "0");
    const day = String(currentDay).padStart(2, "0");
    const date = `${targetYear}-${month}-${day}`;

    const { awayTeam, homeTeam, awayScore, homeScore } = parsedPlay;

    const status = getGameStatus({
      awayScore,
      homeScore,
      rowText,
    });

    const score =
      awayScore !== null && homeScore !== null
        ? `${awayScore}:${homeScore}`
        : "";

    const awaySlug = createSlug(awayTeam);
    const homeSlug = createSlug(homeTeam);

    /*
     * 같은 날짜에 같은 두 팀이 두 번 경기하는
     * 더블헤더를 구분하기 위한 순번이다.
     */
    const matchupKey = [date, awaySlug, homeSlug].join("-");

    const matchupSequence = (matchupCounts.get(matchupKey) ?? 0) + 1;

    matchupCounts.set(matchupKey, matchupSequence);

    const externalId = ["kbo", date, awaySlug, homeSlug, matchupSequence].join(
      "-",
    );

    games.push({
      id: externalId,
      externalId,
      sport: "baseball",
      league: "KBO",
      date,
      time,
      gameType: getGameType({
        awayTeam,
        homeTeam,
        rowText,
      }),
      awayTeam,
      homeTeam,
      score,
      status,
      broadcast: broadcast === "-" ? "" : broadcast,
      stadium: stadium === "-" ? "" : stadium,
      note: note === "-" ? "" : note,
    });
  });

  return games;
};

const saveSchedulesToJson = async (monthlySchedules) => {
  const dataDirectory = path.resolve("public", "data");

  await mkdir(dataDirectory, {
    recursive: true,
  });

  const outputPaths = [];

  /*
   * 다음 달 일정이 아직 공개되지 않아 빈 배열이어도
   * 해당 월 JSON 파일을 생성한다.
   */
  for (const { target, games } of monthlySchedules) {
    const scheduleMonth = `${target.year}-${String(target.month).padStart(
      2,
      "0",
    )}`;

    const outputPath = path.join(dataDirectory, `kbo-${scheduleMonth}.json`);

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
    match_time: `${game.time}:00`,
    game_type: game.gameType || null,
    away_team_code: game.awayTeam,
    home_team_code: game.homeTeam,
    score: game.score || null,
    status: game.status,
    venue: game.stadium || null,
    broadcast: game.broadcast || null,
    note: game.note || null,
    source: "KBO_OFFICIAL",
    source_url: KBO_SCHEDULE_PAGE_URL,
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
      `KBO 일정 수집 대상: ${targets
        .map(({ year, month }) => `${year}-${String(month).padStart(2, "0")}`)
        .join(", ")}`,
    );

    /*
     * 현재 월과 다음 달을 병렬로 수집한다.
     */
    const monthlySchedules = await Promise.all(
      targets.map(async (target) => {
        const scheduleData = await fetchKboSchedule(target);

        const games = parseKboSchedule(scheduleData, target.year);

        console.log(
          `${target.year}-${String(target.month).padStart(
            2,
            "0",
          )} 경기 ${games.length}개 추출`,
        );

        return {
          target,
          games,
        };
      }),
    );

    const games = monthlySchedules
      .flatMap((schedule) => schedule.games)
      .sort((firstGame, secondGame) =>
        `${firstGame.date} ${firstGame.time}`.localeCompare(
          `${secondGame.date} ${secondGame.time}`,
        ),
      );

    if (games.length === 0) {
      throw new Error("현재 월과 다음 달에서 추출된 KBO 경기가 없습니다.");
    }

    const outputPaths = await saveSchedulesToJson(monthlySchedules);

    const syncedCount = await syncScheduleToSupabase(games);

    console.log(`KBO 경기 총 ${games.length}개 추출 완료`);

    outputPaths.forEach((outputPath) => {
      console.log(`JSON 저장 위치: ${outputPath}`);
    });

    console.log(`Supabase 경기 ${syncedCount}개 동기화 완료`);
  } catch (error) {
    console.error("KBO 일정 동기화 실패");

    console.error(error instanceof Error ? error.message : error);

    process.exitCode = 1;
  }
};

main();
