import Skeleton from "../../../components/Skeleton/Skeleton";
import styles from "../TeamDetailPage.module.css";

const TeamMatchCardSkeleton = () => (
  <article
    className={`${styles.matchCard} ${styles.matchSkeletonCard}`}
    aria-label="팀 경기 일정 로딩 중"
  >
    <div className={styles.matchDate}>
      <Skeleton.Line className={styles.skeletonMatchDate} />
      <Skeleton.Line className={styles.skeletonMatchTime} />
    </div>

    <div className={styles.matchTeams}>
      <div>
        <Skeleton.Circle className={styles.skeletonMatchLogo} />
        <Skeleton.Line className={styles.skeletonMatchTeamName} />
      </div>

      <Skeleton.Line className={styles.skeletonMatchVs} />

      <div>
        <Skeleton.Circle className={styles.skeletonMatchLogo} />
        <Skeleton.Line className={styles.skeletonMatchTeamName} />
      </div>
    </div>

    <div className={styles.matchPrediction}>
      <div className={styles.predictionLabels}>
        <Skeleton.Line className={styles.skeletonPredictionLabel} />
        <Skeleton.Line className={styles.skeletonPredictionLabel} />
      </div>

      <Skeleton.Line className={styles.skeletonPredictionBar} />
    </div>

    <div className={styles.matchMeta}>
      <Skeleton.Line className={styles.skeletonMatchLeague} />
      <Skeleton.Line className={styles.skeletonMatchStatus} />
    </div>

    <Skeleton.Line className={styles.skeletonMatchButton} />
  </article>
);

export default TeamMatchCardSkeleton;
