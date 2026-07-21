// - 종목별 아이콘
export const SPORT_ICONS = {
  soccer: "⚽",
  baseball: "⚾",
  esports: "🎮",
};

// - 예측 결과별 화면 문구
export const RESULT_LABELS = {
  pending: "예측진행중",
  correct: "예측성공",
  incorrect: "예측실패",
  void: "무승부",
};

// - Supabase 결과를 기존 CSS 클래스 이름으로 연결
export const RESULT_STYLES = {
  pending: "waiting",
  correct: "correct",
  incorrect: "incorrect",
  void: "finished",
};

// - Supabase에 저장된 결과로 전체 예측 횟수와 성공률 계산
export const getPredictionStats = (predictions, predictionResults) => {
  const results = Object.values(predictionResults);
  const finishedResults = results.filter((result) =>
    ["correct", "incorrect"].includes(result),
  );
  const correctCount = results.filter((result) => result === "correct").length;

  return {
    predictionCount: Object.keys(predictions).length,
    successRate: finishedResults.length
      ? Math.round((correctCount / finishedResults.length) * 100)
      : 0,
  };
};
