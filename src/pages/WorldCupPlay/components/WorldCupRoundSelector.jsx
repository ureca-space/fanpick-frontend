import Button from "../../../components/Button/Button";
import styles from "../WorldCupPlayPage.module.css";

const WorldCupRoundSelector = ({
  availableRounds,
  isRoundSelectOpen,
  onBlurRoundSelect,
  onSelectRoundOption,
  onStartRound,
  onToggleRoundSelect,
  selectedRoundOption,
  worldCup,
}) => (
  <main className={styles.playPage}>
    <div className={`container ${styles.inner}`}>
      <section className={styles.roundSelector}>
        <p className={styles.eyebrow}>SELECT TOURNAMENT SIZE</p>
        <h1 className={styles.roundSelectorTitle}>{worldCup.title}</h1>
        <p className={styles.roundSelectorDescription}>
          진행할 라운드를 선택하면 후보가 무작위로 추첨돼요.
        </p>

        <div className={styles.roundControls}>
          <span className={styles.roundSelectLabel}>라운드 선택</span>
          <div
            className={`${styles.roundSelectWrap} ${
              isRoundSelectOpen ? styles.roundSelectOpen : ""
            }`}
            onBlur={onBlurRoundSelect}
          >
            <button
              type="button"
              className={styles.roundSelectButton}
              onClick={onToggleRoundSelect}
              aria-haspopup="listbox"
              aria-expanded={isRoundSelectOpen}
            >
              {selectedRoundOption}강
            </button>

            {isRoundSelectOpen && (
              <ul className={styles.roundSelectMenu} role="listbox">
                {[...availableRounds].reverse().map((roundSize) => (
                  <li key={roundSize}>
                    <button
                      type="button"
                      className={
                        selectedRoundOption === roundSize
                          ? styles.selectedRoundOption
                          : ""
                      }
                      onClick={() => onSelectRoundOption(roundSize)}
                      role="option"
                      aria-selected={selectedRoundOption === roundSize}
                    >
                      {roundSize}강
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button fullWidth onClick={onStartRound}>
            시작하기
          </Button>
        </div>

        <p className={styles.roundCandidateCount}>
          전체 후보 {worldCup.candidates.length}명
        </p>
      </section>
    </div>
  </main>
);

export default WorldCupRoundSelector;
