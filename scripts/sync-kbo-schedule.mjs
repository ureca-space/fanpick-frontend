import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const KBO_SCHEDULE_URL =
  "https://eng.koreabaseball.com/Schedule/DailySchedule.aspx";

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

const cleanCell = (html) => {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
};

const createSlug = (value) => {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
};

const getStatus = (score) => {
  if (/^\d+:\d+$/.test(score)) {
    return "finished";
  }

  if (/postponed|연기/i.test(score)) {
    return "postponed";
  }

  if (/cancelled|canceled|cancel|취소/i.test(score)) {
    return "cancelled";
  }

  return "scheduled";
};

const fetchKboSchedule = async () => {
  const response = await fetch(KBO_SCHEDULE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(
      `KBO 일정 요청 실패: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
};

const parseKboSchedule = (html) => {
  const rowMatches = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];

  const currentYear = new Date().getFullYear();

  let currentDate = null;
  let currentGameType = null;

  const games = [];
  const matchupCounts = new Map();

  rowMatches.forEach((rowHtml) => {
    const cellMatches = [
      ...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi),
    ];

    const cells = cellMatches.map((match) => cleanCell(match[1]));

    if (cells.length < 8) {
      return;
    }

    const hasDate = /^\d{2}\.\d{2}\([A-Z]{3}\)$/.test(cells[0]);

    let timeIndex;
    let awayIndex;
    let scoreIndex;
    let homeIndex;
    let broadcastIndex;
    let stadiumIndex;
    let noteIndex;

    if (hasDate) {
      currentDate = cells[0];
      currentGameType = cells[1];

      timeIndex = 2;
      awayIndex = 3;
      scoreIndex = 4;
      homeIndex = 5;
      broadcastIndex = 6;
      stadiumIndex = 8;
      noteIndex = 9;
    } else {
      if (!currentDate || !/^\d{2}:\d{2}$/.test(cells[0])) {
        return;
      }

      timeIndex = 0;
      awayIndex = 1;
      scoreIndex = 2;
      homeIndex = 3;
      broadcastIndex = 4;
      stadiumIndex = 6;
      noteIndex = 7;
    }

    const dateMatch = currentDate.match(/^(?<month>\d{2})\.(?<day>\d{2})/);

    if (!dateMatch?.groups) {
      return;
    }

    const { month, day } = dateMatch.groups;
    const date = `${currentYear}-${month}-${day}`;

    const time = cells[timeIndex];
    const awayTeam = cells[awayIndex];
    const homeTeam = cells[homeIndex];
    const score = cells[scoreIndex] || "";

    if (!/^\d{2}:\d{2}$/.test(time) || !awayTeam || !homeTeam) {
      return;
    }

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
      gameType: currentGameType,
      awayTeam,
      homeTeam,
      score,
      status: getStatus(score),
      broadcast: cells[broadcastIndex] || "",
      stadium: cells[stadiumIndex] || "",
      note: cells[noteIndex] || "",
    });
  });

  return games;
};

const saveScheduleToJson = async (games) => {
  const scheduleMonth = games[0].date.slice(0, 7);

  const dataDirectory = path.resolve("public", "data");

  const outputPath = path.join(dataDirectory, `kbo-${scheduleMonth}.json`);

  await mkdir(dataDirectory, {
    recursive: true,
  });

  await writeFile(outputPath, JSON.stringify(games, null, 2), "utf8");

  return outputPath;
};

const syncScheduleToSupabase = async (games) => {
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
    source_url: KBO_SCHEDULE_URL,
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
    console.log("KBO 공식 일정 페이지를 불러오는 중...");

    const html = await fetchKboSchedule();
    const games = parseKboSchedule(html);

    if (games.length === 0) {
      throw new Error("추출된 KBO 경기가 없습니다.");
    }

    const outputPath = await saveScheduleToJson(games);

    const syncedCount = await syncScheduleToSupabase(games);

    console.log(`KBO 경기 ${games.length}개 추출 완료`);

    console.log(`JSON 저장 위치: ${outputPath}`);

    console.log(`Supabase 경기 ${syncedCount}개 동기화 완료`);
  } catch (error) {
    console.error("KBO 일정 동기화 실패");

    console.error(error instanceof Error ? error.message : error);

    process.exitCode = 1;
  }
};

main();
