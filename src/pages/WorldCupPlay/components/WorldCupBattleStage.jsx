import WorldCupMedia from "../../WorldCup/components/WorldCupMedia/WorldCupMedia";
import styles from "../WorldCupPlayPage.module.css";

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

const WorldCupBattleStage = ({
  currentPair,
  matchNumber,
  onChoose,
  roundLabel,
  totalMatches,
  usesExpandedImages,
  usesLargePortraitImages,
  worldCup,
}) => (
  <main className={styles.playPage}>
    <div className={`container ${styles.inner}`}>
      <header className={styles.gameHeader}>
        <p className={styles.eyebrow}>{worldCup.category} PICK BATTLE</p>
        <h1 className={styles.title}>{worldCup.title}</h1>
        <p className={styles.progress}>
          {roundLabel} · {matchNumber} / {totalMatches}
        </p>
      </header>

      <section className={styles.battleArea} aria-label="후보 선택">
        {currentPair.map((candidate, index) => (
          <button
            key={candidate.id}
            type="button"
            className={styles.choiceCard}
            onClick={() => onChoose(candidate)}
          >
            <WorldCupMedia
              src={candidate.image}
              className={joinClassNames(
                styles.choiceImage,
                usesExpandedImages ? styles.expandedChoiceImage : "",
                usesLargePortraitImages ? styles.largePortraitChoiceImage : "",
              )}
              alt={`${candidate.title} 후보`}
              fallbackLabel={candidate.title}
            />
            <span className={styles.choiceNumber}>PICK {index + 1}</span>
            <strong>{candidate.title}</strong>
            {candidate.description && <p>{candidate.description}</p>}
          </button>
        ))}

        <span className={styles.vs} aria-hidden="true">
          VS
        </span>
      </section>
    </div>
  </main>
);

export default WorldCupBattleStage;
