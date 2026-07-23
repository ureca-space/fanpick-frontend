import { forwardRef } from "react";
import Skeleton from "../../../../components/Skeleton/Skeleton";
import { SPORT_ICONS } from "../../predictionUtils";
import TeamMark from "../TeamMark/TeamMark";
import styles from "./TodayMatchCard.module.css";

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
  const SportIcon = SPORT_ICONS[match.sport];
  const hasSelection = Boolean(selection);
  const canChangeSelection =
    hasSelection && canChangePrediction && !match.isFinished;
  const isHomeSelected = selection === "home";
  const isAwaySelected = selection === "away";
  const isHomeDisabled =
    match.isFinished ||
    isSaving ||
    (hasSelection && !canChangeSelection);
  const isAwayDisabled =
    match.isFinished ||
    isSaving ||
    (hasSelection && !canChangeSelection);
  const statusLabel = match.isFinished
    ? selection
      ? "경기종료"
      : "미참여"
    : selection
      ? canChangeSelection
        ? "변경가능"
        : "투표완료"
      : "예측진행중";

  return (
    <article
      className={`${styles.matchCard} ${isTarget ? styles.targetMatchCard : ""}`}
      ref={ref}
      tabIndex={isTarget ? -1 : undefined}
    >
      <div className={styles.matchMeta}>
        <span>{match.sportLabel}</span>
        {SportIcon && (
          <span className={styles.sportIcon} aria-hidden="true">
            <SportIcon />
          </span>
        )}
        <strong>{match.league}</strong>
      </div>

      <div className={styles.matchHeading}>
        <p>
          <strong>{match.time}</strong>{" "}
          {match.isFinished ? "경기종료" : "경기예정"}
        </p>
        <span className={match.isFinished ? styles.finished : ""}>
          {statusLabel}
        </span>
      </div>

      <div
        className={`${styles.teams} ${match.isFinished ? styles.finishedTeams : ""}`}
      >
        <button
          type="button"
          className={`${styles.teamButton} ${isHomeSelected ? styles.selected : ""}`}
          disabled={isHomeDisabled}
          onClick={() => onSelect(match, "home")}
        >
          <span className={styles.teamIdentity}>
            <TeamMark team={match.homeTeam} />
            <span className={styles.teamText}>
              <strong>{match.homeTeam.name}</strong>
              {isHomeSelected && (
                <small className={styles.myPickBadge}>내 선택</small>
              )}
              {match.isFinished && <small>{homeRate}%</small>}
            </span>
          </span>
          {match.isFinished ? (
            <b>{match.homeScore ?? "-"}</b>
          ) : (
            <b>{homeRate}%</b>
          )}
        </button>

        <button
          type="button"
          className={`${styles.teamButton} ${styles.awayTeam} ${isAwaySelected ? styles.selected : ""}`}
          disabled={isAwayDisabled}
          onClick={() => onSelect(match, "away")}
        >
          {match.isFinished ? (
            <b>{match.awayScore ?? "-"}</b>
          ) : (
            <b>{awayRate}%</b>
          )}
          <span className={styles.teamIdentity}>
            <span className={styles.teamText}>
              <strong>{match.awayTeam.name}</strong>
              {isAwaySelected && (
                <small className={styles.myPickBadge}>내 선택</small>
              )}
              {match.isFinished && <small>{awayRate}%</small>}
            </span>
            <TeamMark team={match.awayTeam} />
          </span>
        </button>
      </div>

      <small>{(match.participants ?? 0).toLocaleString()}명 참여</small>
    </article>
  );
});

export const TodayMatchCardSkeleton = () => (
  <article
    className={`${styles.matchCard} ${styles.skeletonCard}`}
    aria-label="오늘의 경기 로딩 중"
  >
    <div className={styles.matchMeta}>
      <Skeleton.Line className={styles.skeletonMetaShort} />
      <Skeleton.Circle className={styles.skeletonSportIcon} />
      <Skeleton.Line className={styles.skeletonMetaLong} />
    </div>

    <div className={styles.matchHeading}>
      <Skeleton.Line className={styles.skeletonHeading} />
      <Skeleton.Line className={styles.skeletonStatus} />
    </div>

    <div className={styles.teams}>
      <div className={styles.teamButton}>
        <span className={styles.teamIdentity}>
          <Skeleton.Circle className={styles.skeletonTeamMark} />

          <span className={styles.teamText}>
            <Skeleton.Line className={styles.skeletonTeamName} />
            <Skeleton.Line className={styles.skeletonTeamSubtext} />
          </span>
        </span>
      </div>

      <div className={`${styles.teamButton} ${styles.awayTeam}`}>
        <span className={styles.teamIdentity}>
          <span className={styles.teamText}>
            <Skeleton.Line className={styles.skeletonTeamName} />
            <Skeleton.Line className={styles.skeletonTeamSubtext} />
          </span>

          <Skeleton.Circle className={styles.skeletonTeamMark} />
        </span>
      </div>
    </div>

    <Skeleton.Line className={styles.skeletonParticipants} />
  </article>
);

export default TodayMatchCard;
