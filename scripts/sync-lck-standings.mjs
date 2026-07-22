import {
  cleanText,
  createSupabaseAdminClient,
  fetchTextWithRetry,
  saveStandingsToJson,
  syncStandingsToSupabase,
  toNumber,
} from "./team-standings-utils.mjs";

const PANDASCORE_API_URL = "https://api.pandascore.co";
const PANDASCORE_SOURCE_URL = "https://www.pandascore.co";
const NAVER_LCK_STANDINGS_URL =
  "https://game.naver.com/esports/record/lck/team/lck_2026";
const NAVER_SOURCE_URL = "https://game.naver.com/esports/record/lck/team/lck_2026";

const { PANDASCORE_API_KEY } = process.env;

const LCK_TEAMS = [
  {
    keywords: ["T1"],
    teamCode: "T1",
    teamId: "lck-t1",
    teamName: "T1",
  },
  {
    keywords: ["GENG", "GEN.G", "GEN", "젠지"],
    teamCode: "GEN",
    teamId: "lck-gen",
    teamName: "Gen.G",
  },
  {
    keywords: ["HLE", "HANWHALIFE", "HANWHA", "한화생명", "한화생명E스포츠"],
    teamCode: "HLE",
    teamId: "lck-hle",
    teamName: "한화생명 e스포츠",
  },
  {
    keywords: ["DK", "DPLUSKIA", "DWGKIA"],
    teamCode: "DK",
    teamId: "lck-dk",
    teamName: "Dplus KIA",
  },
  {
    keywords: ["KT", "KTROLSTER", "KT롤스터"],
    teamCode: "KT",
    teamId: "lck-kt",
    teamName: "KT Rolster",
  },
  {
    keywords: ["KRX", "DRX", "KIWOOMDRX"],
    teamCode: "KRX",
    teamId: "lck-krx",
    teamName: "Kiwoom DRX",
  },
  {
    keywords: ["NS", "NONGSHIM", "NONGSHIMREDFORCE", "농심", "농심레드포스"],
    teamCode: "NS",
    teamId: "lck-ns",
    teamName: "농심 레드포스",
  },
  {
    keywords: ["BFX", "FEARX", "BNKFEARX"],
    teamCode: "BFX",
    teamId: "lck-bfx",
    teamName: "BNK FEARX",
  },
  {
    keywords: ["DNS", "DNSOOPERS", "DNFREECS", "KDF", "DN수퍼스"],
    teamCode: "DNS",
    teamId: "lck-dns",
    teamName: "DN SOOPers",
  },
  {
    keywords: ["BRO", "BRION", "HANJINBRION", "한진브리온"],
    teamCode: "BRO",
    teamId: "lck-bro",
    teamName: "HANJIN BRION",
  },
];

const sleep = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const isValidDate = (date) => !Number.isNaN(date.getTime());

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

const createSearchToken = (value) =>
  cleanText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9가-힣]/g, "");

const getTeamSourceValues = (team) => {
  if (typeof team === "string") {
    return [team];
  }

  return [
    team?.acronym,
    team?.code,
    team?.slug,
    team?.name,
    team?.nameAcronym,
    team?.nameEng,
    team?.nameEngAcronym,
    team?.team_id,
    team?.teamId,
    team?.id,
  ];
};

const createTeamCode = (team) => {
  const source = getTeamSourceValues(team).find(Boolean) || "";

  return createSearchToken(source).slice(0, 30);
};

const createTeamSearchTokens = (team) =>
  getTeamSourceValues(team)
    .map(createSearchToken)
    .filter(Boolean);

const findTeamInfo = (team) => {
  const searchTokens = createTeamSearchTokens(team);
  const searchTokenSet = new Set(searchTokens);
  const matchedTeam = LCK_TEAMS.find(({ keywords }) =>
    keywords
      .map(createSearchToken)
      .some((keyword) => searchTokenSet.has(keyword)),
  );

  if (matchedTeam) {
    return matchedTeam;
  }

  const searchableText = searchTokens.join(" ");
  const partialMatchedTeam = LCK_TEAMS.find(({ keywords }) =>
    keywords
      .map(createSearchToken)
      .some((keyword) => keyword.length > 2 && searchableText.includes(keyword)),
  );

  if (partialMatchedTeam) {
    return partialMatchedTeam;
  }

  const teamCode = createTeamCode(team);

  return {
    teamCode,
    teamId: null,
    teamName:
      cleanText(typeof team === "string" ? team : team?.name) || teamCode,
  };
};

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
    throw new Error("네이버 e스포츠 페이지에서 순위 데이터를 찾지 못했습니다.");
  }

  return JSON.parse(decodeJsonHtmlEntities(match[1]));
};

