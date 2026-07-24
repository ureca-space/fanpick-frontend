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
import {
  BASEBALL_HITTER_RECORDS,
  BASEBALL_HITTER_RECORDS_EXTRA,
  BASEBALL_PITCHER_RECORDS,
  BASEBALL_PITCHER_RECORDS_EXTRA,
  BASEBALL_TEAM_RECORDS,
  BASEBALL_TEAM_RECORDS_EXTRA,
} from "../src/pages/TeamRecord/data/kboRecordData.js";

const SOURCE = "FANPICK_KBO_RECORD_DATA";
const SOURCE_URL = "https://www.koreabaseball.com/Record/TeamRank/TeamRank.aspx";

const OFFICIAL_SOURCE = "KBO_OFFICIAL_STANDINGS";
const OFFICIAL_PLAYER_SOURCE = "KBO_OFFICIAL_PLAYER_RECORDS";
const KBO_HITTER_BASIC_URL =
  "https://www.koreabaseball.com/Record/Player/HitterBasic/Basic1.aspx";
const KBO_HITTER_DETAIL_URL =
  "https://www.koreabaseball.com/Record/Player/HitterBasic/Basic2.aspx";
const KBO_PITCHER_BASIC_URL =
  "https://www.koreabaseball.com/Record/Player/PitcherBasic/Basic1.aspx";
const KBO_PLAYER_IMAGE_BASE_URL =
  "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/person/middle";

const KBO_TEAM_CODES = {
  KIA: "KIA",
  KT: "KT",
  LG: "LG",
  NC: "NC",
  SSG: "SSG",
  두산: "DOOSAN",
  롯데: "LOTTE",
  삼성: "SAMSUNG",
  키움: "KIWOOM",
  한화: "HANWHA",
};

const buildBaseballPlayerRows = () => [
  ...BASEBALL_HITTER_RECORDS.map((row) => ({
    ...row,
    kind: "HITTER",
  })),
  ...BASEBALL_HITTER_RECORDS_EXTRA.map((row) => ({
    ...row,
    kind: "HITTER",
  })),
  ...BASEBALL_PITCHER_RECORDS.map((row) => ({
    ...row,
    kind: "PITCHER",
  })),
  ...BASEBALL_PITCHER_RECORDS_EXTRA.map((row) => ({
    ...row,
    kind: "PITCHER",
  })),
];

const getAttribute = (html, name) =>
  String(html)
    .match(new RegExp(`${name}=["']([^"']*)["']`, "i"))?.[1]
    ?.trim() || "";

const getKboTeamCode = (teamName) => {
  const normalizedTeamName = cleanText(teamName).toUpperCase();
  const matchedEntry = Object.entries(KBO_TEAM_CODES).find(([label]) =>
    normalizedTeamName.includes(label.toUpperCase()),
  );

  return matchedEntry?.[1] || normalizedTeamName;
};

const createKboPlayerKey = (row) =>
  [row.playerId, row.teamCode, row.playerName].filter(Boolean).join(":");

