import { useMemo, useState } from "react";
import styles from "./PlayerCard.module.css";

const PlayerCard = ({ player, onClick }) => {
  const imageCandidates = useMemo(
    () =>
      [player.image, ...(player.imageCandidates || [])].filter(
        (image, index, images) => image && images.indexOf(image) === index,
      ),
    [player.image, player.imageCandidates],
  );
  const imageKey = imageCandidates.join("|");

  const [imageState, setImageState] = useState({
    imageKey: "",
    index: 0,
    playerId: "",
  });
  const imageIndex =
    imageState.playerId === player.id && imageState.imageKey === imageKey
      ? imageState.index
      : 0;
  const currentImage = imageCandidates[imageIndex] || "";

  const handleClick = () => {
    onClick?.(player);
  };

  const handleImageError = () => {
    setImageState((previousState) => {
      const isCurrentImageSet =
        previousState.playerId === player.id &&
        previousState.imageKey === imageKey;

      return {
        imageKey,
        index: isCurrentImageSet ? previousState.index + 1 : 1,
        playerId: player.id,
      };
    });
  };

  return (
    <button
      type="button"
      className={styles.card}
      onClick={handleClick}
      aria-label={`${player.name} 선수 정보 보기`}
    >
      <div className={styles.imageArea}>
        {currentImage ? (
          <img
            src={currentImage}
            alt={player.name}
            className={styles.playerImage}
            onError={handleImageError}
          />
        ) : (
          <div className={styles.imageFallback} aria-hidden="true">
            <span>FAN PICK</span>
          </div>
        )}

        <div className={styles.overlay} />

        <div className={styles.information}>
          <div className={styles.topRow}>
            <div className={styles.leftInfo}>
              <h3 className={styles.name}>{player.name}</h3>
              <p className={styles.englishName}>{player.englishName}</p>

              {player.team && <p className={styles.team}>{player.team}</p>}
            </div>

            {player.position && (
              <span className={styles.position}>{player.position}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default PlayerCard;