const readNullableNumber = (value) =>
  value === undefined || value === null || value === "" ? null : toNumber(value);

const normalizeNaverStandingRow = (row, season) => {
  const teamInfo = findTeamInfo(row?.team ?? row?.teamName ?? "");
  const wins = toNumber(row?.wins);
  const losses = toNumber(row?.loses ?? row?.losses);
  const draws = toNumber(row?.draws);
  const games = wins + losses + draws;
  const addInfo = row?.addInfo ?? {};

  return {
    assists: readNullableNumber(addInfo.assists),
    deaths: readNullableNumber(addInfo.deaths),
    draws,
    games,
    gamesBehind: "",
    kda: readNullableNumber(addInfo.kda),
    kills: readNullableNumber(addInfo.kills),
    leagueId: "lck",
    leagueName: "LCK",
    losses,
    points: null,
    rank: toNumber(row?.rank),
    recent: "",
    scoreAgainst: null,
    scoreDiff: readNullableNumber(row?.score),
    scoreFor: null,
    season,
    source: "NAVER_ESPORTS",
    sourceUrl: NAVER_SOURCE_URL,
    streak: "",
    teamCode: teamInfo.teamCode,
    teamId: teamInfo.teamId,
    teamName: teamInfo.teamName,
    winRate:
      row?.winRate === undefined || row?.winRate === null
        ? games > 0
          ? Number((wins / games).toFixed(2))
          : null
        : Number(row.winRate),
    wins,
  };
};

const fetchNaverEsportsStandings = async (season) => {
  const html = await fetchTextWithRetry(NAVER_LCK_STANDINGS_URL, {
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0",
    },
  });
  const nextData = extractNaverNextData(html);
  const rankings = nextData?.props?.initialState?.ranking?.teamRanking;

  if (!Array.isArray(rankings)) {
    throw new Error("네이버 e스포츠 LCK 순위 응답 형식을 확인해 주세요.");
  }

  return rankings
    .map((row) => normalizeNaverStandingRow(row, season))
    .filter((row) => row.teamCode && row.rank > 0)
    .sort((firstRow, secondRow) => firstRow.rank - secondRow.rank);
};

