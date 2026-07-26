import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../../components/EmptyState/EmptyState";
import PredictionBadgeIcon from "../../../components/PredictionBadgeIcon/PredictionBadgeIcon";
import Skeleton from "../../../components/Skeleton/Skeleton";
import useAuth from "../../../contexts/useAuth";
import { fetchCommunityPredictionRanking } from "../../../services/communityRanking";
import { getPredictionBadgeMeta } from "../../../utils/predictionBadge";
import CommunitySubNav from "../components/CommunitySubNav/CommunitySubNav";
import styles from "./CommunityRankingPage.module.css";

const RANKING_LIMIT = 50;
const PODIUM_SIZE = 3;
const RELIABLE_RANKING_MATCH_COUNT = 20;

const formatPercent = (value) => `${Math.round(Number(value) || 0)}%`;
const formatScore = (value) => Number(value || 0).toFixed(1);

const calculateRankingScore = (correctCount, totalCount) => {
  if (totalCount <= 0) {
    return 0;
  }

  const z = 1.96;
  const accuracy = correctCount / totalCount;
  const zSquared = z * z;
  const numerator =
    accuracy +
    zSquared / (2 * totalCount) -
    z *
      Math.sqrt(
        (accuracy * (1 - accuracy) + zSquared / (4 * totalCount)) /
          totalCount,
      );
  const denominator = 1 + zSquared / totalCount;
  const reliabilityFactor = Math.min(1, totalCount / RELIABLE_RANKING_MATCH_COUNT);

  return (numerator / denominator) * reliabilityFactor * 100;
};

const sortRankers = (first, second) =>
  second.rankingScore - first.rankingScore ||
  second.accuracyRate - first.accuracyRate ||
  second.totalCount - first.totalCount ||
  second.correctCount - first.correctCount ||
  first.displayName.localeCompare(second.displayName, "ko");

const applyRankingOrder = (rows) =>
  rows
    .map(normalizeRankingRow)
    .sort(sortRankers)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));

const normalizeRankingRow = (row, index) => {
  const totalCount = Number(row.total_count ?? row.totalCount ?? 0);
  const correctCount = Number(row.correct_count ?? row.correctCount ?? 0);
  const incorrectCount = Number(row.incorrect_count ?? row.incorrectCount ?? 0);
  const accuracyRate = Number(row.accuracy_rate ?? row.accuracyRate ?? 0);
  const rankingScore = calculateRankingScore(correctCount, totalCount);
  const badge = getPredictionBadgeMeta("overall", totalCount, accuracyRate);

  return {
    id: row.user_id ?? row.userId ?? `ranking-${index}`,
    rank: Number(row.rank ?? row.ranking ?? index + 1),
    displayName:
      row.display_name ?? row.displayName ?? row.author_name ?? "FanPick 사용자",
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? "",
    totalCount,
    correctCount,
    incorrectCount,
    accuracyRate,
    rankingScore,
    badge,
  };
};

const getInitial = (name) => name.trim().charAt(0).toUpperCase() || "F";

const RankingAvatar = ({ name, src }) => (
  <span className={styles.avatar} aria-hidden="true">
    {src ? <img src={src} alt="" /> : getInitial(name)}
  </span>
);

const BadgePill = ({ badge }) => {
  return (
    <span className={styles.badgePill} data-tier={badge.tier}>
      <PredictionBadgeIcon badge={badge} size="xs" />
      {badge.name}
    </span>
  );
};

const RankingSkeleton = () => (
  <div className={styles.content}>
    <section className={styles.podiumGrid} aria-label="랭킹 로딩 중">
      {Array.from({ length: PODIUM_SIZE }, (_, index) => (
        <article className={styles.podiumCard} key={index}>
          <Skeleton.Line className={styles.skeletonPodiumRank} />
          <Skeleton.Circle className={styles.skeletonAvatar} />
          <Skeleton.Line className={styles.skeletonName} />
          <Skeleton.Line className={styles.skeletonMeta} />
          <Skeleton.Line className={styles.skeletonBar} />
        </article>
      ))}
    </section>

    <section className={styles.rankingCard}>
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton.Line className={styles.skeletonRow} key={index} />
      ))}
    </section>
  </div>
);

