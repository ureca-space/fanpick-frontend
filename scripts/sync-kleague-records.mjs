import {
  createSupabaseAdminClient,
  fetchTextWithRetry,
  toNumber,
  toNullableNumber,
} from "./team-standings-utils.mjs";
import {
  getKoreaYear,
  normalizePlayerRecords,
  normalizeTeamRecords,
  syncRecordRowsToSupabase,
  uniqueBy,
} from "./team-records-sync-utils.mjs";
import { getTeamInfo } from "../src/constants/teamInfo.js";
import {
  SOCCER_PLAYER_RECORDS_K1,
  SOCCER_PLAYER_RECORDS_K2,
  SOCCER_TEAM_RECORDS_K1,
  SOCCER_TEAM_RECORDS_K2,
} from "../src/pages/TeamRecord/data/kleagueRecordData.js";

const SOURCE = "FANPICK_KLEAGUE_RECORD_DATA";
const SOURCE_URL = "https://www.kleague.com/record/team.do";
const KLEAGUE_TEAM_RANK_API_URL = "https://www.kleague.com/record/teamRank.do";
const OFFICIAL_SOURCE = "KLEAGUE_OFFICIAL_TEAM_RANK";
const KLEAGUE_PLAYER_SOURCE_URL = "https://www.kleague.com/record/player.do";
const KLEAGUE_PLAYER_RANK_API_URL = "https://www.kleague.com/record/rankSort.do";
const KLEAGUE_PLAYER_BY_CLUB_API_URL =
  "https://www.kleague.com/record/selectPersonalRecordByClub.do";
const OFFICIAL_PLAYER_SOURCE = "KLEAGUE_OFFICIAL_PLAYER_RECORDS";
const KLEAGUE_PLAYER_RECORD_TYPES = [
  "GOAL",
  "ASSIST",
  "AP",
  "ST",
  "GAMECNT",
  "WARN",
  "FC",
  "CK",
  "CLEAN",
];

const uniquePlayerRows = (rows) =>
  uniqueBy(rows, (row) =>
    row.playerId ? `${row.teamId}:${row.playerId}` : `${row.teamId}:${row.playerName}`,
  );

const getKLeagueTeamCode = (teamId) => {
  const value = String(teamId ?? "").trim().toUpperCase();

  if (!value) {
    return "";
  }

  return value.startsWith("K") ? value : `K${value.padStart(2, "0")}`;
};

