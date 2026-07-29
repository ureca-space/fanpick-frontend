import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Button from "../../../../components/Button/Button";
import EmptyState from "../../../../components/EmptyState/EmptyState";
import FanPickDialog from "../../../../components/FanPickDialog/FanPickDialog";
import MatchFilter from "../../../../components/MatchFilter/MatchFilter";
import Skeleton from "../../../../components/Skeleton/Skeleton";
import { getTeamInfo } from "../../../../constants/teamInfo";
import useAuth from "../../../../contexts/useAuth";
import { supabase } from "../../../../lib/supabase";
import {
  fetchMatchPredictionStats,
  fetchMyPredictionSelections,
  markPredictedMatches,
} from "../../../../services/predictionApi";
import { subscribeToMatchChanges } from "../../../../services/matchRealtime";
import {
  createPredictionLocation,
  createPredictionPath,
} from "../../../../utils/predictionPath";
import { createMatchDateTime, isFutureMatch } from "../../../../utils/matchStatus";
import styles from "./HotMatchSection.module.css";

const FILTERS = [
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "esports", label: "LOL" },
];

const padNumber = (number) => String(number).padStart(2, "0");
const normalizeTeamCode = (teamCode) => teamCode?.trim().toUpperCase() ?? "";
const HOT_MATCH_REFRESH_DEBOUNCE_MS = 500;

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());

  return `${year}-${month}-${day}`;
};

const formatMatchDate = (dateKey) => {
  if (!dateKey) return "미정";

  const [, month, day] = dateKey.split("-");

  return `${month}.${day}`;
};

const formatHotMatchLeague = (league) => {
  const leagueText = String(league ?? "").trim();
  const kLeagueMatch = leagueText.toUpperCase().match(/^K\s*LEAGUE\s*([12])$/);

  if (kLeagueMatch) {
    return `K리그${kLeagueMatch[1]}`;
  }

  return leagueText;
};

const createPredictionStatsByMatchId = (predictionStats) =>
  new Map(
    predictionStats.map((stat) => [
      String(stat.match_id),
      {
        awayRate: Number(stat.away_rate ?? 50),
        homeRate: Number(stat.home_rate ?? 50),
        participants: Number(stat.participant_count ?? 0),
      },
    ]),
  );

const normalizeHotMatch = (match, predictionStats) => ({
  id: match.external_id ?? `match-${match.id}`,
  databaseId: match.id,
  sport: match.sport,
  league: formatHotMatchLeague(match.league),

  date: formatMatchDate(match.match_date),
  time: match.match_time?.slice(0, 5) ?? "미정",

  homeTeamCode: match.home_team_code,
  awayTeamCode: match.away_team_code,

  homeTeam: getTeamInfo(match.home_team_code, match.sport),
  awayTeam: getTeamInfo(match.away_team_code, match.sport),

  status: match.status,
  venue: match.venue,
  broadcast: match.broadcast,
  participants: predictionStats?.participants ?? 0,
  homeRate: predictionStats?.homeRate ?? 50,
  awayRate: predictionStats?.awayRate ?? 50,
});

