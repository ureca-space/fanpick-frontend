import { getTeamInfo } from "../../constants/teamInfo.js";
import { normalizeMatchTimingStatus } from "../../utils/matchStatus.js";
import { FEATURED_TEAMS } from "./data/teams.js";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export const UPCOMING_MATCH_LIMIT = 6;
export const FINISHED_MATCH_LIMIT = 6;
export const PREDICTION_RESULT_LIMIT = 6;
export const ROSTER_PAGE_SIZE = 8;
export const REALTIME_REFRESH_DEBOUNCE_MS = 500;
export const TEAM_DETAIL_NAV_ITEMS = [
  { id: "team-schedule", label: "경기 일정" },
  { id: "team-results", label: "경기 결과" },
  { id: "team-standings", label: "순위" },
  {
    id: "team-prediction-results",
    label: "승부 예측 결과",
  },
];
export const MATCH_STATUS_LABELS = {
  live: "LIVE",
  result_pending: "확인중",
  finished: "종료",
  cancelled: "취소",
  postponed: "연기",
};
export const CLOSED_MATCH_STATUSES = new Set(["cancelled", "postponed"]);

const SCORE_VISIBLE_STATUSES = new Set(["live", "finished"]);
const SPORT_LABELS = {
  baseball: "BASEBALL",
  esports: "LOL",
  soccer: "SOCCER",
};
const STANDING_SOURCE_LABELS = {
  KBO_OFFICIAL: "KBO 공식",
  KLEAGUE_OFFICIAL: "K리그 공식",
  NAVER_ESPORTS: "네이버 e스포츠",
  PANDASCORE_MATCHES: "PandaScore 경기 결과",
  PANDASCORE_STANDINGS: "PandaScore 순위",
  PANDASCORE_TOURNAMENT_MATCHES: "PandaScore 현재 대회",
};
const KLEAGUE_LOGO_URL = "https://www.kleague.com/assets/images/emblem";
const STANDING_TEAM_LOGOS_BY_CODE = {
  K01: `${KLEAGUE_LOGO_URL}/emblem_K01.png`,
  K03: `${KLEAGUE_LOGO_URL}/emblem_K03.png`,
  K04: `${KLEAGUE_LOGO_URL}/emblem_K04.png`,
  K05: `${KLEAGUE_LOGO_URL}/emblem_K05.png`,
  K09: `${KLEAGUE_LOGO_URL}/emblem_K09.png`,
  K10: `${KLEAGUE_LOGO_URL}/emblem_K10.png`,
  K17: `${KLEAGUE_LOGO_URL}/emblem_K17.png`,
  K18: `${KLEAGUE_LOGO_URL}/emblem_K18.png`,
  K21: `${KLEAGUE_LOGO_URL}/emblem_K21.png`,
  K22: `${KLEAGUE_LOGO_URL}/emblem_K22.png`,
  K26: `${KLEAGUE_LOGO_URL}/emblem_K26.png`,
  K27: `${KLEAGUE_LOGO_URL}/emblem_K27.png`,
  K29: `${KLEAGUE_LOGO_URL}/emblem_K29.png`,
  K35: `${KLEAGUE_LOGO_URL}/emblem_K35.png`,
};

const padNumber = (number) => String(number).padStart(2, "0");

export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());

  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day, 12);
};

export const getAverageRating = (ratings) => {
  if (!ratings.length) {
    return 0;
  }

  const total = ratings.reduce((sum, rating) => sum + rating.score, 0);

  return Number((total / ratings.length).toFixed(1));
};

const normalizeTeamCode = (teamCode) => teamCode?.trim().toUpperCase() || "";

export const getStandingSourceLabel = (source) =>
  STANDING_SOURCE_LABELS[source] ?? source ?? "공식 순위";

export const getStandingSummaryText = (standingRow, leagueId) => {
  if (leagueId === "kleague" && standingRow.points !== null) {
    return `${standingRow.points}점 · ${standingRow.wins}승 ${standingRow.draws}무 ${standingRow.losses}패`;
  }

  if (leagueId === "lck") {
    return `${standingRow.wins}승 ${standingRow.losses}패`;
  }

  return `${standingRow.wins}승 ${standingRow.draws}무 ${standingRow.losses}패`;
};

const escapePostgrestListValue = (value) =>
  `"${String(value).replaceAll('"', '""')}"`;

export const createTeamMatchFilter = (team) => {
  const matchCodes = [
    ...new Set(team.matchCodes.map((teamCode) => normalizeTeamCode(teamCode))),
  ].filter(Boolean);

  if (matchCodes.length === 0) {
    return "";
  }

  const codeList = matchCodes.map(escapePostgrestListValue).join(",");

  return `home_team_code.in.(${codeList}),away_team_code.in.(${codeList})`;
};

