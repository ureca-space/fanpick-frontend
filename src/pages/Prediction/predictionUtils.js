// - 종목별 아이콘
export const SPORT_ICONS = {
  soccer: "⚽",
  baseball: "⚾",
  lol: "🎮",
};

// - 예측 결과별 화면 문구
export const RESULT_LABELS = {
  waiting: "예측진행중",
  finished: "예측실패",
  correct: "예측성공",
  incorrect: "예측실패",
};

const getDateInfo = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00+09:00`);

  return {
    dateKey,
    day: new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(date),
    date: date.getDate(),
  };
};

const getTodayDateKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

// - 시작일부터 7일간의 날짜 버튼 데이터 생성
export const createDateFilter = (startDate) => {
  const todayKey = getTodayDateKey();
  const [year, month, day] = startDate.split("-").map(Number);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index));
    const dateKey = date.toISOString().slice(0, 10);
    const dateInfo = getDateInfo(dateKey);

    return {
      ...dateInfo,
      day: dateKey === todayKey ? "오늘" : dateInfo.day,
    };
  });
};

// - localStorage에 저장된 예측 불러오기
// - 저장된 값이 없거나 오류가 나면 빈 객체 반환
export const getSavedPredictions = (storageKey) => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
};

// - 경기 결과와 사용자의 선택을 비교
// - waiting, correct, incorrect, finished 중 하나 반환
export const getPredictionResult = (match, selection) => {
  if (!match.isFinished) return "waiting";
  if (match.homeScore === match.awayScore) return "finished";

  const winningTeam = match.homeScore > match.awayScore ? "home" : "away";
  return selection === winningTeam ? "correct" : "incorrect";
};

// - 전체 예측 횟수와 성공률 계산
export const getPredictionStats = (matches, predictions) => {
  const predictedMatches = matches.filter((match) => predictions[match.id]);
  const results = predictedMatches.map((match) =>
    getPredictionResult(match, predictions[match.id]),
  );
  const finishedResults = results.filter((result) => result !== "waiting");
  const correctCount = finishedResults.filter(
    (result) => result === "correct",
  ).length;

  return {
    predictionCount: predictedMatches.length,
    successRate: finishedResults.length
      ? Math.round((correctCount / finishedResults.length) * 100)
      : 0,
  };
};
