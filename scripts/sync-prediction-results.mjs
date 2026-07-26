import { createSupabaseAdminClient } from "./team-standings-utils.mjs";

const STORED_RESULTS = new Set(["correct", "incorrect"]);
const FINISHED_MATCH_STATUSES = new Set([
  "complete",
  "completed",
  "ended",
  "final",
  "finished",
]);
const LIVE_MATCH_STATUSES = new Set([
  "live",
  "ongoing",
  "in_progress",
  "playing",
  "running",
]);
const LIVE_WINDOW_HOURS_BY_SPORT = {
  baseball: 6,
  esports: 4,
  soccer: 3,
};
const FINISHED_PROTECTION_MINUTES_BY_SPORT = {
  baseball: 180,
  esports: 90,
  soccer: 110,
};
const DEFAULT_LIVE_WINDOW_HOURS = 4;
const DEFAULT_FINISHED_PROTECTION_MINUTES = 120;
const DEFAULT_MATCH_TIME = "23:59";

const normalizeTeamCode = (teamCode) => String(teamCode ?? "").trim().toUpperCase();
const normalizeSport = (sport) => String(sport ?? "").trim().toLowerCase();
const normalizeStatus = (status) => String(status ?? "").trim().toLowerCase();
const isLiveMatchStatus = (status) =>
  LIVE_MATCH_STATUSES.has(normalizeStatus(status));
const isFinishedMatchStatus = (status) =>
  FINISHED_MATCH_STATUSES.has(normalizeStatus(status));

const getLiveWindowMs = (sport) => {
  const normalizedSport = normalizeSport(sport);
  const hours =
    LIVE_WINDOW_HOURS_BY_SPORT[normalizedSport] ?? DEFAULT_LIVE_WINDOW_HOURS;

  return hours * 60 * 60 * 1000;
};

const getFinishedProtectionMs = (sport) => {
  const normalizedSport = normalizeSport(sport);
  const minutes =
    FINISHED_PROTECTION_MINUTES_BY_SPORT[normalizedSport] ??
    DEFAULT_FINISHED_PROTECTION_MINUTES;

  return minutes * 60 * 1000;
};

const createMatchDateTime = (dateKey, timeValue) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey ?? ""))) {
    return null;
  }

  const matchTime = String(timeValue ?? DEFAULT_MATCH_TIME).slice(0, 5);
  const timestamp = Date.parse(`${dateKey}T${matchTime}:00+09:00`);

  return Number.isFinite(timestamp) ? timestamp : null;
};

const parseScore = (score) => {
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

const isLikelyUnsettledFinishedScore = (match) => {
  const { awayScore, homeScore } = parseScore(match?.score);

  if (awayScore === null || homeScore === null) {
    return true;
  }

  return (
    normalizeSport(match?.sport) === "baseball" &&
    awayScore === 0 &&
    homeScore === 0
  );
};

const hasResolvedScore = (match) => {
  const { awayScore, homeScore } = parseScore(match?.score);

  if (awayScore === null || homeScore === null) {
    return false;
  }

  if (isLiveMatchStatus(match?.status)) {
    return false;
  }

  if (!isFinishedMatchStatus(match?.status)) {
    return false;
  }

  const matchDateTime = createMatchDateTime(match?.match_date, match?.match_time);

  if (
    matchDateTime !== null &&
    Date.now() < matchDateTime + getLiveWindowMs(match?.sport) &&
    isLikelyUnsettledFinishedScore(match)
  ) {
    return false;
  }

  return (
    matchDateTime === null ||
    Date.now() >= matchDateTime + getFinishedProtectionMs(match?.sport)
  );
};

const resolvePredictionResult = (prediction) => {
  const match = prediction.matches;

  if (!match) {
    return "";
  }

  if (["cancelled", "postponed"].includes(match.status)) {
    return "cancelled";
  }

  if (!hasResolvedScore(match)) {
    return "";
  }

  const { awayScore, homeScore } = parseScore(match.score);

  if (awayScore === homeScore) {
    return "void";
  }

  const selectedTeamCode = normalizeTeamCode(prediction.selected_team_code);
  const winnerTeamCode =
    homeScore > awayScore
      ? normalizeTeamCode(match.home_team_code)
      : normalizeTeamCode(match.away_team_code);

  if (!selectedTeamCode || !winnerTeamCode) {
    return "";
  }

  return selectedTeamCode === winnerTeamCode ? "correct" : "incorrect";
};

const fetchPendingPredictions = async (supabase) => {
  const { data, error } = await supabase
    .from("predictions")
    .select(
      `
        id,
        selected_team_code,
        result,
        matches (
          id,
          sport,
          match_date,
          match_time,
          away_team_code,
          home_team_code,
          score,
          status
        )
      `,
    )
    .or("result.is.null,result.neq.cancelled");

  if (error) {
    throw new Error(`예측 목록 조회 실패: ${error.message}`);
  }

  return data ?? [];
};

const updatePredictionResult = async (supabase, predictionId, result) => {
  const { error } = await supabase
    .from("predictions")
    .update({ result })
    .eq("id", predictionId);

  if (error) {
    throw new Error(`예측 결과 저장 실패: ${error.message}`);
  }
};

const main = async () => {
  console.log("승부예측 결과 정산 시작");

  const supabase = createSupabaseAdminClient();
  const pendingPredictions = await fetchPendingPredictions(supabase);
  const resolvedPredictionResults = pendingPredictions.map((prediction) => ({
    id: prediction.id,
    currentResult: prediction.result,
    result: resolvePredictionResult(prediction),
  }));
  const resolvedPredictions = resolvedPredictionResults.filter(
    (prediction) =>
      prediction.id &&
      STORED_RESULTS.has(prediction.result) &&
      prediction.currentResult !== prediction.result,
  );
  const skippedCounts = resolvedPredictionResults.reduce(
    (counts, prediction) => {
      const key = prediction.result || "pending";

      counts[key] = (counts[key] ?? 0) + 1;

      return counts;
    },
    {},
  );

  for (const prediction of resolvedPredictions) {
    await updatePredictionResult(supabase, prediction.id, prediction.result);
  }

  console.log(
    `승부예측 결과 정산 완료: ${resolvedPredictions.length}/${pendingPredictions.length}건 반영`,
  );
  console.log(
    [
      `저장 제외: 결과대기 ${skippedCounts.pending ?? 0}건`,
      `취소/연기 ${skippedCounts.cancelled ?? 0}건`,
      `무승부 ${skippedCounts.void ?? 0}건`,
    ].join(" · "),
  );
};

main().catch((error) => {
  console.error("승부예측 결과 정산 실패");
  console.error(error.message);
  process.exitCode = 1;
});