export const isTeamMatch = (match, team) => {
  const homeTeamCode = normalizeTeamCode(
    match.home_team_code ?? match.homeTeamCode,
  );
  const awayTeamCode = normalizeTeamCode(
    match.away_team_code ?? match.awayTeamCode,
  );

  return team.matchCodes.some(
    (teamCode) => teamCode === homeTeamCode || teamCode === awayTeamCode,
  );
};

const getStandingWins = ({ draws, games, losses, wins }) => {
  const normalizedGames = Number(games ?? 0);
  const normalizedWins = Number(wins ?? 0);
  const normalizedDraws = Number(draws ?? 0);
  const normalizedLosses = Number(losses ?? 0);
  const derivedWins = normalizedGames - normalizedDraws - normalizedLosses;

  if (normalizedWins > 0 || derivedWins <= 0) {
    return normalizedWins;
  }

  return derivedWins;
};

const createOfficialStandingTeam = (standing) => {
  const teamCode = normalizeTeamCode(standing.team_code);
  const leagueId = standing.league_id;
  const matchedTeam = FEATURED_TEAMS.find(
    (featuredTeam) =>
      featuredTeam.league === leagueId &&
      (featuredTeam.id === standing.team_id ||
        featuredTeam.matchCodes.includes(teamCode)),
  );

  return (
    matchedTeam ?? {
      id: standing.team_id || `standing-${standing.league_id}-${teamCode}`,
      logo: STANDING_TEAM_LOGOS_BY_CODE[teamCode] ?? "",
      name: standing.team_name,
      shortName: teamCode,
    }
  );
};

export const normalizeOfficialStandings = (standings) =>
  standings.map((standing) => {
    const draws = Number(standing.draws ?? 0);
    const games = Number(standing.games ?? 0);
    const losses = Number(standing.losses ?? 0);
    const wins = getStandingWins({
      draws,
      games,
      losses,
      wins: standing.wins,
    });

    return {
      assists:
        standing.assists === null || standing.assists === undefined
          ? null
          : Number(standing.assists),
      deaths:
        standing.deaths === null || standing.deaths === undefined
          ? null
          : Number(standing.deaths),
      draws,
      games,
      gamesBehind: standing.games_behind ?? "",
      id: `${standing.league_id}-${standing.season}-${standing.team_code}`,
      kda:
        standing.kda === null || standing.kda === undefined
          ? null
          : Number(standing.kda),
      kills:
        standing.kills === null || standing.kills === undefined
          ? null
          : Number(standing.kills),
      losses,
      points:
        standing.points === null || standing.points === undefined
          ? null
          : Number(standing.points),
      rank: Number(standing.rank ?? 0),
      recent: standing.recent ?? "",
      scoreAgainst:
        standing.score_against === null || standing.score_against === undefined
          ? null
          : Number(standing.score_against),
      scoreDiff:
        standing.score_diff === null || standing.score_diff === undefined
          ? null
          : Number(standing.score_diff),
      scoreFor:
        standing.score_for === null || standing.score_for === undefined
          ? null
          : Number(standing.score_for),
      source: standing.source,
      sourceUrl: standing.source_url,
      streak: standing.streak ?? "",
      team: createOfficialStandingTeam(standing),
      updatedAt: standing.updated_at,
      winRate:
        standing.win_rate === null || standing.win_rate === undefined
          ? null
          : Number(standing.win_rate),
      wins,
    };
  });

export const isStandingTeamActive = (standingRow, team) => {
  if (!team) {
    return false;
  }

  return (
    standingRow.team.id === team.id ||
    team.matchCodes.includes(normalizeTeamCode(standingRow.team.shortName))
  );
};

const parseScore = (score) => {
  if (!score) {
    return {
      awayScore: null,
      homeScore: null,
    };
  }

  const [awayScore, homeScore] = score.split(":").map(Number);

  return {
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
  };
};

const hasFinishedScore = (match) => {
  const { awayScore, homeScore } = parseScore(match.score);

  return match.status === "finished" && awayScore !== null && homeScore !== null;
};

export const isResultMatch = (match) =>
  hasFinishedScore(match) || CLOSED_MATCH_STATUSES.has(match.status);

export const formatScoreText = (match) => {
  const { awayScore, homeScore } = parseScore(match.score);

  if (
    !SCORE_VISIBLE_STATUSES.has(match.status) ||
    awayScore === null ||
    homeScore === null
  ) {
    return "VS";
  }

  return `${homeScore} : ${awayScore}`;
};

export const compareMatchesAscending = (firstMatch, secondMatch) =>
  `${firstMatch.dateKey} ${firstMatch.time}`.localeCompare(
    `${secondMatch.dateKey} ${secondMatch.time}`,
  );

export const compareMatchesDescending = (firstMatch, secondMatch) =>
  compareMatchesAscending(secondMatch, firstMatch);

