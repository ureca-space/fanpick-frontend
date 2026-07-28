import Button from "../../../../components/Button/Button";
import WorldCupMedia from "../WorldCupMedia/WorldCupMedia";
import styles from "./WorldCupCard.module.css";

const THUMBNAIL_WORLD_CUP_IDS = ["baseball-funny", "lol-thumbnail", "lol-team"];

const WorldCupCard = ({ worldCup, onStart }) => {
  const fallbackLabel = worldCup.category.slice(0, 1);

  const isThumbnailWorldCup = THUMBNAIL_WORLD_CUP_IDS.includes(worldCup.id);
  const isSoccerSkillWorldCup = worldCup.id === "soccer-player-skill";

  return (
    <article className={styles.worldCupCard}>
      <div className={styles.cardContent}>
        <div className={styles.cardTop}>
          <span className={styles.categoryBadge}>{worldCup.category}</span>
          <span className={styles.roundBadge}>{worldCup.round}</span>
        </div>

        <div
          className={`${styles.imageArea} ${
            isThumbnailWorldCup ? styles.thumbnailImageArea : ""
          }`}
          aria-hidden="true"
        >
          <div className={styles.imageSlot}>
            <WorldCupMedia
              src={worldCup.leftImage}
              className={styles.battleImage}
              fallbackClassName={styles.imageFallback}
              fallbackLabel={fallbackLabel}
              draggable={false}
              loading="lazy"
            />
          </div>

          <span className={styles.vs}>VS</span>

          <div className={styles.imageSlot}>
            <WorldCupMedia
              src={worldCup.rightImage}
              className={`${styles.battleImage} ${
                isSoccerSkillWorldCup ? styles.croppedPlayerImage : ""
              }`}
              fallbackClassName={styles.imageFallback}
              fallbackLabel={fallbackLabel}
              draggable={false}
              loading="lazy"
            />
          </div>
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
