import styles from "./PlayerCardSkeleton.module.css";

const PlayerCardSkeleton = () => {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.image} />

      <div className={styles.information}>
        <div className={styles.name} />
        <div className={styles.englishName} />

        <div className={styles.bottom}>
          <div className={styles.team} />
          <div className={styles.position} />
        </div>
      </div>
    </div>
  );
};

export default PlayerCardSkeleton;
