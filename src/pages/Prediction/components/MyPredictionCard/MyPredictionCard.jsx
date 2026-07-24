import Skeleton from "../../../../components/Skeleton/Skeleton";
import { RESULT_LABELS, RESULT_STYLES, SPORT_ICONS } from "../../predictionUtils";
import TeamMark from "../TeamMark/TeamMark";
import styles from "./MyPredictionCard.module.css";

const MATCH_STATUS_LABELS = {
  cancelled: "경기취소",
  postponed: "경기취소",
};

// - 사용자가 선택한 경기 결과 표시
// - 진행 중, 성공, 실패 상태에 맞는 CSS 적용
const MyPredictionCard = ({ match, selection, result = "pending" }) => {
  // - API에 비율이 없으면 기본값 50% 사용
  const homeRate = match.homeRate ?? 50;
  const awayRate = match.awayRate ?? 50;
  const isHomeSelected = selection === "home";
  const isAwaySelected = selection === "away";
  const resultStyle = RESULT_STYLES[result] ?? "waiting";
  const SportIcon = SPORT_ICONS[match.sport];
  const closedStatusLabel = MATCH_STATUS_LABELS[match.status] ?? "";
  const isClosed = match.isFinished || Boolean(closedStatusLabel);
  const headingStatusLabel =
    closedStatusLabel || (match.isFinished ? "경기종료" : "경기예정");

  return (
    <article className={styles.matchCard}>
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
          <strong>{match.time}</strong> {headingStatusLabel}
        </p>
        <span className={styles[resultStyle]}>{RESULT_LABELS[result]}</span>
      </div>

      <div
        className={`${styles.scoreBoard} ${styles[resultStyle]} ${
          isClosed ? styles.finishedBoard : ""
        }`}
      >
        <div
          className={`${styles.scoreTeam} ${isHomeSelected ? styles.myPick : ""}`}
        >
          <span className={styles.teamIdentity}>
            <TeamMark team={match.homeTeam} />

            <span className={styles.teamText}>
              <strong>{match.homeTeam.name}</strong>
              {isHomeSelected && (
                <small className={styles.myPickBadge}>내 선택</small>
              )}
              {isClosed && <small>{homeRate}%</small>}
            </span>
          </span>

          <b>{isClosed ? (match.homeScore ?? "-") : `${homeRate}%`}</b>
        </div>

        <div
          className={`${styles.scoreTeam} ${styles.awayScore} ${isAwaySelected ? styles.myPick : ""}`}
        >
          <b>{isClosed ? (match.awayScore ?? "-") : `${awayRate}%`}</b>

          <span className={styles.teamIdentity}>
            <span className={styles.teamText}>
              <strong>{match.awayTeam.name}</strong>
              {isAwaySelected && (
                <small className={styles.myPickBadge}>내 선택</small>
              )}
              {isClosed && <small>{awayRate}%</small>}
            </span>

            <TeamMark team={match.awayTeam} />
          </span>
        </div>
      </div>

      <small>{(match.participants ?? 0).toLocaleString()}명 참여</small>
    </article>
  );
};

export const MyPredictionCardSkeleton = () => (
  <article
    className={`${styles.matchCard} ${styles.skeletonCard}`}
    aria-label="나의 예측 로딩 중"
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

    <div className={styles.scoreBoard}>
      <div className={styles.scoreTeam}>
        <span className={styles.teamIdentity}>
          <Skeleton.Circle className={styles.skeletonTeamMark} />

          <span className={styles.teamText}>
            <Skeleton.Line className={styles.skeletonTeamName} />
            <Skeleton.Line className={styles.skeletonTeamSubtext} />
          </span>
        </span>

        <Skeleton.Line className={styles.skeletonScore} />
      </div>

      <div className={`${styles.scoreTeam} ${styles.awayScore}`}>
        <Skeleton.Line className={styles.skeletonScore} />

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

export default MyPredictionCard;
