import { forwardRef } from "react";
import {
  isLiveMatchStatus,
  isResultPendingMatchStatus,
} from "../../../../utils/matchStatus";
import { CLOSED_PREDICTION_STATUS_LABELS } from "../../predictionUtils";
import PredictionMatchCard, {
  PredictionMatchCardSkeleton,
} from "../PredictionMatchCard/PredictionMatchCard";

// - 오늘의 경기 표시
// - 홈팀 또는 원정팀 선택 처리
const TodayMatchCard = forwardRef(function TodayMatchCard(
  {
    canChangePrediction = false,
    isSaving,
    isTarget = false,
    match,
    onSelect,
    selection,
  },
  ref,
) {
  // - API에 비율이 없으면 기본값 50% 사용
  const homeRate = match.homeRate ?? 50;
  const awayRate = match.awayRate ?? 50;
  const hasSelection = Boolean(selection);
  const closedStatusLabel =
    CLOSED_PREDICTION_STATUS_LABELS[match.status] ?? "";
  const isLive = isLiveMatchStatus(match.status);
  const isResultPending = isResultPendingMatchStatus(match.status);
  const isClosed =
    isLive || isResultPending || match.isFinished || Boolean(closedStatusLabel);
  const canChangeSelection =
    hasSelection && canChangePrediction && !isClosed;
  const isCancelled = Boolean(closedStatusLabel);
  const isHomeDisabled =
    isClosed ||
    isSaving ||
    (hasSelection && !canChangeSelection);
  const isAwayDisabled =
    isClosed ||
    isSaving ||
    (hasSelection && !canChangeSelection);
  const headingStatusLabel =
    closedStatusLabel ||
    (isLive
      ? "경기중"
      : isResultPending
        ? "결과 확인중"
        : match.isFinished
          ? "경기종료"
          : "경기예정");
  const statusLabel = closedStatusLabel
    ? closedStatusLabel
    : isLive
      ? "경기중"
    : isResultPending
      ? "결과 확인중"
    : match.isFinished
      ? selection
        ? "경기종료"
        : "미참여"
      : selection
        ? canChangeSelection
          ? "변경가능"
          : "투표완료"
        : "예측진행중";
  const statusTone = isCancelled
    ? "cancelled"
    : isLive
      ? "live"
      : isResultPending
        ? "resultPending"
        : isClosed
          ? "finished"
          : "waiting";

  return (
    <PredictionMatchCard
      awayDisabled={isAwayDisabled}
      awayValue={isClosed ? (match.awayScore ?? "-") : `${awayRate}%`}
      boardTone={statusTone}
      headingStatusLabel={headingStatusLabel}
      homeDisabled={isHomeDisabled}
      homeValue={isClosed ? (match.homeScore ?? "-") : `${homeRate}%`}
      isCancelled={isCancelled}
      isClosed={isClosed}
      isTarget={isTarget}
      match={match}
      onAwaySelect={() => onSelect(match, "away")}
      onHomeSelect={() => onSelect(match, "home")}
      ref={ref}
      selection={selection}
      statusLabel={statusLabel}
      statusTone={statusTone}
      variant="today"
    />
  );
});

export const TodayMatchCardSkeleton = () => (
  <PredictionMatchCardSkeleton
    ariaLabel="오늘의 경기 로딩 중"
    variant="today"
  />
);

export default TodayMatchCard;
