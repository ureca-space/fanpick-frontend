import {
  isLiveMatchStatus,
  isResultPendingMatchStatus,
} from "../../../../utils/matchStatus";
import {
  CLOSED_PREDICTION_STATUS_LABELS,
  RESULT_LABELS,
  RESULT_STYLES,
} from "../../predictionUtils";
import PredictionMatchCard, {
  PredictionMatchCardSkeleton,
} from "../PredictionMatchCard/PredictionMatchCard";

// - 사용자가 선택한 경기 결과 표시
// - 진행 중, 성공, 실패 상태에 맞는 CSS 적용
const MyPredictionCard = ({ match, selection, result = "pending" }) => {
  // - API에 비율이 없으면 기본값 50% 사용
  const homeRate = match.homeRate ?? 50;
  const awayRate = match.awayRate ?? 50;
  const isLive = isLiveMatchStatus(match.status);
  const isResultPending = isResultPendingMatchStatus(match.status);
  const displayResult = isLive
    ? "live"
    : isResultPending
      ? "resultPending"
      : result;
  const resultStyle = RESULT_STYLES[displayResult] ?? "waiting";
  const closedStatusLabel =
    CLOSED_PREDICTION_STATUS_LABELS[match.status] ?? "";
  const isClosed =
    isLive || isResultPending || match.isFinished || Boolean(closedStatusLabel);
  const headingStatusLabel =
    closedStatusLabel ||
    (isLive
      ? "경기중"
      : isResultPending
        ? "결과 확인중"
        : match.isFinished
          ? "경기종료"
          : "경기예정");

  return (
    <PredictionMatchCard
      awayValue={isClosed ? (match.awayScore ?? "-") : `${awayRate}%`}
      boardTone={resultStyle}
      headingStatusLabel={headingStatusLabel}
      homeValue={isClosed ? (match.homeScore ?? "-") : `${homeRate}%`}
      isClosed={isClosed}
      match={match}
      selection={selection}
      statusLabel={RESULT_LABELS[displayResult]}
      statusTone={resultStyle}
    />
  );
};

export const MyPredictionCardSkeleton = () => (
  <PredictionMatchCardSkeleton ariaLabel="나의 예측 로딩 중" />
);

export default MyPredictionCard;