const getKLeagueImageUrl = (path) => {
  const imagePath = String(path ?? "").trim();

  if (!imagePath) {
    return null;
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return new URL(imagePath, "https://www.kleague.com").toString();
};

const createKLeaguePlayerKey = (row) =>
  [row.teamCode || row.teamId, row.playerName].filter(Boolean).join(":");

const createKLeaguePostHeaders = (referer) => ({
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
  "Content-Type": "application/json; charset=UTF-8",
  Origin: "https://www.kleague.com",
  Referer: referer,
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "X-Requested-With": "XMLHttpRequest",
});

const fetchKLeagueJson = async ({ body, referer, url }) => {
  const responseText = await fetchTextWithRetry(url, {
    body: JSON.stringify(body),
    headers: createKLeaguePostHeaders(referer),
    method: "POST",
  });

  return JSON.parse(responseText);
};

const buildRecentText = (item) =>
  [item.game01, item.game02, item.game03, item.game04, item.game05, item.game06]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");

const fetchKLeagueTeamRows = async ({ kleagueLeagueId, season }) => {
  const sourceUrl = `${SOURCE_URL}?leagueId=${kleagueLeagueId}`;
  const url = new URL(KLEAGUE_TEAM_RANK_API_URL);

  url.searchParams.set("leagueId", String(kleagueLeagueId));
  url.searchParams.set("year", String(season));
  url.searchParams.set("stadium", "all");
  url.searchParams.set("recordType", "rank");

  const responseText = await fetchTextWithRetry(url.toString(), {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      "Content-Type": "application/json; charset=UTF-8",
      Origin: "https://www.kleague.com",
      Referer: sourceUrl,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
    method: "POST",
  });
  const payload = JSON.parse(responseText);
  const rawRows = payload?.data?.teamRank ?? payload?.teamRank ?? [];

  if (!Array.isArray(rawRows)) {
    throw new Error(`K리그${kleagueLeagueId} 팀 기록 응답 형식을 확인해 주세요.`);
  }

  return rawRows
    .filter((item) => item?.teamId)
    .map((item) => {
      const teamCode = String(item.teamId).trim();
      const teamInfo = getTeamInfo(teamCode, "soccer");

      return {
        conceded: toNumber(item.lossGoal),
        diff: toNumber(item.gapCnt),
        draws: toNumber(item.tieCnt),
        goals: toNumber(item.gainGoal),
        lastFive: buildRecentText(item),
        logoUrl: teamInfo.logo,
        losses: toNumber(item.lossCnt),
        matches: toNumber(item.gameCount),
        points: toNumber(item.gainPoint),
        rank: toNumber(item.rank),
        teamCode,
        teamId: teamCode,
        teamName: teamInfo.name || item.teamName || teamCode,
        teamShortName: teamInfo.shortName || item.teamNameShort || item.teamName || teamCode,
        winRate:
          toNumber(item.gameCount) > 0
            ? Number((toNumber(item.winCnt) / toNumber(item.gameCount)).toFixed(3))
            : null,
        wins: toNumber(item.winCnt),
      };
    })
    .sort((firstRow, secondRow) => firstRow.rank - secondRow.rank);
};

const normalizeKLeaguePlayerItem = ({
  item,
  rank,
  teamCode: fallbackTeamCode,
  teamName: fallbackTeamName,
}) => {
  const teamCode = getKLeagueTeamCode(item.teamId || fallbackTeamCode);
  const teamInfo = getTeamInfo(teamCode, "soccer");
  const playerName = item.name || item.playerName || "";
  const playerId = item.playerId || null;

  return {
    assists: toNumber(item.assistQty),
    backNumber: toNumber(item.backNo, null),
    cleanSheets: toNumber(item.clQty, null),
    cornerKicks: toNumber(item.ckQty),
    exits: toNumber(item.exitQty),
    fouls: toNumber(item.foQty),
    goals: toNumber(item.goalQty),
    imageUrl: getKLeagueImageUrl(item.img1),
    indexScore: toNullableNumber(item.qtyPerGame),
    matches: toNumber(item.gameQty),
    minsPlayed: toNumber(item.playTime, null),
    offencePoints: toNumber(item.apQty),
    offside: toNumber(item.osQty),
    playerFullName: playerName,
    playerId,
    playerName,
    position: "",
    rank,
    shots: toNumber(item.stQty),
    shotsOnTarget: null,
    starts: toNumber(item.changeIqty, null),
    substitute: toNumber(item.changeOty, null),
    teamCode,
    teamId: teamCode,
    teamName: teamInfo.name || fallbackTeamName || item.teamName || teamCode,
    teamShortName:
      teamInfo.shortName || item.teamName || fallbackTeamName || teamCode,
    yellowCards: toNumber(item.warnQty),
  };
};

const fetchKLeagueRankPlayerRows = async ({ kleagueLeagueId, season }) => {
  const rowsByKey = new Map();
  const referer = `${KLEAGUE_PLAYER_SOURCE_URL}?leagueId=${kleagueLeagueId}&year=${season}&recordType=GOAL`;

  for (const recordType of KLEAGUE_PLAYER_RECORD_TYPES) {
    const payload = await fetchKLeagueJson({
      body: {
        leagueId: String(kleagueLeagueId),
        recordType,
        year: String(season),
      },
      referer,
      url: KLEAGUE_PLAYER_RANK_API_URL,
    });
    const rawRows = payload?.data?.list ?? [];

    if (!Array.isArray(rawRows)) {
      throw new Error(`K리그${kleagueLeagueId} 선수 랭킹 응답 형식을 확인해 주세요.`);
    }

    rawRows.forEach((item) => {
      const normalizedRow = normalizeKLeaguePlayerItem({
        item,
        rank: toNumber(item.rank),
      });
      const key = createKLeaguePlayerKey(normalizedRow);
      const currentRow = rowsByKey.get(key) || {};

      rowsByKey.set(key, {
        ...currentRow,
        ...normalizedRow,
        imageUrl: normalizedRow.imageUrl || currentRow.imageUrl,
        playerId: normalizedRow.playerId || currentRow.playerId,
        rank:
          currentRow.rank && currentRow.rank > 0
            ? currentRow.rank
            : normalizedRow.rank,
        [`${recordType.toLowerCase()}Rank`]: toNumber(item.rank, null),
      });
    });
  }

  return [...rowsByKey.values()];
};

const fetchKLeagueClubPlayerRows = async ({
  kleagueLeagueId,
  season,
  teamRows,
}) => {
  const rows = [];
  const referer = `${KLEAGUE_PLAYER_SOURCE_URL}?leagueId=${kleagueLeagueId}&year=${season}`;

  for (const teamRow of teamRows) {
    const teamCode = getKLeagueTeamCode(teamRow.teamCode || teamRow.teamId);

    if (!teamCode) {
      continue;
    }

    const payload = await fetchKLeagueJson({
      body: {
        leagueId: String(kleagueLeagueId),
        teamId: teamCode,
        year: String(season),
      },
      referer,
      url: KLEAGUE_PLAYER_BY_CLUB_API_URL,
    });
    const rawRows = payload?.data?.list ?? [];

    if (!Array.isArray(rawRows)) {
      throw new Error(`K리그${kleagueLeagueId} 팀별 선수 기록 응답 형식을 확인해 주세요.`);
    }

    rawRows.forEach((item) => {
      rows.push(
        normalizeKLeaguePlayerItem({
          item,
          rank: null,
          teamCode,
          teamName: teamRow.teamShortName || teamRow.teamName,
        }),
      );
    });
  }

  return rows;
};

const mergeKLeaguePlayerRows = ({ clubRows, rankRows }) => {
  const rankRowsByKey = new Map(
    rankRows.map((row) => [createKLeaguePlayerKey(row), row]),
  );
  const mergedRows = clubRows.map((clubRow) => {
    const rankRow = rankRowsByKey.get(createKLeaguePlayerKey(clubRow));

    return {
      ...clubRow,
      ...rankRow,
      assists: rankRow?.assists ?? clubRow.assists,
      goals: rankRow?.goals ?? clubRow.goals,
      imageUrl: rankRow?.imageUrl || clubRow.imageUrl,
      matches: rankRow?.matches ?? clubRow.matches,
      playerId: rankRow?.playerId || clubRow.playerId,
      rank: rankRow?.rank || clubRow.rank,
      shots: rankRow?.shots ?? clubRow.shots,
      yellowCards: rankRow?.yellowCards ?? clubRow.yellowCards,
    };
  });
  const clubKeys = new Set(clubRows.map(createKLeaguePlayerKey));
  const extraRankRows = rankRows.filter((row) => !clubKeys.has(createKLeaguePlayerKey(row)));

  return [...mergedRows, ...extraRankRows]
    .filter((row) => row.playerName && row.teamCode)
    .sort(
      (firstRow, secondRow) =>
        secondRow.goals - firstRow.goals ||
        secondRow.assists - firstRow.assists ||
        secondRow.offencePoints - firstRow.offencePoints ||
        secondRow.matches - firstRow.matches ||
        firstRow.playerName.localeCompare(secondRow.playerName, "ko"),
    )
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
};

const fetchOfficialKLeaguePlayerRows = async ({
  kleagueLeagueId,
  season,
  teamRows,
}) => {
  const [clubRows, rankRows] = await Promise.all([
    fetchKLeagueClubPlayerRows({ kleagueLeagueId, season, teamRows }),
    fetchKLeagueRankPlayerRows({ kleagueLeagueId, season }),
  ]);
  const rows = mergeKLeaguePlayerRows({ clubRows, rankRows });

  if (rows.length === 0) {
    throw new Error(`K리그${kleagueLeagueId} 공식 선수 기록에서 추출된 선수가 없습니다.`);
  }

  return rows;
};

const resolvePlayerRows = async ({
  fallbackRows,
  kleagueLeagueId,
  season,
  teamRows,
}) => {
  try {
    const rows = await fetchOfficialKLeaguePlayerRows({
      kleagueLeagueId,
      season,
      teamRows,
    });

    return {
      rows,
      source: OFFICIAL_PLAYER_SOURCE,
      sourceUrl: `${KLEAGUE_PLAYER_SOURCE_URL}?leagueId=${kleagueLeagueId}`,
    };
  } catch (error) {
    console.warn(
      `K리그${kleagueLeagueId} 공식 선수 기록 조회를 건너뜁니다: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }

  return {
    rows: fallbackRows,
    source: SOURCE,
    sourceUrl: KLEAGUE_PLAYER_SOURCE_URL,
  };
};

const resolveTeamRows = async ({ fallbackRows, kleagueLeagueId, season }) => {
  try {
    const rows = await fetchKLeagueTeamRows({ kleagueLeagueId, season });

    if (rows.length > 0) {
      return {
        rows,
        source: OFFICIAL_SOURCE,
        sourceUrl: `${SOURCE_URL}?leagueId=${kleagueLeagueId}`,
      };
    }
  } catch (error) {
    console.warn(
      `K리그${kleagueLeagueId} 공식 팀 기록 조회를 건너뜁니다: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }

  return {
    rows: fallbackRows,
    source: SOURCE,
    sourceUrl: SOURCE_URL,
  };
};

const syncLeague = async ({
  leagueId,
  leagueName,
  playerRows,
  playerSource,
  playerSourceUrl,
  season,
  source,
  sourceUrl,
  supabase,
  teamRows,
}) => {
  const teamRecords = normalizeTeamRecords({
    leagueId,
    leagueName,
    rows: teamRows,
    season,
    source,
    sourceUrl,
    sportId: "soccer",
  });

  const playerRecords = normalizePlayerRecords({
    leagueId,
    leagueName,
    rows: uniquePlayerRows(playerRows),
    season,
    source: playerSource,
    sourceUrl: playerSourceUrl,
    sportId: "soccer",
  });

  const syncedTeamCount = await syncRecordRowsToSupabase({
    leagueId,
    rows: teamRecords,
    season,
    supabase,
    table: "team_records",
  });
  const syncedPlayerCount = await syncRecordRowsToSupabase({
    leagueId,
    rows: playerRecords,
    season,
    supabase,
    table: "player_records",
  });

  return {
    player: syncedPlayerCount,
    team: syncedTeamCount,
  };
};

const main = async () => {
  const season = getKoreaYear();
  const supabase = createSupabaseAdminClient();
  const k1TeamData = await resolveTeamRows({
    fallbackRows: SOCCER_TEAM_RECORDS_K1,
    kleagueLeagueId: 1,
    season,
  });
  const k2TeamData = await resolveTeamRows({
    fallbackRows: SOCCER_TEAM_RECORDS_K2,
    kleagueLeagueId: 2,
    season,
  });
  const k1PlayerData = await resolvePlayerRows({
    fallbackRows: SOCCER_PLAYER_RECORDS_K1,
    kleagueLeagueId: 1,
    season,
    teamRows: k1TeamData.rows,
  });
  const k2PlayerData = await resolvePlayerRows({
    fallbackRows: SOCCER_PLAYER_RECORDS_K2,
    kleagueLeagueId: 2,
    season,
    teamRows: k2TeamData.rows,
  });

  const k1 = await syncLeague({
    leagueId: "kleague1",
    leagueName: "K LEAGUE 1",
    playerRows: k1PlayerData.rows,
    playerSource: k1PlayerData.source,
    playerSourceUrl: k1PlayerData.sourceUrl,
    season,
    source: k1TeamData.source,
    sourceUrl: k1TeamData.sourceUrl,
    supabase,
    teamRows: k1TeamData.rows,
  });
  const k2 = await syncLeague({
    leagueId: "kleague2",
    leagueName: "K LEAGUE 2",
    playerRows: k2PlayerData.rows,
    playerSource: k2PlayerData.source,
    playerSourceUrl: k2PlayerData.sourceUrl,
    season,
    source: k2TeamData.source,
    sourceUrl: k2TeamData.sourceUrl,
    supabase,
    teamRows: k2TeamData.rows,
  });

  console.log(
    `K리그 레코드 동기화 완료: K1 팀 ${k1.team}개, K1 선수 ${k1.player}개, K2 팀 ${k2.team}개, K2 선수 ${k2.player}개`,
  );
};

main().catch((error) => {
  console.error("K리그 레코드 동기화 실패");
  console.error(error.message);
  process.exit(1);
});
