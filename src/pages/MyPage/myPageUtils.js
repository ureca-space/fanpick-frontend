import { getTeamInfo } from "../../constants/teamInfo.js";
import {
  createSettledPredictionSummary,
  hasResolvedPredictionScore,
  resolvePredictionResult,
} from "../../services/predictionApi.js";
import {
  canChangePredictionByBeginAt,
  createMatchBeginAt,
} from "../../utils/predictionDeadline.js";
import { RESULT_LABELS } from "../Prediction/predictionUtils.js";

export const INITIAL_USER_INFO = {
  id: "",
  nickname: "",
  email: "",
  joinedAt: "",
  avatarUrl: "",
};

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
export const FAVORITE_TEAMS_PAGE_SIZE = 6;
export const PICK_HISTORY_PAGE_SIZE = 4;
export const PREDICTION_REFRESH_DEBOUNCE_MS = 500;
export const PREDICTION_REFRESH_INTERVAL_MS = 60_000;
export const PREDICTION_SPORTS = ["soccer", "baseball", "esports"];
export const PREDICTION_BADGE_CONTEXTS = ["overall", ...PREDICTION_SPORTS];

const SPORT_LABELS = {
  baseball: "BASEBALL",
  esports: "LOL",
  soccer: "SOCCER",
};

const EMPTY_PREDICTION_SUMMARY = {
  total: 0,
  correct: 0,
  incorrect: 0,
  accuracy: 0,
};

export const formatJoinedDate = (date) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
};

const normalizeTeamCode = (teamCode) => teamCode?.trim().toUpperCase() || "";

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

const formatMatchDate = (dateKey) => {
  if (!dateKey) {
    return "날짜 미정";
  }

  const [, month, day] = dateKey.split("-");

  return `${month}.${day}`;
};

const createFallbackSportSummaries = (predictions) =>
  Object.fromEntries(
    PREDICTION_SPORTS.map((sport) => {
      const sportPredictions = predictions.filter(
        (prediction) => prediction.matches?.sport === sport,
      );

      return [sport, createSettledPredictionSummary(sportPredictions)];
    }),
  );

export const createSportStatistics = (predictions) => {
  const fallbackSummaries = createFallbackSportSummaries(predictions);

  return PREDICTION_SPORTS.map((sport) => {
    const fallbackStats = fallbackSummaries[sport] ?? EMPTY_PREDICTION_SUMMARY;

    return {
      sport,
      total: fallbackStats.total,
      correct: fallbackStats.correct,
      accuracy: fallbackStats.accuracy,
    };
  });
};

const getPredictionRates = (predictionStats, matchId) => {
  const matchStats = predictionStats.find(
    (stat) => String(stat.match_id) === String(matchId),
  );

  return {
    awayRate: Number(matchStats?.away_rate ?? 50),
    homeRate: Number(matchStats?.home_rate ?? 50),
    participants: Number(matchStats?.participant_count ?? 0),
  };
};

export const normalizePredictionHistory = (
  predictions,
  predictionStats,
  currentTime,
) =>
  predictions
    .map((prediction) => {
      const match = prediction.matches;

      if (!match) {
        return null;
      }

      const sport = match.sport;
      const homeTeamCode = normalizeTeamCode(match.home_team_code);
      const awayTeamCode = normalizeTeamCode(match.away_team_code);
      const selectedTeamCode = normalizeTeamCode(prediction.selected_team_code);
      const selectedSide =
        selectedTeamCode === homeTeamCode
          ? "home"
          : selectedTeamCode === awayTeamCode
            ? "away"
            : "";
      const homeTeam = getTeamInfo(homeTeamCode, sport);
      const awayTeam = getTeamInfo(awayTeamCode, sport);
      const selectedTeam =
        selectedSide === "home"
          ? homeTeam
          : selectedSide === "away"
            ? awayTeam
            : getTeamInfo(selectedTeamCode, sport);
      const { awayScore, homeScore } = parseScore(match.score);
      const resolvedResult = resolvePredictionResult(prediction);
      const hasScore =
        (["live", "finished"].includes(match.status) ||
          hasResolvedPredictionScore(match)) &&
        homeScore !== null &&
        awayScore !== null;
      const matchTime = match.match_time?.slice(0, 5) ?? "미정";
      const beginAt = createMatchBeginAt(match.match_date, matchTime);
      const rates = getPredictionRates(predictionStats, prediction.match_id);

      return {
        id: `${prediction.match_id}-${selectedTeamCode}`,
        matchId: prediction.match_id,
        dateLabel: formatMatchDate(match.match_date),
        time: matchTime,
        sportLabel: SPORT_LABELS[sport] ?? sport?.toUpperCase() ?? "",
        league: match.league ?? "",
        result: resolvedResult,
        resultLabel: RESULT_LABELS[resolvedResult] ?? "예측진행중",
        selectedSide,
        selectedTeam,
        homeTeam,
        awayTeam,
        beginAt,
        canChange:
          match.status === "scheduled" &&
          canChangePredictionByBeginAt(beginAt, currentTime),
        ...rates,
        scoreText: hasScore ? `${homeScore} : ${awayScore}` : "VS",
        status: match.status,
      };
    })
    .filter(Boolean);