const fetchPandaScore = async (pathname, searchParams = {}, maxAttempts = 3) => {
  if (!PANDASCORE_API_KEY) {
    throw new Error(".env.sync의 PANDASCORE_API_KEY를 확인해 주세요.");
  }

  const url = new URL(pathname, PANDASCORE_API_URL);
  let lastError;

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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

      return response.json();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
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
    const data = await fetchPandaScore(pathname, {
      ...searchParams,
      "page[number]": pageNumber,
      "page[size]": pageSize,
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
  const data = await fetchPandaScore("/lol/leagues", {
    "page[number]": 1,
    "page[size]": 100,
    "search[name]": "LCK",
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
      !searchableText.includes("academy") &&
      !searchableText.includes("challenger")
    );
  });

  if (!fallbackLeague) {
    throw new Error("PandaScore에서 LCK 리그를 찾지 못했습니다.");
  }

  return fallbackLeague;
};

const getDateYear = (dateValue) => {
  const date = new Date(dateValue);

  if (!isValidDate(date)) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(date);

  return Number(parts.find((part) => part.type === "year")?.value) || null;
};

const getTournamentSearchText = (tournament) =>
  [
    tournament?.name,
    tournament?.slug,
    tournament?.serie?.name,
    tournament?.serie?.full_name,
  ]
    .map(cleanText)
    .join(" ")
    .toLowerCase();

const isRelevantLckTournament = (tournament, season) => {
  const beginYear = getDateYear(tournament?.begin_at);
  const endYear = getDateYear(tournament?.end_at);
  const searchText = getTournamentSearchText(tournament);

  return (
    (beginYear === season || endYear === season) &&
    !/academy|challenger|cl|asci/i.test(searchText)
  );
};

const getTournamentBeginTime = (tournament) => {
  const date = new Date(tournament?.begin_at);

  return isValidDate(date) ? date.getTime() : 0;
};

const getTournamentEndTime = (tournament) => {
  const date = new Date(tournament?.end_at);

  return isValidDate(date) ? date.getTime() : Number.POSITIVE_INFINITY;
};

const getTournamentPriority = (tournament, nowTime) => {
  const beginTime = getTournamentBeginTime(tournament);
  const endTime = getTournamentEndTime(tournament);
  const searchText = getTournamentSearchText(tournament);
  const isStarted = beginTime <= nowTime;
  const isActive = isStarted && endTime >= nowTime;
  const isRegularStage = /regular|season|split|regional/i.test(searchText);
  const isKnockoutStage = /playoff|playoffs|knockout|final/i.test(searchText);

  return (
    (isActive ? 1_000_000 : 0) +
    (isStarted ? 100_000 : 0) +
    (isRegularStage ? 10_000 : 0) -
    (isKnockoutStage ? 1_000 : 0) +
    beginTime / 1_000_000_000
  );
};

const findCurrentTournament = async (leagueId, season) => {
  const tournaments = await fetchAllPages(
    `/leagues/${leagueId}/tournaments`,
    {
      sort: "-begin_at",
    },
    3,
  );
  const nowTime = Date.now();

  const candidates = tournaments
    .filter((tournament) => isRelevantLckTournament(tournament, season))
    .filter((tournament) => getTournamentBeginTime(tournament) <= nowTime);

  const fallbackCandidates = tournaments.filter((tournament) =>
    isRelevantLckTournament(tournament, season),
  );

  return [...(candidates.length > 0 ? candidates : fallbackCandidates)].sort(
    (firstTournament, secondTournament) =>
      getTournamentPriority(secondTournament, nowTime) -
      getTournamentPriority(firstTournament, nowTime),
  )[0] ?? null;
};

const collectStandingRows = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap(collectStandingRows);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const candidateTeam =
    value.team ||
    value.participant ||
    value.opponent ||
    value.competitor ||
    value.entity;
  const hasRank =
    value.rank !== undefined ||
    value.position !== undefined ||
    value.place !== undefined;

  if (candidateTeam && hasRank) {
    return [value];
  }

  return Object.values(value).flatMap(collectStandingRows);
};

const normalizeStatKey = (key) =>
  cleanText(key)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getDirectStat = (row, keys) => {
  const normalizedKeys = keys.map(normalizeStatKey);
  const entry = Object.entries(row).find(([key]) =>
    normalizedKeys.includes(normalizeStatKey(key)),
  );

  return entry?.[1];
};

const getArrayStat = (stats, keys) => {
  if (!Array.isArray(stats)) {
    return undefined;
  }

  const normalizedKeys = keys.map(normalizeStatKey);
  const matchedStat = stats.find((stat) => {
    const statKey = normalizeStatKey(
      stat?.name ?? stat?.type ?? stat?.key ?? stat?.slug ?? stat?.label,
    );

    return normalizedKeys.includes(statKey);
  });

  return (
    matchedStat?.value ??
    matchedStat?.number ??
    matchedStat?.score ??
    matchedStat?.amount ??
    matchedStat?.total
  );
};

const getObjectStat = (stats, keys) => {
  if (!stats || Array.isArray(stats) || typeof stats !== "object") {
    return undefined;
  }

  return getDirectStat(stats, keys);
};

const readStandingStat = (row, keys, fallback = 0) => {
  const value =
    getDirectStat(row, keys) ??
    getArrayStat(row.stats, keys) ??
    getObjectStat(row.stats, keys) ??
    getArrayStat(row.statistics, keys) ??
    getObjectStat(row.statistics, keys);

  return value === undefined || value === null ? fallback : toNumber(value);
};