const extractKboTableRows = (html) =>
  [...String(html).matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
    .map(([rowHtml]) => {
      const cells = [
        ...rowHtml.matchAll(/<(?:th|td)\b[\s\S]*?<\/(?:th|td)>/gi),
      ].map(([cellHtml]) => cleanText(cellHtml));
      const playerHref =
        rowHtml.match(/<a\b[^>]+href=["']([^"']*playerId=([^"']+))["']/i) ||
        [];

      return {
        cells,
        playerId: playerHref[2] || "",
      };
    })
    .filter(({ cells }) => /^\d+$/.test(cleanText(cells[0])));

const getKboPlayerImageUrl = (season, playerId) =>
  playerId ? `${KBO_PLAYER_IMAGE_BASE_URL}/${season}/${playerId}.jpg` : null;

const fetchKboTableRows = async (url) => {
  const html = await fetchTextWithRetry(url, {
    headers: {
      Accept: "text/html",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      "User-Agent": "Mozilla/5.0",
    },
  });

  return extractKboTableRows(html);
};

const createBaseballPlayerBase = ({ cells, playerId, season }) => {
  const teamCode = getKboTeamCode(cells[2]);
  const team = getTeamInfo(teamCode, "baseball");

  return {
    imageUrl: getKboPlayerImageUrl(season, playerId),
    playerId: playerId || `${teamCode}-${cells[1]}`,
    playerName: cleanText(cells[1]).replace(/^\*\s*/, ""),
    rank: toNumber(cells[0]),
    teamCode,
    teamId: teamCode,
    teamName: team.name || cleanText(cells[2]),
    teamShortName: team.shortName || teamCode,
  };
};

const parseKboHitterBasicRow = (row, season) => {
  const { cells } = row;

  return {
    ...createBaseballPlayerBase({ ...row, season }),
    atBats: toNumber(cells[6]),
    avg: toNullableNumber(cells[3]),
    doubles: toNumber(cells[9]),
    games: toNumber(cells[4]),
    hits: toNumber(cells[8]),
    hr: toNumber(cells[11]),
    kind: "HITTER",
    plateAppearances: toNumber(cells[5]),
    position: "타자",
    rbi: toNumber(cells[13]),
    runs: toNumber(cells[7]),
    sacrificeFlies: toNumber(cells[15]),
    sacrificeHits: toNumber(cells[14]),
    totalBases: toNumber(cells[12]),
    triples: toNumber(cells[10]),
  };
};

const parseKboHitterDetailRow = (row, season) => {
  const { cells } = row;

  return {
    ...createBaseballPlayerBase({ ...row, season }),
    intentionalWalks: toNumber(cells[5]),
    obp: toNullableNumber(cells[10]),
    ops: toNullableNumber(cells[11]),
    slugging: toNullableNumber(cells[9]),
    strikeouts: toNumber(cells[7]),
    walks: toNumber(cells[4]),
  };
};

const parseKboPitcherBasicRow = (row, season) => {
  const { cells } = row;

  return {
    ...createBaseballPlayerBase({ ...row, season }),
    bb: toNumber(cells[13]),
    earnedRuns: toNumber(cells[17]),
    era: toNullableNumber(cells[3]),
    games: toNumber(cells[4]),
    hitsAllowed: toNumber(cells[11]),
    holds: toNumber(cells[8]),
    homeRunsAllowed: toNumber(cells[12]),
    innings: cleanText(cells[10]),
    kind: "PITCHER",
    losses: toNumber(cells[6]),
    position: "투수",
    runsAllowed: toNumber(cells[16]),
    saves: toNumber(cells[7]),
    strikeouts: toNumber(cells[15]),
    whip: toNullableNumber(cells[18]),
    winRate: toNullableNumber(cells[9]),
    wins: toNumber(cells[5]),
  };
};

const fetchOfficialBaseballPlayerRows = async (season) => {
  const [hitterBasicRows, hitterDetailRows, pitcherRows] = await Promise.all([
    fetchKboTableRows(KBO_HITTER_BASIC_URL),
    fetchKboTableRows(KBO_HITTER_DETAIL_URL),
    fetchKboTableRows(KBO_PITCHER_BASIC_URL),
  ]);
  const hitterDetailsByKey = new Map(
    hitterDetailRows
      .map((row) => parseKboHitterDetailRow(row, season))
      .map((row) => [createKboPlayerKey(row), row]),
  );
  const hitters = hitterBasicRows.map((row) => {
    const hitter = parseKboHitterBasicRow(row, season);
    const detail = hitterDetailsByKey.get(createKboPlayerKey(hitter));

    return {
      ...hitter,
      ...detail,
      kind: "HITTER",
      position: "타자",
    };
  });
  const pitchers = pitcherRows.map((row) => parseKboPitcherBasicRow(row, season));
  const rows = [...hitters, ...pitchers].filter((row) => row.playerName && row.teamCode);

  if (rows.length === 0) {
    throw new Error("KBO 공식 선수 기록에서 추출된 선수가 없습니다.");
  }

  return rows;
};

const resolveBaseballPlayerRows = async (season) => {
  try {
    const rows = await fetchOfficialBaseballPlayerRows(season);

    return {
      rows,
      source: OFFICIAL_PLAYER_SOURCE,
      sourceUrl: KBO_HITTER_BASIC_URL,
    };
  } catch (error) {
    console.warn(
      `KBO 공식 선수 기록 조회를 건너뜁니다: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }

  return {
    rows: buildBaseballPlayerRows(),
    source: SOURCE,
    sourceUrl: SOURCE_URL,
  };
};

const mapStandingRowsToBaseballTeamRows = (rows) =>
  rows.map((row) => {
    const team = getTeamInfo(row.team_code || row.team_name, "baseball");

    return {
      draws: row.draws,
      games: row.games,
      gamesBehind: row.games_behind,
      lastFive: row.recent,
      logoUrl: team.logo,
      losses: row.losses,
      rank: row.rank,
      runs: row.score_for,
      runsAllowed: row.score_against,
      scoreDiff: row.score_diff,
      sourceUpdatedAt: row.updated_at,
      streak: row.streak,
      teamCode: row.team_code,
      teamId: row.team_id || row.team_code,
      teamName: team.name || row.team_name,
      teamShortName: team.shortName || row.team_code || row.team_name,
      winRate: row.win_rate,
      wins: row.wins,
    };
  });

const main = async () => {
  const season = getKoreaYear();
  const supabase = createSupabaseAdminClient();
  const latestStandingRows = await fetchLatestStandingsRows({
    leagueId: "kbo",
    season,
    supabase,
  });
  const teamRows =
    latestStandingRows.length > 0
      ? mapStandingRowsToBaseballTeamRows(latestStandingRows)
      : [...BASEBALL_TEAM_RECORDS, ...BASEBALL_TEAM_RECORDS_EXTRA];

  const teamRecords = normalizeTeamRecords({
    leagueId: "kbo",
    leagueName: "KBO",
    rows: teamRows,
    season,
    source: latestStandingRows.length > 0 ? OFFICIAL_SOURCE : SOURCE,
    sourceUrl: SOURCE_URL,
    sportId: "baseball",
  });
  const playerData = await resolveBaseballPlayerRows(season);

  const playerRecords = normalizePlayerRecords({
    leagueId: "kbo",
    leagueName: "KBO",
    rows: playerData.rows,
    season,
    source: playerData.source,
    sourceUrl: playerData.sourceUrl,
    sportId: "baseball",
  });

  const syncedTeamCount = await syncRecordRowsToSupabase({
    leagueId: "kbo",
    rows: teamRecords,
    season,
    supabase,
    table: "team_records",
  });
  const syncedPlayerCount = await syncRecordRowsToSupabase({
    leagueId: "kbo",
    rows: playerRecords,
    season,
    supabase,
    table: "player_records",
  });

  console.log(
    `KBO 레코드 동기화 완료: 팀 ${syncedTeamCount}개, 선수 ${syncedPlayerCount}개`,
  );
};

main().catch((error) => {
  console.error("KBO 레코드 동기화 실패");
  console.error(error.message);
  process.exit(1);
});
