import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button/Button";
import EmptyState from "../../components/EmptyState/EmptyState";
import FanPickDialog from "../../components/FanPickDialog/FanPickDialog";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import Skeleton from "../../components/Skeleton/Skeleton";
import SubNav from "../../components/SubNav/SubNav";
import useAuth from "../../contexts/useAuth";
import { getTeamInfo } from "../../constants/teamInfo.js";
import { supabase } from "../../lib/supabase.js";
import { subscribeToMatchChanges } from "../../services/matchRealtime.js";
import {
  applyPredictionStatsToMatches,
  fetchMatchPredictionStats,
  fetchMyPredictionSelections,
  markPredictedMatches,
} from "../../services/predictionApi.js";
import { fetchTeamStandings } from "../../services/teamStandings.js";
import {
  createPredictionLocation,
  createPredictionPath,
} from "../../utils/predictionPath.js";
import {
  FAVORITE_TEAMS_CHANGED_EVENT,
  fetchFavoriteTeamIds,
  getFavoriteTeamIds,
  toggleFavoriteTeamId,
} from "../../services/favoriteTeams.js";
import { FEATURED_TEAMS, TEAM_BY_ID, TEAM_LEAGUE_LABELS } from "./data/teams.js";
import styles from "./TeamDetailPage.module.css";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const UPCOMING_MATCH_LIMIT = 6;
const FINISHED_MATCH_LIMIT = 6;
const PREDICTION_RESULT_LIMIT = 6;
const ROSTER_PAGE_SIZE = 8;
const SPORT_LABELS = {
  baseball: "BASEBALL",
  esports: "LOL",
  soccer: "SOCCER",
};
const TEAM_DETAIL_NAV_ITEMS = [
  { id: "team-schedule", label: "경기 일정" },
  { id: "team-results", label: "경기 결과" },
  { id: "team-standings", label: "순위" },
  {
    id: "team-prediction-results",
    label: "승부 예측 결과",
  },
];
const MATCH_STATUS_LABELS = {
  live: "LIVE",
  finished: "종료",
  cancelled: "취소",
  postponed: "연기",
};
const SCORE_VISIBLE_STATUSES = new Set(["live", "finished"]);
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

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());

  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day, 12);
};

const getAverageRating = (ratings) => {
  if (!ratings.length) {
    return 0;
  }

  const total = ratings.reduce((sum, rating) => sum + rating.score, 0);

  return Number((total / ratings.length).toFixed(1));
};

const normalizeTeamCode = (teamCode) => teamCode?.trim().toUpperCase() || "";

const getStandingSourceLabel = (source) =>
  STANDING_SOURCE_LABELS[source] ?? source ?? "공식 순위";

const formatStandingValue = (value) =>
  value === null || value === undefined || value === "" ? "-" : value;

const formatStandingNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);

  return Number.isFinite(number) ? number.toLocaleString("ko-KR") : value;
};

const formatStandingDecimal = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  return number.toFixed(2).replace(/\.?0+$/, "");
};

const formatStandingWinRate = (winRate) =>
  winRate === null || winRate === undefined ? "-" : winRate.toFixed(3);

