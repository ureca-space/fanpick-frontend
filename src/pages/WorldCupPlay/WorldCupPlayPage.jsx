import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button/Button";
import useAuth from "../../contexts/useAuth";
import {
  getWorldCupResultStats,
  saveWorldCupResult,
} from "../../services/worldCupApi";
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

const isVideoSource = (src) => /\.mp4(?:$|\?)/i.test(src);

const shuffleCandidates = (candidates) =>
  [...candidates].sort(() => Math.random() - 0.5);

const ROUND_OPTIONS = [4, 8, 16, 32, 64];

const getInitialCandidates = (worldCup, roundSize) => {
  const shuffledCandidates = shuffleCandidates(worldCup.candidates);

  return shuffledCandidates.slice(0, roundSize);
};

const CandidateMedia = ({ candidate, className, alt = "" }) => {
  if (!candidate.image) {
    return null;
  }

  if (isVideoSource(candidate.image)) {
    return (
      <video
        className={className}
        src={candidate.image}
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
      className={className}
      src={candidate.image}
      referrerPolicy="no-referrer"
      alt={alt}
    />
  );
};

const WorldCupGame = ({ worldCup }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const worldCupId = worldCup.id;
  const usesExpandedImages = [
    "baseball-funny",
    "lol-thumbnail",
    "lol-team",
  ].includes(worldCup.id);
  const usesLargePortraitImages = worldCup.id === "soccer-player-skill";
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundSelection, setRoundSelection] = useState("");
  const [isRoundSelectOpen, setIsRoundSelectOpen] = useState(false);
  const [contestants, setContestants] = useState([]);
  const [pairIndex, setPairIndex] = useState(0);
  const [roundWinners, setRoundWinners] = useState([]);
  const [champion, setChampion] = useState(null);
  const [resultSaveStatus, setResultSaveStatus] = useState("idle");
  const [resultSaveError, setResultSaveError] = useState("");
  const [resultStats, setResultStats] = useState([]);
  const [statsStatus, setStatsStatus] = useState("idle");
  const availableRounds = ROUND_OPTIONS.filter(
    (roundSize) => roundSize <= worldCup.candidates.length,
  );
  const selectedRoundOption =
    Number(roundSelection) || availableRounds[availableRounds.length - 1];

  useEffect(() => {
    if (!champion) {
      return;
    }

    let isActive = true;

    const loadStats = async () => {
      setStatsStatus("loading");

      try {
        const stats = await getWorldCupResultStats(worldCupId);

        if (isActive) {
          setResultStats(stats);
          setStatsStatus("loaded");
        }
      } catch (error) {
        console.warn("월드컵 통계를 불러오지 못했습니다.", error);

        if (isActive) {
          setStatsStatus("error");
        }
      }
    };

    void loadStats();

    return () => {
      isActive = false;
    };
  }, [champion, worldCupId]);

  const currentPair = contestants.slice(pairIndex, pairIndex + 2);
  const matchNumber = pairIndex / 2 + 1;
  const hasBye = contestants.length % 2 === 1;
  const pairedCandidateCount = hasBye
    ? contestants.length - 1
    : contestants.length;
  const totalMatches = pairedCandidateCount / 2;
  const bracketSize = 2 ** Math.ceil(Math.log2(contestants.length));
  const roundLabel = contestants.length === 2 ? "결승" : `${bracketSize}강`;

  const persistChampion = async (selectedCandidate) => {
    if (!userId) {
      setResultSaveStatus("guest");
      return;
    }

    setResultSaveStatus("saving");
    setResultSaveError("");

    try {
      await saveWorldCupResult({
        userId,
        worldCupId,
        championCandidateId: selectedCandidate.id,
      });
      setResultSaveStatus("saved");
    } catch (error) {
      console.warn("월드컵 최종 선택을 저장하지 못했습니다.", error);
      setResultSaveStatus("error");
      setResultSaveError(error.message || "알 수 없는 오류");
    }
  };

  const handleChoose = async (selectedCandidate) => {
    const nextWinners = [...roundWinners, selectedCandidate];
    const isLastPair = pairIndex + 2 >= pairedCandidateCount;

    if (isLastPair && hasBye) {
      nextWinners.push(contestants[contestants.length - 1]);
    }

    const isChampion = isLastPair && nextWinners.length === 1;

    if (isChampion) {
      await persistChampion(selectedCandidate);
    }

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
    setSelectedRound(null);
    setRoundSelection("");
    setIsRoundSelectOpen(false);
    setContestants([]);
    setPairIndex(0);
    setRoundWinners([]);
    setChampion(null);
    setResultSaveStatus("idle");
    setResultSaveError("");
    setResultStats([]);
    setStatsStatus("idle");
  };

  const handleStartRound = () => {
    const roundSize = selectedRoundOption;

    setSelectedRound(roundSize);
    setContestants(getInitialCandidates(worldCup, roundSize));
    setPairIndex(0);
    setRoundWinners([]);
    setChampion(null);
  };

  if (!selectedRound) {
    return (
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
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsRoundSelectOpen(false);
                  }
                }}
              >
                <button
                  type="button"
                  className={styles.roundSelectButton}
                  onClick={() => setIsRoundSelectOpen((isOpen) => !isOpen)}
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
                          onClick={() => {
                            setRoundSelection(String(roundSize));
                            setIsRoundSelectOpen(false);
                          }}
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

              <Button fullWidth onClick={handleStartRound}>
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
  }

  if (champion) {
    const candidateStats = resultStats
      .map((stat) => {
        const candidate = worldCup.candidates.find(
          (item) => item.id === stat.champion_candidate_id,
        );

        return {
          candidate,
          count: Number(stat.selection_count),
        };
      })
      .filter((stat) => stat.candidate);
    const totalSelections = candidateStats.reduce(
      (total, stat) => total + stat.count,
      0,
    );
    const topStat = candidateStats[0];

    return (
      <main className={styles.playPage}>
        <div className={`container ${styles.inner}`}>
          <section className={styles.resultLayout}>
            <article className={styles.resultPanel}>
              <p className={styles.eyebrow}>PICK BATTLE COMPLETE</p>
              <h1 className={styles.resultTitle}>최종 선택 결과</h1>
              <p className={styles.resultDescription}>
                여러 번의 선택 끝에 나만의 최종 우승자가 결정됐어요.
              </p>
              {resultSaveStatus === "saved" && (
                <p className={styles.resultDescription}>
                  최종 선택이 통계에 저장됐어요.
                </p>
              )}
              {resultSaveStatus === "guest" && (
                <p className={styles.resultDescription}>
                  로그인한 회원의 선택만 통계에 저장돼요.
                </p>
              )}
              {resultSaveStatus === "error" && (
                <p className={styles.resultDescription}>
                  저장 실패: {resultSaveError}
                </p>
              )}

              <div className={styles.championPanel}>
                <span className={styles.championLabel}>MY FINAL PICK</span>
                <CandidateMedia
                  candidate={champion}
                  className={styles.championImage}
                  alt={`${champion.title} 후보`}
                />
                <strong className={styles.champion}>{champion.title}</strong>
                {champion.description && (
                  <p className={styles.championDescription}>
                    {champion.description}
                  </p>
                )}
              </div>

              <div className={styles.resultActions}>
                <Button variant="ghost" onClick={() => navigate("/worldcup")}>
                  목록으로
                </Button>
                <Button onClick={handleRestart}>다시 하기</Button>
              </div>
            </article>

            <aside className={styles.statsPanel}>
              <header className={styles.panelHeader}>
                <span className={styles.panelEyebrow}>COMMUNITY PICK</span>
                <h2 className={styles.panelTitle}>회원들이 고른 우승 후보</h2>
                <p className={styles.panelDescription}>
                  로그인 회원들의 최종 선택을 기준으로 집계했어요.
                </p>
              </header>

              {statsStatus === "loading" && (
                <div className={styles.statsLoading}>통계를 불러오는 중...</div>
              )}

              {statsStatus === "error" && (
                <div className={styles.statsEmpty}>
                  통계를 불러오지 못했어요.
                </div>
              )}

              {statsStatus === "loaded" && !topStat && (
                <div className={styles.statsEmpty}>
                  아직 집계된 회원 선택이 없어요.
                </div>
              )}

              {statsStatus === "loaded" && topStat && (
                <>
                  <div className={styles.topPick}>
                    <CandidateMedia
                      candidate={topStat.candidate}
                      className={styles.topPickImage}
                      alt={`${topStat.candidate.title} 전체 1위 후보`}
                    />
                    <div>
                      <span className={styles.topPickRank}>MOST PICKED</span>
                      <strong className={styles.topPickTitle}>
                        {topStat.candidate.title}
                      </strong>
                      <p className={styles.topPickMeta}>
                        <strong>{topStat.count}명</strong>이 최종 선택했어요.
                      </p>
                    </div>
                  </div>

                  <ol className={styles.statsList}>
                    {candidateStats.slice(0, 5).map((stat) => {
                      const percentage =
                        totalSelections > 0
                          ? (stat.count / totalSelections) * 100
                          : 0;

                      return (
                        <li className={styles.statsItem} key={stat.candidate.id}>
                          <div className={styles.statsItemHeader}>
                            <span className={styles.statsCandidate}>
                              {stat.candidate.title}
                            </span>
                            <span className={styles.statsValue}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className={styles.statsTrack}>
                            <div
                              className={styles.statsBar}
                              style={{ "--result-rate": `${percentage}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <p className={styles.statsSummary}>
                    <span>총 참여 회원</span>
                    <strong>{totalSelections}명</strong>
                  </p>
                </>
              )}
            </aside>
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
              <CandidateMedia
                candidate={candidate}
                className={`${styles.choiceImage} ${
                  usesExpandedImages ? styles.expandedChoiceImage : ""
                } ${
                  usesLargePortraitImages ? styles.largePortraitChoiceImage : ""
                }`}
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