const fetchHotMatch = async (sport, now, predictionStatsByMatchId) => {
  const todayKey = formatDateKey(now);

  const { data, error } = await supabase
    .from("matches")
    .select(
      `
        id,
        external_id,
        sport,
        league,
        match_date,
        match_time,
        home_team_code,
        away_team_code,
        status,
        venue,
        broadcast
      `,
    )
    .eq("sport", sport)
    .in("status", ["scheduled", "live", "finished"])
    .gte("match_date", todayKey)
    .order("match_date", {
      ascending: true,
    })
    .order("match_time", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  const hotMatchCandidate = (data ?? [])
    .map((match) => {
      const matchDateTime = createMatchDateTime(
        match.match_date,
        match.match_time,
      );
      const stats = predictionStatsByMatchId.get(String(match.id));

      return {
        match,
        matchDateTime,
        participants: stats?.participants ?? 0,
        stats,
      };
    })
    .filter(
      ({ match, matchDateTime }) =>
        match.home_team_code &&
        match.away_team_code &&
        matchDateTime !== null &&
        isFutureMatch(
          {
            matchDate: match.match_date,
            matchTime: match.match_time,
          },
          now.getTime(),
        ),
    )
    .sort(
      (current, next) =>
        next.participants - current.participants ||
        current.matchDateTime - next.matchDateTime,
    )[0];

  return hotMatchCandidate
    ? normalizeHotMatch(hotMatchCandidate.match, hotMatchCandidate.stats)
    : null;
};

const HotMatchSkeleton = () => (
  <article
    className={`${styles.hotMatch} ${styles.hotMatchSkeleton}`}
    aria-label="핫매치 로딩 중"
  >
    <div className={styles.teamColumn}>
      <div className={`${styles.teamCard} ${styles.skeletonTeamCard}`}>
        <div className={styles.logoBox}>
          <Skeleton.Circle className={styles.skeletonHotLogo} />
        </div>

        <div className={styles.teamNameBox}>
          <Skeleton.Line className={styles.skeletonHotTeamName} />
        </div>
      </div>

      <Skeleton.Line className={styles.skeletonSelectButton} />
    </div>

    <div className={styles.matchInfo}>
      <Skeleton.Line className={styles.skeletonHotLeague} />
      <Skeleton.Line className={styles.skeletonHotVs} />

      <div className={styles.schedule}>
        <Skeleton.Line className={styles.skeletonHotDate} />
        <Skeleton.Line className={styles.skeletonHotTime} />
        <Skeleton.Line className={styles.skeletonHotParticipants} />
      </div>
    </div>

    <div className={styles.teamColumn}>
      <div className={`${styles.teamCard} ${styles.skeletonTeamCard}`}>
        <div className={styles.logoBox}>
          <Skeleton.Circle className={styles.skeletonHotLogo} />
        </div>

        <div className={styles.teamNameBox}>
          <Skeleton.Line className={styles.skeletonHotTeamName} />
        </div>
      </div>

      <Skeleton.Line className={styles.skeletonSelectButton} />
    </div>
  </article>
);

const HotMatchSection = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isAuthLoading } = useAuth();
  const userId = user?.id || "";

  const [hotMatches, setHotMatches] = useState({});
  const [activeFilter, setActiveFilter] = useState("baseball");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);

  const hotMatch = hotMatches[activeFilter] ?? null;
  const selectedTeamCode =
    hotMatch?.myPrediction?.selectedTeamCode ?? "";
  const isHotMatchPredicted = Boolean(hotMatch?.isPredicted);
  const isHomeSelected =
    selectedTeamCode === normalizeTeamCode(hotMatch?.homeTeamCode);
  const isAwaySelected =
    selectedTeamCode === normalizeTeamCode(hotMatch?.awayTeamCode);
  const voteButtonLabel = isHotMatchPredicted ? "투표완료" : "투표하기";

  useEffect(() => {
    let isMounted = true;

    const loadHotMatches = async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setIsLoading(true);
          setLoadError("");
        }

        const now = new Date();
        const predictionStatsByMatchId = createPredictionStatsByMatchId(
          await fetchMatchPredictionStats(),
        );

        const results = await Promise.all(
          FILTERS.map(async ({ id }) => {
            const match = await fetchHotMatch(
              id,
              now,
              predictionStatsByMatchId,
            );

            return [id, match];
          }),
        );

        if (!isMounted) return;

        const nextHotMatches = Object.fromEntries(results);
        const availableHotMatches = Object.values(nextHotMatches).filter(Boolean);
        const myPredictions = userId
          ? await fetchMyPredictionSelections(
              userId,
              availableHotMatches.map((match) => match.databaseId),
            ).catch((error) => {
              console.error("핫매치 예측 여부 조회 실패", error);
              return [];
            })
          : [];
        const markedHotMatches = markPredictedMatches(
          availableHotMatches,
          myPredictions,
        );
        const markedHotMatchesById = new Map(
          markedHotMatches.map((match) => [match.databaseId, match]),
        );
        const nextHotMatchesWithPredictions = Object.fromEntries(
          Object.entries(nextHotMatches).map(([sport, match]) => [
            sport,
            match ? markedHotMatchesById.get(match.databaseId) ?? match : null,
          ]),
        );

        setHotMatches(nextHotMatchesWithPredictions);

        setActiveFilter((previousFilter) => {
          if (nextHotMatchesWithPredictions[previousFilter]) {
            return previousFilter;
          }

          const firstAvailableFilter = FILTERS.find(
            ({ id }) => nextHotMatchesWithPredictions[id],
          );

          return firstAvailableFilter?.id ?? previousFilter;
        });
      } catch (error) {
        console.error("핫매치 불러오기 실패", error);

        if (isMounted && showLoading) {
          setLoadError("핫매치를 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted && showLoading) {
          setIsLoading(false);
        }
      }
    };

    loadHotMatches();

    const unsubscribeMatches = subscribeToMatchChanges({
      channelName: "home-hot-matches",
      onChange: () => loadHotMatches({ showLoading: false }),
      shouldHandlePayload: ({ new: nextMatch }) =>
        !nextMatch?.sport || FILTERS.some(({ id }) => id === nextMatch.sport),
    });
    let predictionRefreshTimerId = null;
    const schedulePredictionRefresh = () => {
      if (predictionRefreshTimerId) {
        window.clearTimeout(predictionRefreshTimerId);
      }

      predictionRefreshTimerId = window.setTimeout(() => {
        loadHotMatches({ showLoading: false });
      }, HOT_MATCH_REFRESH_DEBOUNCE_MS);
    };
    const predictionChannel = supabase
      .channel("home-hot-match-predictions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "predictions",
        },
        schedulePredictionRefresh,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("핫매치 예측 실시간 구독 연결에 실패했습니다.");
        }
      });

    return () => {
      isMounted = false;
      unsubscribeMatches();

      if (predictionRefreshTimerId) {
        window.clearTimeout(predictionRefreshTimerId);
      }

      supabase.removeChannel(predictionChannel);
    };
  }, [userId]);

  const handleVoteClick = (selectedTeamCode) => {
    if (isAuthLoading || !hotMatch || hotMatch.isPredicted) return;

    const predictionMatchId = hotMatch.databaseId ?? hotMatch.id;
    const predictionPath = createPredictionPath({
      matchId: predictionMatchId,
      teamCode: selectedTeamCode,
    });

    if (!isLoggedIn) {
      setPendingVote({
        matchId: predictionMatchId,
        selectedTeamCode,
      });

      setIsDialogOpen(true);
      return;
    }

    navigate(predictionPath);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setPendingVote(null);
  };

  const handleMoveToLogin = () => {
    if (!pendingVote) return;

    setIsDialogOpen(false);
    setPendingVote(null);

    navigate("/login", {
      state: {
        from: createPredictionLocation({
          matchId: pendingVote.matchId,
          teamCode: pendingVote.selectedTeamCode,
        }),
      },
    });
  };

  return (
    <>
      <section className={`section ${styles.hotMatchSection}`}>
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 className={styles.title}>HOT MATCH</h2>

            <p className={styles.description}>
              다가오는 경기의 승리 팀을 선택해 보세요.
            </p>
          </header>

          <MatchFilter
            filters={FILTERS}
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />

          <div className={styles.content}>
            {isLoading ? (
              <HotMatchSkeleton />
            ) : loadError ? (
              <EmptyState
                title={loadError}
                description="잠시 후 다시 시도해 주세요."
              />
            ) : hotMatch ? (
              <article className={styles.hotMatch}>
                <div className={styles.teamColumn}>
                  <div
                    className={`${styles.teamCard} ${
                      isHomeSelected ? styles.selectedTeamCard : ""
                    }`}
                  >
                    <div className={styles.logoBox}>
                      {hotMatch.homeTeam.logo ? (
                        <img
                          src={hotMatch.homeTeam.logo}
                          alt={`${hotMatch.homeTeam.name} 로고`}
                        />
                      ) : (
                        <span>{hotMatch.homeTeam.shortName}</span>
                      )}
                    </div>

                    <div className={styles.teamNameBox}>
                      <strong className={styles.teamName}>
                        {hotMatch.homeTeam.shortName}
                      </strong>
                    </div>
                  </div>

                  <Button
                    className={styles.selectButton}
                    disabled={isAuthLoading || isHotMatchPredicted}
                    onClick={() => handleVoteClick(hotMatch.homeTeamCode)}
                    size="sm"
                    variant="outline"
                  >
                    {voteButtonLabel}
                  </Button>
                </div>

                <div className={styles.matchInfo}>
                  <span className={styles.league}>{hotMatch.league}</span>

                  <strong className={styles.vs}>VS</strong>

                  <div className={styles.schedule}>
                    <span className={styles.date}>{hotMatch.date}</span>

                    <span className={styles.time}>{hotMatch.time}</span>

                    <span className={styles.participants}>
                      {hotMatch.participants.toLocaleString()}명 참여
                    </span>
                  </div>
                </div>

                <div className={styles.teamColumn}>
                  <div
                    className={`${styles.teamCard} ${
                      isAwaySelected ? styles.selectedTeamCard : ""
                    }`}
                  >
                    <div className={styles.logoBox}>
                      {hotMatch.awayTeam.logo ? (
                        <img
                          src={hotMatch.awayTeam.logo}
                          alt={`${hotMatch.awayTeam.name} 로고`}
                        />
                      ) : (
                        <span>{hotMatch.awayTeam.shortName}</span>
                      )}
                    </div>

                    <div className={styles.teamNameBox}>
                      <strong className={styles.teamName}>
                        {hotMatch.awayTeam.shortName}
                      </strong>
                    </div>
                  </div>

                  <Button
                    className={styles.selectButton}
                    disabled={isAuthLoading || isHotMatchPredicted}
                    onClick={() => handleVoteClick(hotMatch.awayTeamCode)}
                    size="sm"
                    variant="outline"
                  >
                    {voteButtonLabel}
                  </Button>
                </div>
              </article>
            ) : (
              <EmptyState
                title="예정된 주요 경기가 없습니다."
                description="필터를 바꾸거나 전체 경기 일정을 확인해 주세요."
              />
            )}
          </div>
        </div>
      </section>

      <FanPickDialog
        isOpen={isDialogOpen}
        title="로그인이 필요합니다"
        description="핫매치 투표에 참여하려면 먼저 로그인해 주세요."
        confirmText="로그인하기"
        cancelText="취소"
        onClose={handleCloseDialog}
        onConfirm={handleMoveToLogin}
      />
    </>
  );
};

export default HotMatchSection;
