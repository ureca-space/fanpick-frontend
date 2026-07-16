import { useEffect, useMemo, useState } from "react";
import styles from "./PlayerDetailDialog.module.css";

const PlayerDetailDialog = ({ player, onClose }) => {
  const imageCandidates = useMemo(
    () =>
      [player?.image, ...(player?.imageCandidates || [])].filter(
        (image, index, images) => image && images.indexOf(image) === index,
      ),
    [player?.image, player?.imageCandidates],
  );
  const imageKey = imageCandidates.join("|");

  const [imageState, setImageState] = useState({
    imageKey: "",
    index: 0,
    playerId: "",
  });
  const imageIndex =
    player &&
    imageState.playerId === player.id &&
    imageState.imageKey === imageKey
      ? imageState.index
      : 0;
  const currentImage = imageCandidates[imageIndex] || "";

  useEffect(() => {
    if (!player) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [player, onClose]);

  if (!player) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
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
    <div
      className={styles.backdrop}
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-detail-title"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="선수 상세 정보 닫기"
        >
          <span />
          <span />
        </button>

        <div className={styles.imageArea}>
          {currentImage ? (
            <img
              src={currentImage}
              alt={player.name}
              onError={handleImageError}
            />
          ) : (
            <div className={styles.imageFallback}>
              <span>FAN PICK</span>
            </div>
          )}
        </div>

        <div className={styles.content}>
          <p className={styles.sport}>{player.sport.toUpperCase()}</p>

          <h2 id="player-detail-title" className={styles.name}>
            {player.name}
          </h2>

          <p className={styles.englishName}>{player.englishName}</p>

          <div className={styles.basicInformation}>
            {player.team && <span>{player.team}</span>}
            {player.position && <span>{player.position}</span>}
            {player.nationality && <span>{player.nationality}</span>}
          </div>

          {player.introduction && (
            <p className={styles.introduction}>{player.introduction}</p>
          )}

          {player.tags?.length > 0 && (
            <div className={styles.tags}>
              {player.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          )}

          <dl className={styles.profileList}>
            {player.birthDate && (
              <div>
                <dt>BIRTH DATE</dt>
                <dd>{player.birthDate}</dd>
              </div>
            )}

            {player.height && (
              <div>
                <dt>HEIGHT</dt>
                <dd>{player.height}</dd>
              </div>
            )}

            {player.weight && (
              <div>
                <dt>WEIGHT</dt>
                <dd>{player.weight}</dd>
              </div>
            )}
          </dl>

          {player.ratings?.length > 0 && (
            <section className={styles.ratingSection}>
              <div className={styles.ratingHeader}>
                <h3>FANPICK RATING</h3>
                <span>재미로 보는 비공식 능력치</span>
              </div>

              <ul className={styles.ratingList}>
                {player.ratings.map((rating) => (
                  <li key={rating.label}>
                    <span className={styles.ratingLabel}>{rating.label}</span>

                    <span
                      className={styles.stars}
                      aria-label={`${rating.label} ${rating.score}점`}
                    >
                      <strong>{"★".repeat(rating.score)}</strong>
                      <span>{"★".repeat(5 - rating.score)}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className={styles.ratingNotice}>
                FanPick Rating은 재미를 위해 구성한 비공식 지표입니다.
              </p>
            </section>
          )}
        </div>
      </section>
    </div>
  );
};

export default PlayerDetailDialog;
