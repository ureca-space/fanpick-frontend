import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button/Button";
import {
  getWorldCupById,
  WORLD_CUPS,
} from "../WorldCup/data/worldCupData";
import styles from "./WorldCupPlayPage.module.css";

const VALID_WORLD_CUP_IDS = new Set([
  "soccer",
  "baseball",
  "esports",
  ...WORLD_CUPS.map((worldCup) => worldCup.id),
]);

const WorldCupGame = ({ worldCup }) => {
  const navigate = useNavigate();
  const [contestants, setContestants] = useState(worldCup.candidates);
  const [pairIndex, setPairIndex] = useState(0);
  const [roundWinners, setRoundWinners] = useState([]);
  const [champion, setChampion] = useState(null);

  const currentPair = contestants.slice(pairIndex, pairIndex + 2);
  const matchNumber = pairIndex / 2 + 1;
  const totalMatches = contestants.length / 2;
  const roundLabel = contestants.length === 2 ? "결승" : `${contestants.length}강`;

  const handleChoose = (selectedCandidate) => {
    const nextWinners = [...roundWinners, selectedCandidate];
    const isLastPair = pairIndex + 2 >= contestants.length;

    if (!isLastPair) {
      setRoundWinners(nextWinners);
      setPairIndex(pairIndex + 2);
      return;
    }

    if (nextWinners.length === 1) {
      setChampion(selectedCandidate);
      return;
    }

    setContestants(nextWinners);
    setRoundWinners([]);
    setPairIndex(0);
  };

  const handleRestart = () => {
    setContestants(worldCup.candidates);
    setPairIndex(0);
    setRoundWinners([]);
    setChampion(null);
  };

  if (champion) {
    return (
      <main className={styles.playPage}>
        <div className={`container ${styles.inner}`}>
          <section className={styles.resultCard}>
            <p className={styles.eyebrow}>PICK BATTLE COMPLETE</p>
            <h1 className={styles.resultTitle}>최종 선택 결과</h1>
            <p className={styles.resultDescription}>
              여러 번의 선택 끝에 나만의 최종 우승자가 결정됐어요.
            </p>

            <div className={styles.championPanel}>
              <span className={styles.championLabel}>MY FINAL PICK</span>
              {champion.image && (
                <img
                  className={styles.championImage}
                  src={champion.image}
                  alt={`${champion.title} 선수`}
                />
              )}
              <strong className={styles.champion}>{champion.title}</strong>
              <p className={styles.championDescription}>
                {champion.description}
              </p>
            </div>

            <div className={styles.resultActions}>
              <Button variant="ghost" onClick={() => navigate("/worldcup")}>
                목록으로
              </Button>
              <Button onClick={handleRestart}>다시 하기</Button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
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
              onClick={() => handleChoose(candidate)}
            >
              {candidate.image && (
                <img
                  className={styles.choiceImage}
                  src={candidate.image}
                  alt=""
                />
              )}
              <span className={styles.choiceNumber}>PICK {index + 1}</span>
              <strong>{candidate.title}</strong>
              <p>{candidate.description}</p>
            </button>
          ))}

          <span className={styles.vs} aria-hidden="true">
            VS
          </span>
        </section>
      </div>
    </main>
  );
};

const WorldCupPlayPage = () => {
  const { id } = useParams();
  const selectedWorldCup = getWorldCupById(id);

  if (!VALID_WORLD_CUP_IDS.has(id)) {
    return <Navigate to="/worldcup" replace />;
  }

  if (selectedWorldCup?.candidates.length > 0) {
    return <WorldCupGame worldCup={selectedWorldCup} />;
  }

  return <main>{id} 이상형 월드컵 진행 페이지</main>;
};

export default WorldCupPlayPage;
