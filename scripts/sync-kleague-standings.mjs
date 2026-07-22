import {
  createSupabaseAdminClient,
  fetchTextWithRetry,
  saveStandingsToJson,
  syncStandingsToSupabase,
  toNumber,
} from "./team-standings-utils.mjs";

const KLEAGUE_STANDINGS_API_URL =
  "https://www.kleague.com/record/teamRank.do";
const KLEAGUE_STANDINGS_PAGE_URL =
  "https://www.kleague.com/record/team.do?leagueId=1&menuId=1010000000";

const KLEAGUE_TEAMS = {
  K01: {
    teamId: "kleague-ulsan",
    teamName: "울산 HD",
  },
  K03: {
    teamId: "kleague-pohang",
    teamName: "포항 스틸러스",
  },
  K04: {
    teamId: "kleague-jeju",
    teamName: "제주SK FC",
  },
  K05: {
    teamId: "kleague-jeonbuk",
    teamName: "전북 현대 모터스",
  },
  K09: {
    teamId: "kleague-seoul",
    teamName: "FC 서울",
  },
  K10: {
    teamId: "kleague-daejeon",
    teamName: "대전 하나시티즌",
  },
  K17: {
    teamId: "kleague-daegu",
    teamName: "대구 FC",
  },
  K18: {
    teamId: null,
    teamName: "인천 유나이티드",
  },
  K21: {
    teamId: "kleague-gangwon",
    teamName: "강원 FC",
  },
  K22: {
    teamId: null,
    teamName: "광주 FC",
  },
  K26: {
    teamId: null,
    teamName: "부천 FC 1995",
  },
  K27: {
    teamId: null,
    teamName: "FC 안양",
  },
  K29: {
    teamId: null,
    teamName: "수원 FC",
  },
  K35: {
    teamId: null,
    teamName: "김천 상무",
  },
};

const getKoreaYear = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);

  if (!year) {
    throw new Error("한국 시간 기준 현재 연도를 계산하지 못했습니다.");
  }

  return year;
};

const fetchKLeagueStandingsPayload = async (season) => {
  const url = new URL(KLEAGUE_STANDINGS_API_URL);

  url.searchParams.set("leagueId", "1");
  url.searchParams.set("year", String(season));
  url.searchParams.set("stadium", "all");
  url.searchParams.set("recordType", "rank");

  const responseText = await fetchTextWithRetry(url.toString(), {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      "Content-Type": "application/json; charset=UTF-8",
      Origin: "https://www.kleague.com",
      Referer: KLEAGUE_STANDINGS_PAGE_URL,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
    method: "POST",
  });

  return JSON.parse(responseText);
};

const getTeamInfo = (item) => {
  const teamCode = String(item.teamId ?? item.code ?? "").trim();
  const knownTeam = KLEAGUE_TEAMS[teamCode];
  const teamName =
    item.teamNameShort ||
    item.teamName ||
    item.teamNameFull ||
    knownTeam?.teamName ||
    teamCode;

  return {
    teamCode,
    teamId: knownTeam?.teamId ?? null,
    teamName: knownTeam?.teamName ?? teamName,
  };
};

const parseKLeagueStandings = (payload, season) => {
  const rawRows = payload?.data?.teamRank ?? payload?.teamRank ?? [];

  if (!Array.isArray(rawRows)) {
    throw new Error("K리그 공식 순위 응답의 teamRank 형식을 확인해 주세요.");
  }

  const seenTeamCodes = new Set();

  return rawRows
    .filter((item) => {
      if (!item?.teamId || seenTeamCodes.has(item.teamId)) {
        return false;
      }

      seenTeamCodes.add(item.teamId);

      return true;
    })
    .map((item) => {
      const teamInfo = getTeamInfo(item);
      const games = toNumber(item.gameCount);
      const wins = toNumber(item.winCnt);
      const recent = [
        item.game01,
        item.game02,
        item.game03,
        item.game04,
        item.game05,
        item.game06,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(" ");

      return {
        draws: toNumber(item.tieCnt),
        games,
        gamesBehind: "",
        leagueId: "kleague",
        leagueName: "K LEAGUE 1",
        losses: toNumber(item.lossCnt),
        points: toNumber(item.gainPoint),
        rank: toNumber(item.rank),
        recent,
        scoreAgainst: toNumber(item.lossGoal),
        scoreDiff: toNumber(item.gapCnt),
        scoreFor: toNumber(item.gainGoal),
        season,
        source: "KLEAGUE_OFFICIAL",
        sourceUrl: KLEAGUE_STANDINGS_PAGE_URL,
        streak: "",
        teamCode: teamInfo.teamCode,
        teamId: teamInfo.teamId,
        teamName: teamInfo.teamName,
        winRate: games > 0 ? Number((wins / games).toFixed(3)) : null,
        wins,
      };
    })
    .sort((firstRow, secondRow) => firstRow.rank - secondRow.rank);
};

const main = async () => {
  try {
    const season = getKoreaYear();

    console.log(`${season} K리그1 공식 순위 수집 시작`);

    const payload = await fetchKLeagueStandingsPayload(season);
    const standings = parseKLeagueStandings(payload, season);

    if (standings.length === 0) {
      throw new Error("K리그 공식 순위에서 추출된 팀이 없습니다.");
    }

    const outputPath = await saveStandingsToJson(
      `standings-kleague-${season}.json`,
      standings,
    );
    const syncedCount = await syncStandingsToSupabase(
      createSupabaseAdminClient(),
      standings,
    );

    console.log(`K리그1 공식 순위 ${standings.length}개 추출 완료`);
    console.log(`JSON 저장 위치: ${outputPath}`);
    console.log(`Supabase 순위 ${syncedCount}개 동기화 완료`);
  } catch (error) {
    console.error("K리그1 공식 순위 동기화 실패");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
};

main();
