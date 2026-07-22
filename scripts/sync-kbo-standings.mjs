import {
  createSupabaseAdminClient,
  extractHtmlTables,
  fetchTextWithRetry,
  saveStandingsToJson,
  syncStandingsToSupabase,
  toNumber,
  toNullableNumber,
} from "./team-standings-utils.mjs";

const KBO_STANDINGS_PAGE_URL =
  "https://www.koreabaseball.com/Record/TeamRank/TeamRank.aspx";

const KBO_TEAMS = {
  KIA: {
    teamCode: "KIA",
    teamId: "kbo-kia",
    teamName: "KIA 타이거즈",
  },
  KT: {
    teamCode: "KT",
    teamId: "kbo-kt",
    teamName: "KT 위즈",
  },
  LG: {
    teamCode: "LG",
    teamId: "kbo-lg",
    teamName: "LG 트윈스",
  },
  NC: {
    teamCode: "NC",
    teamId: "kbo-nc",
    teamName: "NC 다이노스",
  },
  SSG: {
    teamCode: "SSG",
    teamId: "kbo-ssg",
    teamName: "SSG 랜더스",
  },
  두산: {
    teamCode: "DOOSAN",
    teamId: "kbo-doosan",
    teamName: "두산 베어스",
  },
  롯데: {
    teamCode: "LOTTE",
    teamId: "kbo-lotte",
    teamName: "롯데 자이언츠",
  },
  삼성: {
    teamCode: "SAMSUNG",
    teamId: "kbo-samsung",
    teamName: "삼성 라이온즈",
  },
  키움: {
    teamCode: "KIWOOM",
    teamId: "kbo-kiwoom",
    teamName: "키움 히어로즈",
  },
  한화: {
    teamCode: "HANWHA",
    teamId: "kbo-hanwha",
    teamName: "한화 이글스",
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

const findTeamInfo = (teamName) => {
  const normalizedTeamName = teamName.replace(/\s+/g, "");
  const matchedTeam = Object.entries(KBO_TEAMS).find(([keyword]) =>
    normalizedTeamName.includes(keyword),
  );

  if (!matchedTeam) {
    return {
      teamCode: normalizedTeamName.toUpperCase(),
      teamId: null,
      teamName,
    };
  }

  return matchedTeam[1];
};

const findStandingsTable = (tables) =>
  tables.find(
    (table) =>
      table.some((row) => row.includes("팀명") && row.includes("승률")) &&
      table.some((row) => /^\d+$/.test(row[0] ?? "") && row.length >= 8),
  );

const parseKboStandings = (html, season) => {
  const tables = extractHtmlTables(html);
  const standingsTable = findStandingsTable(tables);

  if (!standingsTable) {
    throw new Error("KBO 공식 순위 표를 찾지 못했습니다.");
  }

  return standingsTable
    .filter((cells) => /^\d+$/.test(cells[0] ?? "") && cells.length >= 8)
    .map((cells) => {
      const teamInfo = findTeamInfo(cells[1]);
      const wins = toNumber(cells[3]);
      const losses = toNumber(cells[4]);
      const draws = toNumber(cells[5]);
      const scoreFor = toNullableNumber(cells[10]);
      const scoreAgainst = toNullableNumber(cells[11]);

      return {
        draws,
        games: toNumber(cells[2]),
        gamesBehind: cells[7] || "",
        leagueId: "kbo",
        leagueName: "KBO",
        losses,
        points: null,
        rank: toNumber(cells[0]),
        recent: cells[8] || "",
        scoreAgainst,
        scoreDiff:
          scoreFor === null || scoreAgainst === null
            ? null
            : scoreFor - scoreAgainst,
        scoreFor,
        season,
        source: "KBO_OFFICIAL",
        sourceUrl: KBO_STANDINGS_PAGE_URL,
        streak: cells[9] || "",
        teamCode: teamInfo.teamCode,
        teamId: teamInfo.teamId,
        teamName: teamInfo.teamName,
        winRate: toNumber(cells[6]),
        wins,
      };
    });
};

const main = async () => {
  try {
    const season = getKoreaYear();

    console.log(`${season} KBO 공식 순위 수집 시작`);

    const html = await fetchTextWithRetry(KBO_STANDINGS_PAGE_URL, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const standings = parseKboStandings(html, season);

    if (standings.length === 0) {
      throw new Error("KBO 공식 순위에서 추출된 팀이 없습니다.");
    }

    const outputPath = await saveStandingsToJson(
      `standings-kbo-${season}.json`,
      standings,
    );
    const syncedCount = await syncStandingsToSupabase(
      createSupabaseAdminClient(),
      standings,
    );

    console.log(`KBO 공식 순위 ${standings.length}개 추출 완료`);
    console.log(`JSON 저장 위치: ${outputPath}`);
    console.log(`Supabase 순위 ${syncedCount}개 동기화 완료`);
  } catch (error) {
    console.error("KBO 공식 순위 동기화 실패");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
};

main();