const normalizeStandingRow = (row, season) => {
  const team =
    row.team ||
    row.participant ||
    row.opponent ||
    row.competitor ||
    row.entity ||
    {};
  const teamInfo = findTeamInfo(team);
  const wins = readStandingStat(row, [
    "wins",
    "win",
    "matches_won",
    "match_wins",
    "game_wins",
    "games_won",
  ]);
  const losses = readStandingStat(row, [
    "losses",
    "loss",
    "matches_lost",
    "match_losses",
    "game_losses",
    "games_lost",
  ]);
  const draws = readStandingStat(row, ["draws", "ties", "tie"], 0);
  const games =
    readStandingStat(
      row,
      ["matches_played", "match_count", "played", "games", "game_count"],
      0,
    ) ||
    wins + losses + draws;
  const scoreFor =
    getDirectStat(row, ["games_for", "points_for", "for"]) ??
    getArrayStat(row.stats, ["games_for", "points_for", "for"]) ??
    getObjectStat(row.stats, ["games_for", "points_for", "for"]);
  const scoreAgainst =
    getDirectStat(row, ["games_against", "points_against", "against"]) ??
    getArrayStat(row.stats, ["games_against", "points_against", "against"]) ??
    getObjectStat(row.stats, ["games_against", "points_against", "against"]);
  const normalizedScoreFor =
    scoreFor === undefined || scoreFor === null ? null : toNumber(scoreFor);
  const normalizedScoreAgainst =
    scoreAgainst === undefined || scoreAgainst === null
      ? null
      : toNumber(scoreAgainst);

  return {
    draws,
    games,
    gamesBehind: "",
    leagueId: "lck",
    leagueName: "LCK",
    losses,
    points:
      row.points === undefined || row.points === null
        ? null
        : toNumber(row.points),
    rank: toNumber(row.rank ?? row.position ?? row.place),
    recent: "",
    scoreAgainst: normalizedScoreAgainst,
    scoreDiff:
      normalizedScoreFor === null || normalizedScoreAgainst === null
        ? null
        : normalizedScoreFor - normalizedScoreAgainst,
    scoreFor: normalizedScoreFor,
    season,
    source: "PANDASCORE_STANDINGS",
    sourceUrl: PANDASCORE_SOURCE_URL,
    streak: "",
    teamCode: teamInfo.teamCode,
    teamId: teamInfo.teamId,
    teamName: teamInfo.teamName,
    winRate: games > 0 ? Number((wins / games).toFixed(3)) : null,
    wins,
  };
};

const fetchTournamentStandings = async (tournamentId, season) => {
  const payload = await fetchPandaScore(
    `/tournaments/${tournamentId}/standings`,
    {
      "page[number]": 1,
      "page[size]": 100,
    },
  );
  const rows = collectStandingRows(payload)
    .map((row) => normalizeStandingRow(row, season))
    .filter((row) => row.teamCode && row.rank > 0);
  const uniqueRows = new Map();

  rows.forEach((row) => {
    if (!uniqueRows.has(row.teamCode)) {
      uniqueRows.set(row.teamCode, row);
    }
  });

  return [...uniqueRows.values()].sort(
    (firstRow, secondRow) => firstRow.rank - secondRow.rank,
  );
};

const getTeamScore = (match, teamId) => {
  const result = (match?.results ?? []).find(
    (item) => String(item?.team_id) === String(teamId),
  );
  const score = Number(result?.score);

  return Number.isFinite(score) ? score : null;
};

const createFallbackStandingRows = (season) =>
  new Map(
    LCK_TEAMS.map((team) => [
      team.teamCode,
      {
        draws: 0,
        assists: null,
        deaths: null,
        games: 0,
        gamesBehind: "",
        kda: null,
        kills: null,
        leagueId: "lck",
        leagueName: "LCK",
        losses: 0,
        points: null,
        rank: 0,
        recent: "",
        scoreAgainst: 0,
        scoreDiff: 0,
        scoreFor: 0,
        season,
        source: "PANDASCORE_MATCHES",
        sourceUrl: PANDASCORE_SOURCE_URL,
        streak: "",
        teamCode: team.teamCode,
        teamId: team.teamId,
        teamName: team.teamName,
        winRate: null,
        wins: 0,
      },
    ]),
  );

