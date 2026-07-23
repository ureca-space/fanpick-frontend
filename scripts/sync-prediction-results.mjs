import { createSupabaseAdminClient } from "./team-standings-utils.mjs";

const SCORE_SETTLE_DELAY_MS = 8 * 60 * 60 * 1000;
const STORED_RESULTS = new Set(["correct", "incorrect"]);

const normalizeTeamCode = (teamCode) => String(teamCode ?? "").trim().toUpperCase();

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

const createMatchTimeValue = (match) => {
  if (!match?.match_date) {
    return null;
  }

  const [year, month, day] = String(match.match_date).split("-").map(Number);
  const [hourText, minuteText] = String(match.match_time ?? "00:00").split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const matchTime = new Date(
    year,
    month - 1,
    day,
    Number.isFinite(hour) ? hour : 0,
    Number.isFinite(minute) ? minute : 0,
  ).getTime();

  return Number.isFinite(matchTime) ? matchTime : null;
};

const hasResolvedScore = (match) => {
  const { awayScore, homeScore } = parseScore(match?.score);

  if (awayScore === null || homeScore === null) {
    return false;
  }

  if (match?.status === "finished") {
    return true;
  }

  const matchTime = createMatchTimeValue(match);

  return (
    matchTime !== null && Date.now() - matchTime >= SCORE_SETTLE_DELAY_MS
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
          match_date,
          match_time,
          away_team_code,
          home_team_code,
          score,
          status
        )
      `,
    )
    .or("result.is.null,result.eq.pending,result.eq.void");

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
    result: resolvePredictionResult(prediction),
  }));
  const resolvedPredictions = resolvedPredictionResults.filter(
    (prediction) => prediction.id && STORED_RESULTS.has(prediction.result),
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