const CommunityRankingPage = () => {
  const { user } = useAuth();
  const [rankingRows, setRankingRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadRanking = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const ranking = await fetchCommunityPredictionRanking(RANKING_LIMIT);

        if (isMounted) {
          setRankingRows(applyRankingOrder(ranking));
        }
      } catch (error) {
        console.error("커뮤니티 랭킹 조회 오류:", error);

        if (isMounted) {
          setErrorMessage("랭킹 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRanking();

    return () => {
      isMounted = false;
    };
  }, []);

  const topRankers = useMemo(
    () => rankingRows.slice(0, PODIUM_SIZE),
    [rankingRows],
  );
  const myRank = useMemo(
    () => rankingRows.find((row) => row.id === user?.id),
    [rankingRows, user?.id],
  );

  return (
    <>
      <CommunitySubNav activeItemId="ranking" />

      <section className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <header className={styles.pageHeader}>
            <p className={styles.eyebrow}>FANPICK LEADERBOARD</p>
            <h1 className={styles.title}>RANKING</h1>
            <p className={styles.description}>
              정산된 승부예측의 적중률과 참여 수를 함께 반영합니다.
              20경기 전까지 판수 가중치를 낮게 적용합니다.
            </p>
          </header>

          {isLoading && <RankingSkeleton />}

          {!isLoading && errorMessage && (
            <EmptyState
              title={errorMessage}
              description="Supabase에 get_community_prediction_ranking 함수가 준비되어 있는지 확인해 주세요."
            />
          )}

          {!isLoading && !errorMessage && rankingRows.length === 0 && (
            <EmptyState
              title="아직 랭킹 데이터가 없습니다."
              description="정산된 승부예측이 쌓이면 여기에서 유저 랭킹을 확인할 수 있습니다."
            />
          )}

          {!isLoading && !errorMessage && rankingRows.length > 0 && (
            <div className={styles.content}>
              <section className={styles.summaryCard}>
                <div>
                  <span>MY RANK</span>
                  <strong>{myRank ? `${myRank.rank}위` : "-"}</strong>
                </div>
                <p>
                  {myRank
                    ? `${myRank.displayName} · ${myRank.totalCount}경기 · 점수 ${formatScore(myRank.rankingScore)} · 적중률 ${formatPercent(myRank.accuracyRate)}`
                    : "로그인하면 내 랭킹을 바로 확인할 수 있습니다."}
                </p>
              </section>

              <section className={styles.podiumGrid}>
                {topRankers.map((ranker) => (
                  <article
                    className={styles.podiumCard}
                    data-rank={ranker.rank}
                    key={ranker.id}
                  >
                    <span className={styles.podiumRank}>
                      {ranker.rank}
                      <small>위</small>
                    </span>

                    <RankingAvatar
                      name={ranker.displayName}
                      src={ranker.avatarUrl}
                    />

                    <strong>{ranker.displayName}</strong>
                    <BadgePill badge={ranker.badge} />

                    <div className={styles.podiumStats}>
                      <span>
                        적중률 <b>{formatPercent(ranker.accuracyRate)}</b>
                      </span>
                      <span>
                        예측 <b>{ranker.totalCount}회</b>
                      </span>
                      <span>
                        점수 <b>{formatScore(ranker.rankingScore)}</b>
                      </span>
                    </div>
                  </article>
                ))}
              </section>

              <section className={styles.rankingCard}>
                <div className={`${styles.rankingRow} ${styles.rankingHead}`}>
                  <span>순위</span>
                  <span>유저</span>
                  <span>배지</span>
                  <span>예측</span>
                  <span>정답</span>
                  <span>랭킹 점수</span>
                </div>

                {rankingRows.map((ranker) => (
                  <article
                    className={styles.rankingRow}
                    data-current={ranker.id === user?.id}
                    key={ranker.id}
                  >
                    <span className={styles.rankNumber}>{ranker.rank}</span>

                    <div className={styles.userCell}>
                      <RankingAvatar
                        name={ranker.displayName}
                        src={ranker.avatarUrl}
                      />
                      <strong>{ranker.displayName}</strong>
                    </div>

                    <BadgePill badge={ranker.badge} />

                    <span className={styles.totalCount}>
                      {ranker.totalCount}회
                    </span>
                    <span className={styles.correctCount}>
                      {ranker.correctCount}개
                    </span>
                    <strong className={styles.scoreCell}>
                      {formatScore(ranker.rankingScore)}
                      <small>{formatPercent(ranker.accuracyRate)}</small>
                    </strong>
                  </article>
                ))}
              </section>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default CommunityRankingPage;