const createMatchBasedStandings = (matches, season, source) => {
  const standingsByTeamCode = createFallbackStandingRows(season);

  matches
    .filter((match) => getDateYear(match?.begin_at) === season)
    .forEach((match) => {
      const opponents = (match?.opponents ?? [])
        .map((item) => item?.opponent)
        .filter(Boolean);

      if (opponents.length < 2) {
        return;
      }

      const [firstTeam, secondTeam] = opponents;
      const firstTeamInfo = findTeamInfo(firstTeam);
      const secondTeamInfo = findTeamInfo(secondTeam);
      const firstScore = getTeamScore(match, firstTeam.id);
      const secondScore = getTeamScore(match, secondTeam.id);

      if (
        !firstTeamInfo.teamCode ||
        !secondTeamInfo.teamCode ||
        firstScore === null ||
        secondScore === null
      ) {
        return;
      }

      const firstRow = standingsByTeamCode.get(firstTeamInfo.teamCode);
      const secondRow = standingsByTeamCode.get(secondTeamInfo.teamCode);

      if (!firstRow || !secondRow) {
        return;
      }

      firstRow.games += 1;
      firstRow.scoreFor += firstScore;
      firstRow.scoreAgainst += secondScore;

      secondRow.games += 1;
      secondRow.scoreFor += secondScore;
      secondRow.scoreAgainst += firstScore;

      if (firstScore > secondScore) {
        firstRow.wins += 1;
        secondRow.losses += 1;
        return;
      }

      if (firstScore < secondScore) {
        firstRow.losses += 1;
        secondRow.wins += 1;
        return;
      }

      firstRow.draws += 1;
      secondRow.draws += 1;
    });

  return [...standingsByTeamCode.values()]
    .map((row) => ({
      ...row,
      scoreDiff: row.scoreFor - row.scoreAgainst,
      winRate:
        row.games > 0 ? Number((row.wins / row.games).toFixed(3)) : null,
    }))
    .sort(
      (firstRow, secondRow) =>
        secondRow.wins - firstRow.wins ||
        firstRow.losses - secondRow.losses ||
        secondRow.scoreDiff - firstRow.scoreDiff ||
        firstRow.teamName.localeCompare(secondRow.teamName, "ko"),
    )
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      source,
    }));
};

const fetchTournamentMatchStandings = async (tournamentId, season) => {
  const matches = await fetchAllPages(
    `/tournaments/${tournamentId}/matches`,
    {
      "filter[status]": "finished",
      sort: "-begin_at",
    },
    5,
  );

  return createMatchBasedStandings(
    matches,
    season,
    "PANDASCORE_TOURNAMENT_MATCHES",
  );
};

const fetchFallbackLeagueMatchStandings = async (leagueId, season) => {
  const matches = await fetchAllPages(
    `/leagues/${leagueId}/matches`,
    {
      "filter[status]": "finished",
      sort: "-begin_at",
    },
    5,
  );

  return createMatchBasedStandings(matches, season, "PANDASCORE_MATCHES");
};

const main = async () => {
  try {
    const season = getKoreaYear();
    let standings = [];

    console.log(`${season} LCK 네이버 e스포츠 순위 수집 시작`);

    try {
      standings = await fetchNaverEsportsStandings(season);
    } catch (error) {
      console.warn(
        `네이버 e스포츠 순위 조회를 건너뜁니다: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    if (standings.length === 0) {
      const lckLeague = await findLckLeague();

      console.log(
        `${season} LCK PandaScore 순위 수집 시작: ${lckLeague.name} (${lckLeague.id})`,
      );

      const tournament = await findCurrentTournament(lckLeague.id, season);

      if (tournament?.id) {
        console.log(
          `LCK 순위 기준 토너먼트: ${cleanText(tournament.name ?? tournament.slug)} (${tournament.id})`,
        );

        try {
          standings = await fetchTournamentStandings(tournament.id, season);
        } catch (error) {
          console.warn(
            `LCK 토너먼트 순위 조회를 건너뜁니다: ${
              error instanceof Error ? error.message : error
            }`,
          );
        }
      }

      if (
        standings.length === 0 ||
        !standings.some((standing) => standing.games > 0)
      ) {
        standings = tournament?.id
          ? await fetchTournamentMatchStandings(tournament.id, season)
          : await fetchFallbackLeagueMatchStandings(lckLeague.id, season);
      }

      if (
        standings.length === 0 ||
        !standings.some((standing) => standing.games > 0)
      ) {
        standings = await fetchFallbackLeagueMatchStandings(
          lckLeague.id,
          season,
        );
      }
    }

    if (standings.length === 0) {
      throw new Error("LCK 순위에서 추출된 팀이 없습니다.");
    }

    const outputPath = await saveStandingsToJson(
      `standings-lck-${season}.json`,
      standings,
    );
    const syncedCount = await syncStandingsToSupabase(
      createSupabaseAdminClient(),
      standings,
    );

    console.log(`LCK 순위 ${standings.length}개 추출 완료`);
    console.log(`JSON 저장 위치: ${outputPath}`);
    console.log(`Supabase 순위 ${syncedCount}개 동기화 완료`);
  } catch (error) {
    console.error("LCK 순위 동기화 실패");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
};

main();