export const normalizeMatch = (match) => {
  const matchDate = parseDateKey(match.match_date);
  const time = match.match_time?.slice(0, 5) || "미정";
  const timingStatus = normalizeMatchTimingStatus({
    matchDate: match.match_date,
    matchTime: time,
    score: match.score,
    sport: match.sport,
    status: match.status,
  });

  return {
    id: match.external_id ?? `match-${match.id}`,
    databaseId: match.id,
    dateKey: match.match_date,
    date: `${padNumber(matchDate.getMonth() + 1)}.${padNumber(
      matchDate.getDate(),
    )}`,
    day: DAY_LABELS[matchDate.getDay()],
    time,
    sport: match.sport,
    sportLabel: SPORT_LABELS[match.sport] ?? match.sport?.toUpperCase() ?? "",
    league: match.league,
    status: timingStatus.status,
    score: timingStatus.score,
    hasScore:
      SCORE_VISIBLE_STATUSES.has(timingStatus.status) &&
      Boolean(timingStatus.score),
    homeTeamCode: normalizeTeamCode(match.home_team_code),
    awayTeamCode: normalizeTeamCode(match.away_team_code),
    homeTeam: getTeamInfo(match.home_team_code, match.sport),
    awayTeam: getTeamInfo(match.away_team_code, match.sport),
    homeVotes: 50,
    awayVotes: 50,
  };
};

export const getPredictionRates = (match) => {
  const homeVotes = Number(match.homeVotes ?? 50);
  const awayVotes = Number(match.awayVotes ?? 50);
  const totalVotes = homeVotes + awayVotes;

  if (
    !Number.isFinite(homeVotes) ||
    !Number.isFinite(awayVotes) ||
    totalVotes <= 0
  ) {
    return {
      homeRate: 50,
      awayRate: 50,
    };
  }

  const homeRate = Math.round((homeVotes / totalVotes) * 100);

  return {
    homeRate,
    awayRate: 100 - homeRate,
  };
};

const createInitialStandingRow = (team) => ({
  team,
  draws: 0,
  games: 0,
  losses: 0,
  points: 0,
  rank: 0,
  scoreAgainst: 0,
  scoreDiff: 0,
  scoreFor: 0,
  winRate: 0,
  wins: 0,
});

const updateStandingRow = (row, scoreFor, scoreAgainst) => {
  row.games += 1;
  row.scoreFor += scoreFor;
  row.scoreAgainst += scoreAgainst;

  if (scoreFor > scoreAgainst) {
    row.wins += 1;
    row.points += 3;
    return;
  }

  if (scoreFor < scoreAgainst) {
    row.losses += 1;
    return;
  }

  row.draws += 1;
  row.points += 1;
};

const sortStandingRows = (leagueId) => (firstRow, secondRow) => {
  if (leagueId === "kleague") {
    return (
      secondRow.points - firstRow.points ||
      secondRow.scoreDiff - firstRow.scoreDiff ||
      secondRow.scoreFor - firstRow.scoreFor ||
      secondRow.wins - firstRow.wins ||
      firstRow.team.name.localeCompare(secondRow.team.name, "ko")
    );
  }

  return (
    secondRow.winRate - firstRow.winRate ||
    secondRow.wins - firstRow.wins ||
    secondRow.scoreDiff - firstRow.scoreDiff ||
    secondRow.scoreFor - firstRow.scoreFor ||
    firstRow.team.name.localeCompare(secondRow.team.name, "ko")
  );
};

export const createLeagueStandings = (matches, leagueTeams, leagueId) => {
  const standingsByTeamId = new Map(
    leagueTeams.map((team) => [team.id, createInitialStandingRow(team)]),
  );
  const teamsByMatchCode = new Map(
    leagueTeams.flatMap((team) =>
      team.matchCodes.map((teamCode) => [normalizeTeamCode(teamCode), team]),
    ),
  );

  matches.forEach((match) => {
    if (!hasFinishedScore(match)) {
      return;
    }

    const homeTeam = teamsByMatchCode.get(normalizeTeamCode(match.homeTeamCode));
    const awayTeam = teamsByMatchCode.get(normalizeTeamCode(match.awayTeamCode));

    if (!homeTeam || !awayTeam) {
      return;
    }

    const { awayScore, homeScore } = parseScore(match.score);
    const homeRow = standingsByTeamId.get(homeTeam.id);
    const awayRow = standingsByTeamId.get(awayTeam.id);

    updateStandingRow(homeRow, homeScore, awayScore);
    updateStandingRow(awayRow, awayScore, homeScore);
  });

  return [...standingsByTeamId.values()]
    .map((row) => {
      const decisiveGames = row.wins + row.losses;

      return {
        ...row,
        scoreDiff: row.scoreFor - row.scoreAgainst,
        winRate: decisiveGames
          ? Number((row.wins / decisiveGames).toFixed(3))
          : 0,
      };
    })
    .sort(sortStandingRows(leagueId))
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
};
