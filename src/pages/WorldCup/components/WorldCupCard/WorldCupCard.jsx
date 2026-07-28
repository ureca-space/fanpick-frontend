import Button from "../../../../components/Button/Button";
import styles from "./WorldCupCard.module.css";

const isVideoSource = (src) => /\.mp4(?:$|\?)/i.test(src);

const BattleImage = ({ src, label }) => {
  if (!src) {
    return <span className={styles.imageFallback}>{label}</span>;
  }

  if (isVideoSource(src)) {
    return (
      <video
        className={styles.battleImage}
        src={src}
        referrerPolicy="no-referrer"
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }

  return (
    <img
      className={styles.battleImage}
      src={src}
      referrerPolicy="no-referrer"
      alt=""
    />
  );
};

const WorldCupCard = ({ worldCup, onStart }) => {
  return (
    <article className={styles.worldCupCard}>
      <div className={styles.cardContent}>
        <div className={styles.cardTop}>
          <span className={styles.categoryBadge}>{worldCup.category}</span>
          <span className={styles.roundBadge}>{worldCup.round}</span>
        </div>

        <div
          className={`${styles.imageArea} ${
            ["baseball-funny", "lol-thumbnail", "lol-team"].includes(
              worldCup.id,
            )
              ? styles.thumbnailImageArea
              : ""
          }`}
          aria-hidden="true"
        >
          <BattleImage
            src={worldCup.leftImage}
            label={worldCup.category.slice(0, 1)}
          />

          <span className={styles.vs}>VS</span>

          <BattleImage
            src={worldCup.rightImage}
            label={worldCup.category.slice(0, 1)}
          />
        </div>

        <strong className={styles.cardTitle}>{worldCup.title}</strong>
        <p className={styles.cardDescription}>{worldCup.description}</p>
      </div>

      <Button
        className={styles.startButton}
        fullWidth
        variant="ghost"
        onClick={onStart}
      >
        시작하기
      </Button>
    </article>
  );
};

export default WorldCupCard;
