import { supabase } from "../lib/supabase";
import {
  isLiveMatchStatus,
  isResultPendingMatchStatus,
  normalizeMatchTimingStatus,
} from "../utils/matchStatus";

const getMatchStatsId = (match) => String(match.databaseId ?? match.id);
const normalizeMatchIds = (matchIds) =>
  [...new Set(matchIds.filter(Boolean).map(String))];
const SETTLED_PREDICTION_RESULTS = new Set(["correct", "incorrect"]);

const normalizeTeamCode = (teamCode) => teamCode?.trim().toUpperCase() ?? "";

const parsePredictionScore = (score) => {
  if (!score) {
    return {
      awayScore: null,
      homeScore: null,
    };
  }

  const [awayScore, homeScore] = String(score).split(":").map(Number);

  return {
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
  };
};

const normalizePredictionMatchTiming = (prediction) => {
  const match = prediction.matches;

  if (!match) {
    return prediction;
  }

  const matchTime = match.match_time?.slice(0, 5) ?? "00:00";
  const timingStatus = normalizeMatchTimingStatus({
    matchDate: match.match_date,
    matchTime,
    score: match.score,
    sport: match.sport,
    status: match.status,
  });

  return {
    ...prediction,
    matches: {
      ...match,
      score: timingStatus.score,
      status: timingStatus.status,
    },
  };
};

export const hasResolvedPredictionScore = (match) => {
  const { awayScore, homeScore } = parsePredictionScore(match?.score);

  if (awayScore === null || homeScore === null) {
    return false;
  }

  if (isLiveMatchStatus(match?.status)) {
    return false;
  }

  return match?.status === "finished";
};

export const resolvePredictionResult = (prediction) => {
  const storedResult = prediction?.result ?? "pending";
  const match = prediction?.matches;

  if (["cancelled", "postponed"].includes(match?.status)) {
    return "cancelled";
  }

  if (isLiveMatchStatus(match?.status)) {
    return "live";
  }

  if (isResultPendingMatchStatus(match?.status)) {
    return "resultPending";
  }

  if (!hasResolvedPredictionScore(match)) {
    return !match && SETTLED_PREDICTION_RESULTS.has(storedResult)
      ? storedResult
      : "pending";
  }

  const { awayScore, homeScore } = parsePredictionScore(match?.score);

  if (homeScore === awayScore) {
    return "void";
  }

  const selectedTeamCode = normalizeTeamCode(prediction?.selected_team_code);
  const winnerTeamCode =
    homeScore > awayScore
      ? normalizeTeamCode(match?.home_team_code)
      : normalizeTeamCode(match?.away_team_code);

  return selectedTeamCode && selectedTeamCode === winnerTeamCode
    ? "correct"
    : "incorrect";
};

export const isSettledPrediction = (prediction) =>
  SETTLED_PREDICTION_RESULTS.has(resolvePredictionResult(prediction));

export const createSettledPredictionSummary = (predictions) => {
  const settledPredictionResults = predictions
    .map(resolvePredictionResult)
    .filter((result) => SETTLED_PREDICTION_RESULTS.has(result));
  const correct = settledPredictionResults.filter(
    (result) => result === "correct",
  ).length;
  const incorrect = settledPredictionResults.filter(
    (result) => result === "incorrect",
  ).length;
  const total = correct + incorrect;

  return {
    total,
    correct,
    incorrect,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
  };
};

export const createSettledPredictionSportStats = (predictions, sports) =>
  sports.map((sport) => {
    const summary = createSettledPredictionSummary(
      predictions.filter((prediction) => prediction.matches?.sport === sport),
    );

    return {
      sport,
      total_count: summary.total,
      correct_count: summary.correct,
      incorrect_count: summary.incorrect,
      accuracy_rate: summary.accuracy,
    };
  });

const createMyPredictionsQuery = (userId, { includeCreatedAt = true } = {}) => {
  const createdAtSelect = includeCreatedAt ? "created_at," : "";
  let query = supabase
    .from("predictions")
    .select(
      `
        match_id,
        selected_team_code,
        result,
        ${createdAtSelect}
        matches (
          id,
          external_id,
          sport,
          league,
          match_date,
          match_time,
          away_team_code,
          home_team_code,
          score,
          status
        )
      `,
    )
    .eq("user_id", userId);

  if (includeCreatedAt) {
    query = query.order("created_at", { ascending: false });
  }

  return query;
};

// - 로그인한 사용자의 예측 기록 조회
export const fetchMyPredictions = async (userId) => {
  if (!userId) {
    return [];
  }

  const { data, error } = await createMyPredictionsQuery(userId);

  if (!error) {
    return (data ?? []).map(normalizePredictionMatchTiming);
  }

  const shouldRetryWithoutCreatedAt =
    error.code === "42703" || error.message?.includes("created_at");

  if (!shouldRetryWithoutCreatedAt) {
    throw error;
  }

  const { data: fallbackData, error: fallbackError } =
    await createMyPredictionsQuery(userId, {
      includeCreatedAt: false,
    });

  if (fallbackError) throw fallbackError;

  return (fallbackData ?? []).map(normalizePredictionMatchTiming);
};

export const fetchMyPredictionSelections = async (userId, matchIds = []) => {
  if (!userId) {
    return [];
  }

  const normalizedMatchIds = normalizeMatchIds(matchIds);
  let query = supabase
    .from("predictions")
    .select("match_id, selected_team_code, result")
    .eq("user_id", userId);

  if (normalizedMatchIds.length > 0) {
    query = query.in("match_id", normalizedMatchIds);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
};

export const markPredictedMatches = (matches, predictions) => {
  const predictionsByMatchId = new Map(
    predictions.map((prediction) => [
      String(prediction.match_id),
      {
        result: prediction.result,
        selectedTeamCode:
          prediction.selected_team_code?.trim().toUpperCase() ?? "",
      },
    ]),
  );

  return matches.map((match) => {
    const myPrediction = predictionsByMatchId.get(getMatchStatsId(match));

    return {
      ...match,
      isPredicted: Boolean(myPrediction),
      myPrediction: myPrediction ?? null,
    };
  });
};

// - 경기 목록에 서버가 계산한 참여자 수와 홈/원정 투표 비율 합치기
export const applyPredictionStatsToMatches = (
  matches,
  stats,
  { awayRateKey = "awayVotes", homeRateKey = "homeVotes" } = {},
) => {
  const statsByMatchId = Object.fromEntries(
    stats.map((item) => [String(item.match_id), item]),
  );

  return matches.map((match) => {
    const matchStats = statsByMatchId[getMatchStatsId(match)];

    return {
      ...match,
      participants: Number(matchStats?.participant_count ?? 0),
      [homeRateKey]: Number(matchStats?.home_rate ?? 50),
      [awayRateKey]: Number(matchStats?.away_rate ?? 50),
    };
  });
};

// - 경기별 참여자 수와 홈/원정 투표 비율 조회
export const fetchMatchPredictionStats = async () => {
  const { data, error } = await supabase.rpc("get_match_prediction_stats");

  if (error) throw error;

  return data ?? [];
};
