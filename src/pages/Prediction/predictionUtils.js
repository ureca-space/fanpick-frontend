import {
  TbBallBaseball,
  TbBallFootball,
  TbDeviceGamepad2,
} from "react-icons/tb";

// - 종목별 아이콘
export const SPORT_ICONS = {
  soccer: TbBallFootball,
  baseball: TbBallBaseball,
  esports: TbDeviceGamepad2,
};

export const CLOSED_PREDICTION_STATUS_LABELS = {
  cancelled: "경기취소",
  postponed: "경기취소",
};

// - 예측 결과별 화면 문구
export const RESULT_LABELS = {
  pending: "예측진행중",
  live: "경기중",
  resultPending: "결과 확인중",
  correct: "예측성공",
  incorrect: "예측실패",
  cancelled: "경기취소",
  void: "무승부",
};

// - Supabase 결과를 기존 CSS 클래스 이름으로 연결
export const RESULT_STYLES = {
  pending: "waiting",
  live: "live",
  resultPending: "resultPending",
  correct: "correct",
  incorrect: "incorrect",
  cancelled: "cancelled",
  void: "void",
};
