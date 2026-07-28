import Button from "../../../components/Button/Button";
import WorldCupMedia from "../../WorldCup/components/WorldCupMedia/WorldCupMedia";
import styles from "../WorldCupPlayPage.module.css";

const getCandidateStats = (worldCup, resultStats) =>
  resultStats
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

const WorldCupResultView = ({
  champion,
  onBackToList,
  onRestart,
  resultSaveError,
  resultSaveStatus,
  resultStats,
  statsStatus,
  worldCup,
}) => {
  const candidateStats = getCandidateStats(worldCup, resultStats);
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
              <WorldCupMedia
                src={champion.image}
                className={styles.championImage}
                alt={`${champion.title} 후보`}
                fallbackLabel={champion.title}
              />
              <strong className={styles.champion}>{champion.title}</strong>
              {champion.description && (
                <p className={styles.championDescription}>
                  {champion.description}
                </p>
              )}
            </div>

            <div className={styles.resultActions}>
              <Button variant="ghost" onClick={onBackToList}>
                목록으로
              </Button>
              <Button onClick={onRestart}>다시 하기</Button>
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
                  <WorldCupMedia
                    src={topStat.candidate.image}
                    className={styles.topPickImage}
                    alt={`${topStat.candidate.title} 전체 1위 후보`}
                    fallbackLabel={topStat.candidate.title}
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
};

export default WorldCupResultView;
