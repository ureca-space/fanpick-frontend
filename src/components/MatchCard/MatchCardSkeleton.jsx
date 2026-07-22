import Skeleton from "../Skeleton/Skeleton";
import styles from "./MatchCard.module.css";

const MatchCardSkeleton = () => (
  <article className={`${styles.matchCard} ${styles.skeletonCard}`}>
    <div className={styles.cardHeader}>
      <Skeleton.Line className={styles.skeletonBadge} />
      <Skeleton.Line className={styles.skeletonLeague} />
    </div>

    <div className={styles.matchInfo}>
      <Skeleton.Line className={styles.skeletonDate} />
      <Skeleton.Line className={styles.skeletonTime} />
    </div>

    <div className={styles.teams}>
      <div className={styles.team}>
        <Skeleton.Circle className={styles.skeletonLogo} />
        <Skeleton.Line className={styles.skeletonTeamName} />
      </div>

      <Skeleton.Line className={styles.skeletonVs} />

      <div className={styles.team}>
        <Skeleton.Circle className={styles.skeletonLogo} />
        <Skeleton.Line className={styles.skeletonTeamName} />
      </div>
    </div>

    <div className={styles.voteArea}>
      <div className={styles.voteLabels}>
        <Skeleton.Line className={styles.skeletonVoteLabel} />
        <Skeleton.Line className={styles.skeletonVoteLabel} />
      </div>

      <Skeleton.Line className={styles.skeletonVoteBar} />
    </div>

    <Skeleton.Line className={styles.skeletonButton} />
  </article>
);

export default MatchCardSkeleton;