const STANDING_COLUMNS_BY_LEAGUE = {
  kbo: [
    { key: "games", label: "경기", render: (row) => row.games },
    { key: "wins", label: "승", render: (row) => row.wins },
    { key: "draws", label: "무", render: (row) => row.draws },
    { key: "losses", label: "패", render: (row) => row.losses },
    {
      key: "winRate",
      label: "승률",
      render: (row) => formatStandingWinRate(row.winRate),
    },
    {
      key: "gamesBehind",
      label: "게임차",
      render: (row) => formatStandingValue(row.gamesBehind),
    },
    {
      key: "recent",
      label: "최근10경기",
      render: (row) => formatStandingValue(row.recent),
    },
    {
      key: "streak",
      label: "연속",
      render: (row) => formatStandingValue(row.streak),
    },
  ],
  kleague: [
    { key: "games", label: "경기", render: (row) => row.games },
    {
      key: "points",
      label: "승점",
      render: (row) => formatStandingValue(row.points),
    },
    { key: "wins", label: "승", render: (row) => row.wins },
    { key: "draws", label: "무", render: (row) => row.draws },
    { key: "losses", label: "패", render: (row) => row.losses },
    {
      key: "scoreFor",
      label: "득점",
      render: (row) => formatStandingValue(row.scoreFor),
    },
    {
      key: "scoreAgainst",
      label: "실점",
      render: (row) => formatStandingValue(row.scoreAgainst),
    },
    {
      key: "scoreDiff",
      label: "득실",
      render: (row) => formatStandingValue(row.scoreDiff),
    },
  ],
  lck: [
    { key: "wins", label: "승", render: (row) => row.wins },
    { key: "losses", label: "패", render: (row) => row.losses },
    {
      key: "scoreDiff",
      label: "득실차",
      render: (row) => formatStandingValue(row.scoreDiff),
    },
    {
      key: "winRate",
      label: "승률",
      render: (row) => formatStandingDecimal(row.winRate),
    },
    {
      key: "kda",
      label: "KDA",
      render: (row) => formatStandingDecimal(row.kda),
    },
    {
      key: "kills",
      label: "킬",
      render: (row) => formatStandingNumber(row.kills),
    },
    {
      key: "deaths",
      label: "데스",
      render: (row) => formatStandingNumber(row.deaths),
    },
    {
      key: "assists",
      label: "어시스트",
      render: (row) => formatStandingNumber(row.assists),
    },
  ],
};

const getStandingColumns = (leagueId) =>
  STANDING_COLUMNS_BY_LEAGUE[leagueId] ?? STANDING_COLUMNS_BY_LEAGUE.kbo;

const getStandingSummaryText = (standingRow, leagueId) => {
  if (leagueId === "kleague" && standingRow.points !== null) {
    return `${standingRow.points}점 · ${standingRow.wins}승 ${standingRow.draws}무 ${standingRow.losses}패`;
  }

  if (leagueId === "lck") {
    return `${standingRow.wins}승 ${standingRow.losses}패`;
  }

  return `${standingRow.wins}승 ${standingRow.draws}무 ${standingRow.losses}패`;
};

