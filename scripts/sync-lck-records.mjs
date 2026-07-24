import {
  cleanText,
  createSupabaseAdminClient,
  fetchTextWithRetry,
  toNumber,
  toNullableNumber,
} from "./team-standings-utils.mjs";
import {
  fetchLatestStandingsRows,
  getKoreaYear,
  normalizePlayerRecords,
  normalizeTeamRecords,
  syncRecordRowsToSupabase,
} from "./team-records-sync-utils.mjs";
import { getTeamInfo } from "../src/constants/teamInfo.js";
import { LOL_PLAYER_RECORDS } from "../src/pages/TeamRecord/data/lolPlayerRecordData.js";
import { LOL_TEAM_RECORDS } from "../src/pages/TeamRecord/data/lolTeamRecordData.js";

const SOURCE = "FANPICK_LCK_RECORD_DATA";
const SOURCE_URL = "https://game.naver.com/esports/record/lck/team/lck_2026";
const OFFICIAL_SOURCE = "LCK_OFFICIAL_STANDINGS";
const OFFICIAL_PLAYER_SOURCE = "NAVER_ESPORTS_PLAYER_RECORDS";
const NAVER_LCK_PLAYER_RECORD_URL =
  "https://game.naver.com/esports/record/lck/player/lck_2026?type=TOP";

const LCK_TEAM_IDS = new Set(LOL_TEAM_RECORDS.map((team) => team.teamId));

const decodeJsonHtmlEntities = (value) =>
  String(value)
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16)),
    )
    .replace(/&#(\d+);/g, (_, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 10)),
    );

const extractNaverNextData = (html) => {
  const match = String(html).match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );

  if (!match) {
    throw new Error("네이버 e스포츠 페이지에서 선수 기록 데이터를 찾지 못했습니다.");
  }

  return JSON.parse(decodeJsonHtmlEntities(match[1]));
};

const readNullableNumber = (value) =>
  value === undefined || value === null || value === "" ? null : toNullableNumber(value);

const mapStandingRowsToLckTeamRows = (rows) =>
  rows.map((row) => {
    const team = getTeamInfo(row.team_code || row.team_name, "esports");

    return {
      assists: row.assists,
      deaths: row.deaths,
      draws: row.draws,
      games: row.games,
      imageUrl: team.logo,
      kda: row.kda,
      kills: row.kills,
      loses: row.losses,
      losses: row.losses,
      rank: row.rank,
      score: row.score_diff,
      sourceUpdatedAt: row.updated_at,
      teamCode: row.team_code,
      teamId: row.team_id || row.team_code,
      teamName: team.name || row.team_name,
      teamShortName: team.shortName || row.team_code || row.team_name,
      winRate: row.win_rate,
      wins: row.wins,
    };
  });

const normalizeNaverPlayerRow = (row) => {
  const addInfo = row?.addInfo ?? {};
  const player = row?.player ?? {};
  const team = row?.team ?? {};
  const teamId = cleanText(row?.teamId || team?.teamId);

  return {
    assists: readNullableNumber(addInfo.assists),
    competeSetCount: readNullableNumber(addInfo.competeSetCount),
    competeTimes: readNullableNumber(addInfo.competeTimes),
    deaths: readNullableNumber(addInfo.deaths),
    draws: toNumber(row?.draws),
    imageUrl: cleanText(player?.imageUrl) || null,
    kda: readNullableNumber(addInfo.kda),
    killInvolveRate: readNullableNumber(addInfo.killInvolveRate),
    kills: readNullableNumber(addInfo.kills),
    loses: toNumber(row?.loses),
    losses: toNumber(row?.loses),
    playerFullName: cleanText(player?.nameEng || player?.name) || null,
    playerId: cleanText(row?.playerId || player?.playerId),
    playerName:
      cleanText(player?.nickName || player?.nameEng || player?.name) ||
      cleanText(row?.playerId),
    pogPoint: readNullableNumber(addInfo.pogPoint),
    position: cleanText(row?.position),
    rank: toNumber(row?.rank),
    score: readNullableNumber(row?.score),
    teamCode: teamId,
    teamId,
    teamName: cleanText(team?.nameEng || team?.name || teamId),
    teamShortName: cleanText(team?.nameEngAcronym || team?.nameAcronym || teamId),
    winRate: readNullableNumber(row?.winRate),
    wins: toNumber(row?.wins),
  };
};

const fetchOfficialLckPlayerRows = async () => {
  const html = await fetchTextWithRetry(NAVER_LCK_PLAYER_RECORD_URL, {
    headers: {
      Accept: "text/html",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      "User-Agent": "Mozilla/5.0",
    },
  });
  const nextData = extractNaverNextData(html);
  const playerRanking = nextData?.props?.initialState?.ranking?.playerRanking;

  if (!Array.isArray(playerRanking)) {
    throw new Error("네이버 e스포츠 LCK 선수 기록 응답 형식을 확인해 주세요.");
  }

  const rows = playerRanking
    .map(normalizeNaverPlayerRow)
    .filter((row) => LCK_TEAM_IDS.has(row.teamId) && row.playerName && row.rank > 0)
    .sort((firstRow, secondRow) => firstRow.rank - secondRow.rank);

  if (rows.length === 0) {
    throw new Error("LCK 공식 선수 기록에서 추출된 선수가 없습니다.");
  }

  return rows;
};

const resolveLckPlayerRows = async () => {
  try {
    const rows = await fetchOfficialLckPlayerRows();

    return {
      rows,
      source: OFFICIAL_PLAYER_SOURCE,
      sourceUrl: NAVER_LCK_PLAYER_RECORD_URL,
    };
  } catch (error) {
    console.warn(
      `LCK 공식 선수 기록 조회를 건너뜁니다: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }

  return {
    rows: LOL_PLAYER_RECORDS.filter((row) => LCK_TEAM_IDS.has(row.teamId)),
    source: SOURCE,
    sourceUrl: SOURCE_URL,
  };
};

const main = async () => {
  const season = getKoreaYear();
  const supabase = createSupabaseAdminClient();
  const latestStandingRows = await fetchLatestStandingsRows({
    leagueId: "lck",
    season,
    supabase,
  });
  const teamRows =
    latestStandingRows.length > 0
      ? mapStandingRowsToLckTeamRows(latestStandingRows)
      : LOL_TEAM_RECORDS;

  const teamRecords = normalizeTeamRecords({
    leagueId: "lck",
    leagueName: "LCK",
    rows: teamRows,
    season,
    source: latestStandingRows.length > 0 ? OFFICIAL_SOURCE : SOURCE,
    sourceUrl: SOURCE_URL,
    sportId: "esports",
  });
  const playerData = await resolveLckPlayerRows();

  const playerRecords = normalizePlayerRecords({
    leagueId: "lck",
    leagueName: "LCK",
    rows: playerData.rows,
    season,
    source: playerData.source,
    sourceUrl: playerData.sourceUrl,
    sportId: "esports",
  });

  const syncedTeamCount = await syncRecordRowsToSupabase({
    leagueId: "lck",
    rows: teamRecords,
    season,
    supabase,
    table: "team_records",
  });
  const syncedPlayerCount = await syncRecordRowsToSupabase({
    leagueId: "lck",
    rows: playerRecords,
    season,
    supabase,
    table: "player_records",
  });

  console.log(
    `LCK 레코드 동기화 완료: 팀 ${syncedTeamCount}개, 선수 ${syncedPlayerCount}개`,
  );
};

main().catch((error) => {
  console.error("LCK 레코드 동기화 실패");
  console.error(error.message);
  process.exit(1);
});
