import Skeleton from "../../../../components/Skeleton/Skeleton";
import { RESULT_LABELS, RESULT_STYLES, SPORT_ICONS } from "../../predictionUtils";
import TeamMark from "../TeamMark/TeamMark";
import styles from "./MyPredictionCard.module.css";

// - 사용자가 선택한 경기 결과 표시
// - 진행 중, 성공, 실패 상태에 맞는 CSS 적용
const MyPredictionCard = ({ match, selection, result = "pending" }) => {
  // - API에 비율이 없으면 기본값 50% 사용
  const homeRate = match.homeRate ?? 50;
  const awayRate = match.awayRate ?? 50;
  const isAwaySelected = selection === "away";
  const resultStyle = RESULT_STYLES[result] ?? "waiting";
  const SportIcon = SPORT_ICONS[match.sport];

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
          <strong>{match.time}</strong>{" "}
          {match.isFinished ? "경기종료" : "경기예정"}
        </p>
        <span className={styles[resultStyle]}>{RESULT_LABELS[result]}</span>
      </div>

      <div className={`${styles.scoreBoard} ${styles[resultStyle]}`}>
        <div
          className={`${styles.scoreTeam} ${!isAwaySelected ? styles.myPick : ""}`}
        >
          <TeamMark team={match.homeTeam} />
          <span>
            <strong>{match.homeTeam.name}</strong>
            <small>{homeRate}%</small>
          </span>
          <b>{match.homeScore ?? "-"}</b>
        </div>

        <div
          className={`${styles.scoreTeam} ${styles.awayScore} ${isAwaySelected ? styles.myPick : ""}`}
        >
          <b>{match.awayScore ?? "-"}</b>
          <span>
            <strong>{match.awayTeam.name}</strong>
            <small>{awayRate}%</small>
          </span>
          <TeamMark team={match.awayTeam} />
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
        <Skeleton.Circle className={styles.skeletonTeamMark} />

        <span>
          <Skeleton.Line className={styles.skeletonTeamName} />
          <Skeleton.Line className={styles.skeletonTeamSubtext} />
        </span>

        <Skeleton.Line className={styles.skeletonScore} />
      </div>

      <div className={`${styles.scoreTeam} ${styles.awayScore}`}>
        <Skeleton.Line className={styles.skeletonScore} />

        <span>
          <Skeleton.Line className={styles.skeletonTeamName} />
          <Skeleton.Line className={styles.skeletonTeamSubtext} />
        </span>

        <Skeleton.Circle className={styles.skeletonTeamMark} />
      </div>
    </div>

    <Skeleton.Line className={styles.skeletonParticipants} />
  </article>
);

export default MyPredictionCard;
