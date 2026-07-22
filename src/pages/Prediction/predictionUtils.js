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
  cancelled: "경기취소",
  void: "무승부",
};

// - Supabase 결과를 기존 CSS 클래스 이름으로 연결
export const RESULT_STYLES = {
  pending: "waiting",
  correct: "correct",
  incorrect: "incorrect",
  void: "finished",
};