const isTeamMatch = (match, team) => {
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

const normalizeOfficialStandings = (standings) =>
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

const isStandingTeamActive = (standingRow, team) => {
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

const formatScoreText = (match) => {
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

const getTeamSide = (match, team) => {
  const homeTeamCode = normalizeTeamCode(match.homeTeamCode);
  const awayTeamCode = normalizeTeamCode(match.awayTeamCode);

  if (team.matchCodes.includes(homeTeamCode)) {
    return "home";
  }

  if (team.matchCodes.includes(awayTeamCode)) {
    return "away";
  }

  return "";
};

const getTeamMatchResult = (match, team) => {
  if (!hasFinishedScore(match)) {
    return "pending";
  }

  const { awayScore, homeScore } = parseScore(match.score);
  const teamSide = getTeamSide(match, team);

  if (homeScore === awayScore) {
    return "draw";
  }

  if (teamSide === "home") {
    return homeScore > awayScore ? "win" : "loss";
  }

  if (teamSide === "away") {
    return awayScore > homeScore ? "win" : "loss";
  }

  return "pending";
};

const TEAM_RESULT_LABELS = {
  draw: "무승부",
  loss: "패배",
  pending: "결과 대기",
  win: "승리",
};

const compareMatchesAscending = (firstMatch, secondMatch) =>
  `${firstMatch.dateKey} ${firstMatch.time}`.localeCompare(
    `${secondMatch.dateKey} ${secondMatch.time}`,
  );

const compareMatchesDescending = (firstMatch, secondMatch) =>
  compareMatchesAscending(secondMatch, firstMatch);

const normalizeMatch = (match) => {
  const matchDate = parseDateKey(match.match_date);

  return {
    id: match.external_id ?? `match-${match.id}`,
    databaseId: match.id,
    dateKey: match.match_date,
    date: `${padNumber(matchDate.getMonth() + 1)}.${padNumber(
      matchDate.getDate(),
    )}`,
    day: DAY_LABELS[matchDate.getDay()],
    time: match.match_time?.slice(0, 5) || "미정",
    sport: match.sport,
    sportLabel: SPORT_LABELS[match.sport] ?? match.sport?.toUpperCase() ?? "",
    league: match.league,
    status: match.status,
    score: match.score,
    hasScore:
      SCORE_VISIBLE_STATUSES.has(match.status) && Boolean(match.score),
    homeTeamCode: normalizeTeamCode(match.home_team_code),
    awayTeamCode: normalizeTeamCode(match.away_team_code),
    homeTeam: getTeamInfo(match.home_team_code, match.sport),
    awayTeam: getTeamInfo(match.away_team_code, match.sport),
    homeVotes: 50,
    awayVotes: 50,
  };
};

const getPredictionRates = (match) => {
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

const createLeagueStandings = (matches, leagueTeams, leagueId) => {
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

const TeamLogo = ({ team, className = "" }) => {
  const [hasError, setHasError] = useState(false);

  if (!team.logo || hasError) {
    return (
      <div className={`${styles.logoFallback} ${className}`} aria-hidden="true">
        {team.shortName}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={team.logo}
      alt={`${team.name} 로고`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

const TeamBadgeLogo = ({ team }) => {
  const [hasError, setHasError] = useState(false);

  if (!team.logo || hasError) {
    return (
      <span className={styles.matchLogoFallback} aria-hidden="true">
        {team.shortName}
      </span>
    );
  }

  return (
    <img
      className={styles.matchLogo}
      src={team.logo}
      alt={`${team.name} 로고`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

const TeamMatchCardSkeleton = () => (
  <article
    className={`${styles.matchCard} ${styles.matchSkeletonCard}`}
    aria-label="팀 경기 일정 로딩 중"
  >
    <div className={styles.matchDate}>
      <Skeleton.Line className={styles.skeletonMatchDate} />
      <Skeleton.Line className={styles.skeletonMatchTime} />
    </div>

    <div className={styles.matchTeams}>
      <div>
        <Skeleton.Circle className={styles.skeletonMatchLogo} />
        <Skeleton.Line className={styles.skeletonMatchTeamName} />
      </div>

      <Skeleton.Line className={styles.skeletonMatchVs} />

      <div>
        <Skeleton.Circle className={styles.skeletonMatchLogo} />
        <Skeleton.Line className={styles.skeletonMatchTeamName} />
      </div>
    </div>

    <div className={styles.matchPrediction}>
      <div className={styles.predictionLabels}>
        <Skeleton.Line className={styles.skeletonPredictionLabel} />
        <Skeleton.Line className={styles.skeletonPredictionLabel} />
      </div>

      <Skeleton.Line className={styles.skeletonPredictionBar} />
    </div>

    <div className={styles.matchMeta}>
      <Skeleton.Line className={styles.skeletonMatchLeague} />
      <Skeleton.Line className={styles.skeletonMatchStatus} />
    </div>

    <Skeleton.Line className={styles.skeletonMatchButton} />
  </article>
);

const TeamDetailMatchCard = ({
  isAuthLoading,
  match,
  onVoteClick,
  team,
  variant = "schedule",
}) => {
  const { homeRate, awayRate } = getPredictionRates(match);
  const result = getTeamMatchResult(match, team);
  const hasScore = formatScoreText(match) !== "VS";
  const showPrediction = variant !== "result";
  const showAction = variant === "schedule";
  const leaderText =
    homeRate === awayRate
      ? "예측 동률"
      : `${homeRate > awayRate ? match.homeTeam.name : match.awayTeam.name} 우세`;

  return (
    <article className={styles.matchCard}>
      <div className={styles.matchDate}>
        <strong>{match.date}</strong>
        <span>{match.day} · {match.time}</span>
      </div>

      <div className={styles.matchTeams}>
        <div>
          <TeamBadgeLogo team={match.homeTeam} />
          <span>{match.homeTeam.name}</span>
        </div>

        <strong className={hasScore ? styles.matchScore : ""}>
          {formatScoreText(match)}
        </strong>

        <div>
          <TeamBadgeLogo team={match.awayTeam} />
          <span>{match.awayTeam.name}</span>
        </div>
      </div>

      {showPrediction && (
        <div className={styles.matchPrediction}>
          <div className={styles.predictionLabels}>
            <span>
              {match.homeTeam.name}
              <strong>{homeRate}%</strong>
            </span>

            <span>
              <strong>{awayRate}%</strong>
              {match.awayTeam.name}
            </span>
          </div>

          <div className={styles.predictionBar}>
            <span
              className={styles.homePredictionBar}
              style={{ width: `${homeRate}%` }}
            />

            <span
              className={styles.awayPredictionBar}
              style={{ width: `${awayRate}%` }}
            />
          </div>
        </div>
      )}

      {variant === "prediction" && (
        <div className={styles.predictionResultSummary}>
          <span>{leaderText}</span>
          <strong>{(match.participants ?? 0).toLocaleString()}명 참여</strong>
        </div>
      )}

      <div className={styles.matchMeta}>
        <span className={styles.matchLeague}>{match.league}</span>

        {variant === "result" ? (
          <span className={styles.teamResultBadge} data-result={result}>
            {TEAM_RESULT_LABELS[result]}
          </span>
        ) : (
          MATCH_STATUS_LABELS[match.status] && (
            <span
              className={`${styles.matchStatus} ${
                match.status === "live" ? styles.matchStatusLive : ""
              }`}
            >
              {MATCH_STATUS_LABELS[match.status]}
            </span>
          )
        )}
      </div>

      {showAction && (
        <div className={styles.matchAction}>
          <Button
            disabled={isAuthLoading || match.isPredicted}
            fullWidth
            onClick={() => onVoteClick(match.databaseId ?? match.id)}
            size="sm"
            variant="outline"
          >
            {match.isPredicted ? "투표완료" : "투표하기"}
          </Button>
        </div>
      )}
    </article>
  );
};

const MemberPhoto = ({ member }) => {
  const [activePhoto, setActivePhoto] = useState(member.photo);

  const handlePhotoError = () => {
    if (activePhoto !== member.fallbackPhoto) {
      setActivePhoto(member.fallbackPhoto);
    }
  };

  return (
    <img
      className={styles.memberPhoto}
      src={activePhoto}
      alt={`${member.name} 프로필 이미지`}
      loading="lazy"
      onError={handlePhotoError}
    />
  );
};

const TeamDetailPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, isAuthLoading } = useAuth();

  const team = TEAM_BY_ID.get(teamId);
  const userId = user?.id || "";

  const [favoriteTeamState, setFavoriteTeamState] = useState({
    userId: "",
    teamIds: [],
  });
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [loginDialogState, setLoginDialogState] = useState({
    isOpen: false,
    type: "favorite",
    matchId: "",
  });
  const [matches, setMatches] = useState([]);
  const [resultMatches, setResultMatches] = useState([]);
  const [predictionResultMatches, setPredictionResultMatches] = useState([]);
  const [officialStandings, setOfficialStandings] = useState([]);
  const [standings, setStandings] = useState([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState("");
  const [rosterPageState, setRosterPageState] = useState({
    teamId: "",
    page: 0,
  });
  const [activeSectionId, setActiveSectionId] = useState(
    TEAM_DETAIL_NAV_ITEMS[0].id,
  );

  const favoriteTeamIds =
    userId && favoriteTeamState.userId === userId
      ? favoriteTeamState.teamIds
      : [];

  const isFavorite = team ? favoriteTeamIds.includes(team.id) : false;
  const averageRating = team ? getAverageRating(team.ratings) : 0;
  const totalRosterPages = team
    ? Math.ceil(team.members.length / ROSTER_PAGE_SIZE)
    : 0;
  const rosterPage =
    rosterPageState.teamId === teamId ? rosterPageState.page : 0;
  const currentRosterPage = Math.min(
    rosterPage,
    Math.max(totalRosterPages - 1, 0),
  );
  const visibleMembers = team
    ? team.members.slice(
        currentRosterPage * ROSTER_PAGE_SIZE,
        (currentRosterPage + 1) * ROSTER_PAGE_SIZE,
      )
    : [];
  const hasUsableOfficialStandings = officialStandings.some(
    (standingRow) =>
      standingRow.games > 0 ||
      standingRow.wins > 0 ||
      standingRow.draws > 0 ||
      standingRow.losses > 0,
  );
  const visibleStandings =
    hasUsableOfficialStandings ? officialStandings : standings;
  const isOfficialStanding = hasUsableOfficialStandings;
  const standingColumns = getStandingColumns(team?.league);
  const teamStanding = visibleStandings.find((standingRow) =>
    isStandingTeamActive(standingRow, team),
  );
  const hasStandingData = visibleStandings.some(
    (standingRow) => standingRow.games > 0,
  );

  useEffect(() => {
    if (!team || !userId) {
      return undefined;
    }

    let isMounted = true;

    const loadFavoriteTeamIds = async () => {
      const teamIds = await fetchFavoriteTeamIds(userId);

      if (isMounted) {
        setFavoriteTeamState({
          userId,
          teamIds,
        });
      }
    };

    const syncFavoriteTeams = (event) => {
      if (event.detail?.userId && event.detail.userId !== userId) {
        return;
      }

      setFavoriteTeamState({
        userId,
        teamIds: Array.isArray(event.detail?.teamIds)
          ? event.detail.teamIds
          : getFavoriteTeamIds(userId),
      });
    };

    loadFavoriteTeamIds();
    window.addEventListener(FAVORITE_TEAMS_CHANGED_EVENT, syncFavoriteTeams);
    window.addEventListener("storage", syncFavoriteTeams);

    return () => {
      isMounted = false;
      window.removeEventListener(
        FAVORITE_TEAMS_CHANGED_EVENT,
        syncFavoriteTeams,
      );
      window.removeEventListener("storage", syncFavoriteTeams);
    };
  }, [team, userId]);

  useEffect(() => {
    if (!team) {
      return undefined;
    }

    let isMounted = true;

    const loadOfficialStandings = async () => {
      try {
        const nextStandings = await fetchTeamStandings(team.league);

        if (isMounted) {
          setOfficialStandings(normalizeOfficialStandings(nextStandings));
        }
      } catch (error) {
        console.warn(
          "공식 순위 조회 실패. 경기 결과 기반 순위를 사용합니다.",
          error,
        );

        if (isMounted) {
          setOfficialStandings([]);
        }
      }
    };

    loadOfficialStandings();

    return () => {
      isMounted = false;
    };
  }, [team]);

  useEffect(() => {
    if (!team) {
      return undefined;
    }

    let isMounted = true;

    const loadTeamMatches = async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setIsMatchesLoading(true);
          setMatchesError("");
        }

        const { data, error } = await supabase
          .from("matches")
          .select(
            `
              id,
              external_id,
              sport,
              league,
              match_date,
              match_time,
              away_team_code,
              home_team_code,
              score,
              status,
              venue
            `,
          )
          .eq("sport", team.matchSport)
          .order("match_date", { ascending: true })
          .order("match_time", { ascending: true })
          .limit(240);

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const normalizedMatches = (data || [])
          .filter(
            (match) =>
              match.match_date &&
              match.home_team_code &&
              match.away_team_code &&
              !["cancelled", "postponed"].includes(match.status),
          )
          .map(normalizeMatch);
        const nextTeamMatches = normalizedMatches.filter((match) =>
          isTeamMatch(match, team),
        );
        const activeTeamMatches = nextTeamMatches.filter(
          (match) => !["cancelled", "postponed"].includes(match.status),
        );
        const leagueStandingTeams = FEATURED_TEAMS.filter(
          (featuredTeam) => featuredTeam.league === team.league,
        );

        const [predictionStats, myPredictions] = await Promise.all([
          fetchMatchPredictionStats(),
          userId
            ? fetchMyPredictionSelections(
                userId,
                activeTeamMatches.map((match) => match.databaseId),
              ).catch((error) => {
                console.error("팀 경기 예측 여부 조회 실패", error);
                return [];
              })
            : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        const enrichedTeamMatches = markPredictedMatches(
          applyPredictionStatsToMatches(activeTeamMatches, predictionStats),
          myPredictions,
        );
        const todayKey = formatDateKey(new Date());
        const upcomingMatches = enrichedTeamMatches
          .filter(
            (match) =>
              match.status !== "finished" && match.dateKey >= todayKey,
          )
          .sort(compareMatchesAscending)
          .slice(0, UPCOMING_MATCH_LIMIT);
        const finishedMatches = enrichedTeamMatches
          .filter(hasFinishedScore)
          .sort(compareMatchesDescending)
          .slice(0, FINISHED_MATCH_LIMIT);
        const nextPredictionResultMatches = enrichedTeamMatches
          .filter((match) => hasFinishedScore(match) && match.participants > 0)
          .sort(compareMatchesDescending)
          .slice(0, PREDICTION_RESULT_LIMIT);

        setMatches(upcomingMatches);
        setResultMatches(finishedMatches);
        setPredictionResultMatches(nextPredictionResultMatches);
        setStandings(
          createLeagueStandings(
            normalizedMatches,
            leagueStandingTeams,
            team.league,
          ),
        );
      } catch (error) {
        console.error("팀 경기 일정 불러오기 실패", error);

        if (isMounted && showLoading) {
          setMatchesError("경기 일정을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted && showLoading) {
          setIsMatchesLoading(false);
        }
      }
    };

    loadTeamMatches();

    const unsubscribe = subscribeToMatchChanges({
      channelName: `team-detail-matches-${team.id}`,
      onChange: () => loadTeamMatches({ showLoading: false }),
      shouldHandlePayload: ({ new: nextMatch }) => {
        if (!nextMatch?.sport) {
          return true;
        }

        return (
          nextMatch.sport === team.matchSport && isTeamMatch(nextMatch, team)
        );
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [team, userId]);

  const sortedRatings = team
    ? [...team.ratings].sort((first, second) => second.score - first.score)
    : [];

  if (!team) {
    return <Navigate to="/teams" replace />;
  }

  const handleFavoriteClick = async () => {
    if (isAuthLoading) {
      return;
    }

    if (!isLoggedIn || !userId) {
      setLoginDialogState({
        isOpen: true,
        type: "favorite",
        matchId: "",
      });
      return;
    }

    const nextTeamIds = isFavorite
      ? favoriteTeamIds.filter((favoriteTeamId) => favoriteTeamId !== team.id)
      : [...favoriteTeamIds, team.id];

    setIsSavingFavorite(true);
    setFavoriteTeamState({
      userId,
      teamIds: nextTeamIds,
    });

    try {
      const savedTeamIds = await toggleFavoriteTeamId(
        userId,
        team.id,
        favoriteTeamIds,
      );

      setFavoriteTeamState({
        userId,
        teamIds: savedTeamIds,
      });
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const handleMatchVoteClick = (matchId) => {
    if (isAuthLoading) {
      return;
    }

    if (!isLoggedIn) {
      setLoginDialogState({
        isOpen: true,
        type: "prediction",
        matchId,
      });
      return;
    }

    navigate(createPredictionPath({ matchId }));
  };

  const handleMoveRosterPage = (direction) => {
    setRosterPageState((currentState) => {
      const currentPage =
        currentState.teamId === teamId ? currentState.page : 0;
      const nextPage = Math.min(
        Math.max(currentPage + direction, 0),
        Math.max(totalRosterPages - 1, 0),
      );

      return {
        teamId,
        page: nextPage,
      };
    });
  };

  const handleSubNavItemClick = (itemId) => {
    setActiveSectionId(itemId);

    window.requestAnimationFrame(() => {
      document.getElementById("team-detail-content")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleMoveToLogin = () => {
    const from =
      loginDialogState.type === "prediction"
        ? createPredictionLocation({ matchId: loginDialogState.matchId })
        : {
            pathname: `/teams/${team.id}`,
            search: "",
            hash: "",
          };

    setLoginDialogState((currentState) => ({
      ...currentState,
      isOpen: false,
    }));

    navigate("/login", {
      state: { from },
    });
  };

  return (
    <main className={styles.detailPage}>
      <SubNav
        activeItemId={activeSectionId}
        ariaLabel={`${team.name} 상세 메뉴`}
        items={TEAM_DETAIL_NAV_ITEMS}
        onItemClick={handleSubNavItemClick}
      />

      <div id="team-detail-content" className={`container ${styles.inner}`}>
        <Link className={styles.backLink} to="/teams">
          TEAMS
        </Link>

        {activeSectionId === "team-schedule" && (
          <>
        <section id="team-overview" className={styles.heroSection}>
          <div className={styles.logoPanel}>
            <TeamLogo className={styles.heroLogo} team={team} />
          </div>

          <div className={styles.heroContent}>
            <span className={styles.leagueLabel}>
              {TEAM_LEAGUE_LABELS[team.league]} · {team.home}
            </span>

            <h1 className={styles.title}>{team.name}</h1>

            <p className={styles.tone}>{team.tone}</p>

            <p className={styles.intro}>{team.intro}</p>

            <div className={styles.tagList}>
              {team.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <div className={styles.heroActions}>
              <Button
                className={styles.heroActionButton}
                disabled={isSavingFavorite}
                onClick={handleFavoriteClick}
                variant={isFavorite ? "secondary" : "primary"}
              >
                {isSavingFavorite
                  ? "저장 중..."
                  : isFavorite
                    ? "관심 팀 해제"
                    : "관심 팀 등록"}
              </Button>

              <Button
                className={styles.heroActionButton}
                href="#team-schedule"
                variant="outline"
              >
                경기 일정 보기
              </Button>
            </div>
          </div>

          <aside className={styles.ratingSummary}>
            <span>입덕 평점</span>
            <strong>{averageRating.toFixed(1)}</strong>
            <small>/ 5</small>
          </aside>
        </section>

        <section className={styles.contentGrid}>
          <article className={styles.entryPanel}>
            <span className={styles.sectionLabel}>입덕 포인트</span>
            <p>{team.entryPoint}</p>
          </article>

          <article className={styles.guidePanel}>
            <span className={styles.sectionLabel}>팬 가이드</span>

            <ul>
              {team.fanGuide.map((guide) => (
                <li key={guide}>{guide}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.ratingsSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>평점</span>
            <h2>입덕 체크리스트</h2>
          </div>

          <div className={styles.ratingList}>
            {sortedRatings.map((rating) => (
              <div key={rating.label} className={styles.ratingRow}>
                <div className={styles.ratingMeta}>
                  <span>{rating.label}</span>
                  <strong>
                    {rating.score}
                    <small>/5</small>
                  </strong>
                </div>

                <div className={styles.ratingTrack} aria-hidden="true">
                  <span style={{ width: `${rating.score * 20}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.membersSection}>
          <div className={`${styles.sectionHeader} ${styles.memberHeader}`}>
            <span className={styles.sectionLabel}>멤버</span>

            <div className={styles.memberHeaderActions}>
              <h2>대표 로스터</h2>

              <PaginationControls
                ariaLabel="대표 로스터 페이지 이동"
                className={styles.memberNavigation}
                currentPage={currentRosterPage}
                nextLabel="다음 대표 로스터 보기"
                onNext={() => handleMoveRosterPage(1)}
                onPrevious={() => handleMoveRosterPage(-1)}
                previousLabel="이전 대표 로스터 보기"
                totalPages={totalRosterPages}
              />
            </div>
          </div>

          <div className={styles.memberGrid}>
            {visibleMembers.map((member) => (
              <article key={member.id} className={styles.memberCard}>
                <MemberPhoto member={member} />

                <div className={styles.memberInfo}>
                  <span>{member.role}</span>
                  <strong>{member.name}</strong>
                  {member.realName && <small>{member.realName}</small>}
                  <p>{member.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="team-schedule"
          className={styles.scheduleSection}
          aria-labelledby="team-schedule-title"
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>경기 일정</span>
            <h2 id="team-schedule-title">다가오는 경기</h2>
          </div>

          {isMatchesLoading ? (
            <div className={styles.matchGrid} aria-label="팀 경기 일정 로딩 중">
              {Array.from({ length: UPCOMING_MATCH_LIMIT }, (_, index) => (
                <TeamMatchCardSkeleton key={index} />
              ))}
            </div>
          ) : matchesError ? (
            <EmptyState
              title={matchesError}
              description="잠시 후 다시 시도해 주세요."
            />
          ) : matches.length > 0 ? (
            <div className={styles.matchGrid}>
              {matches.map((match) => (
                <TeamDetailMatchCard
                  key={match.id}
                  isAuthLoading={isAuthLoading}
                  match={match}
                  onVoteClick={handleMatchVoteClick}
                  team={team}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="등록된 다가오는 경기 일정이 없습니다."
              description="새 일정이 업데이트되면 이곳에 표시됩니다."
            />
          )}
        </section>
          </>
        )}

        {activeSectionId === "team-results" && (
          <section
            id="team-results"
            className={styles.resultsSection}
            aria-labelledby="team-results-title"
          >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>경기 결과</span>
            <h2 id="team-results-title">최근 경기 결과</h2>
          </div>

          {isMatchesLoading ? (
            <div className={styles.matchGrid} aria-label="팀 경기 결과 로딩 중">
              {Array.from({ length: FINISHED_MATCH_LIMIT }, (_, index) => (
                <TeamMatchCardSkeleton key={index} />
              ))}
            </div>
          ) : matchesError ? (
            <EmptyState
              title={matchesError}
              description="잠시 후 다시 시도해 주세요."
            />
          ) : resultMatches.length > 0 ? (
            <div className={styles.matchGrid}>
              {resultMatches.map((match) => (
                <TeamDetailMatchCard
                  key={match.id}
                  match={match}
                  team={team}
                  variant="result"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="등록된 경기 결과가 없습니다."
              description="종료된 경기가 업데이트되면 이곳에 표시됩니다."
            />
          )}
          </section>
        )}

        {activeSectionId === "team-standings" && (
          <section
            id="team-standings"
            className={styles.standingsSection}
            aria-labelledby="team-standings-title"
          >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>순위</span>
            <h2 id="team-standings-title">리그 순위</h2>
          </div>

          {isMatchesLoading ? (
            <div className={styles.standingSkeleton}>
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton.Line key={index} className={styles.skeletonStandingRow} />
              ))}
            </div>
          ) : matchesError ? (
            <EmptyState
              title={matchesError}
              description="잠시 후 다시 시도해 주세요."
            />
          ) : hasStandingData ? (
            <>
              {teamStanding && (
                <div className={styles.standingSummary}>
                  <span>현재 순위</span>
                  <strong>{teamStanding.rank}위</strong>
                  <small>{getStandingSummaryText(teamStanding, team.league)}</small>
                  {isOfficialStanding && (
                    <em>{getStandingSourceLabel(teamStanding.source)} 기준</em>
                  )}
                </div>
              )}

              <div className={styles.standingTableWrapper}>
                <table className={styles.standingTable}>
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>팀</th>
                      {standingColumns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {visibleStandings.map((standingRow) => (
                      <tr
                        key={standingRow.id ?? standingRow.team.id}
                        data-active={isStandingTeamActive(standingRow, team)}
                      >
                        <td>{standingRow.rank}</td>
                        <td>
                          <div className={styles.standingTeam}>
                            <TeamLogo
                              className={styles.standingLogo}
                              team={standingRow.team}
                            />
                            <span>{standingRow.team.name}</span>
                          </div>
                        </td>
                        {standingColumns.map((column) => (
                          <td key={column.key}>{column.render(standingRow)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyState
              title="순위를 계산할 종료 경기가 없습니다."
              description="같은 리그의 종료 경기 스코어가 쌓이면 순위가 표시됩니다."
            />
          )}
          </section>
        )}

        {activeSectionId === "team-prediction-results" && (
          <section
            id="team-prediction-results"
            className={styles.predictionResultsSection}
            aria-labelledby="team-prediction-results-title"
          >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>승부 예측 결과</span>
            <h2 id="team-prediction-results-title">팬픽 예측 결과</h2>
          </div>

          {isMatchesLoading ? (
            <div
              className={styles.matchGrid}
              aria-label="팀 승부 예측 결과 로딩 중"
            >
              {Array.from({ length: PREDICTION_RESULT_LIMIT }, (_, index) => (
                <TeamMatchCardSkeleton key={index} />
              ))}
            </div>
          ) : matchesError ? (
            <EmptyState
              title={matchesError}
              description="잠시 후 다시 시도해 주세요."
            />
          ) : predictionResultMatches.length > 0 ? (
            <div className={styles.matchGrid}>
              {predictionResultMatches.map((match) => (
                <TeamDetailMatchCard
                  key={match.id}
                  match={match}
                  team={team}
                  variant="prediction"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="승부 예측 결과가 없습니다."
              description="참여자가 있는 종료 경기의 예측 결과가 이곳에 표시됩니다."
            />
          )}
          </section>
        )}

      </div>

      <FanPickDialog
        isOpen={loginDialogState.isOpen}
        title="로그인이 필요합니다"
        description={
          loginDialogState.type === "prediction"
            ? "경기 승부 예측에 참여하려면 먼저 로그인해 주세요."
            : "관심 팀을 마이페이지에 저장하려면 먼저 로그인해 주세요."
        }
        confirmText="로그인하기"
        cancelText="취소"
        onClose={() =>
          setLoginDialogState((currentState) => ({
            ...currentState,
            isOpen: false,
          }))
        }
        onConfirm={handleMoveToLogin}
      />
    </main>
  );
};

export default TeamDetailPage;
