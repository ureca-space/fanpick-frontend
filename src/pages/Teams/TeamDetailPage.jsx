import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import Button from "../../components/Button/Button";
import EmptyState from "../../components/EmptyState/EmptyState";
import FanPickDialog from "../../components/FanPickDialog/FanPickDialog";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import PredictionResultMatchCard from "../../components/PredictionResultMatchCard/PredictionResultMatchCard";
import Skeleton from "../../components/Skeleton/Skeleton";
import StandingsTable from "../../components/StandingsTable/StandingsTable";
import SubNav from "../../components/SubNav/SubNav";
import useAuth from "../../contexts/useAuth";
import { supabase } from "../../lib/supabase.js";
import { subscribeToMatchChanges } from "../../services/matchRealtime.js";
import {
  applyPredictionStatsToMatches,
  fetchMatchPredictionStats,
  fetchMyPredictionSelections,
  markPredictedMatches,
} from "../../services/predictionApi.js";
import { fetchTeamStandings } from "../../services/teamStandings.js";
import {
  createPredictionLocation,
  createPredictionPath,
} from "../../utils/predictionPath.js";
import {
  FAVORITE_TEAMS_CHANGED_EVENT,
  fetchFavoriteTeamIds,
  getFavoriteTeamIds,
  toggleFavoriteTeamId,
} from "../../services/favoriteTeams.js";
import { FEATURED_TEAMS, TEAM_BY_ID, TEAM_LEAGUE_LABELS } from "./data/teams.js";
import MemberPhoto from "./components/MemberPhoto";
import TeamDetailMatchCard from "./components/TeamDetailMatchCard";
import TeamLogo from "./components/TeamLogo";
import TeamMatchCardSkeleton from "./components/TeamMatchCardSkeleton";
import {
  CLOSED_MATCH_STATUSES,
  FINISHED_MATCH_LIMIT,
  PREDICTION_RESULT_LIMIT,
  REALTIME_REFRESH_DEBOUNCE_MS,
  ROSTER_PAGE_SIZE,
  TEAM_DETAIL_NAV_ITEMS,
  UPCOMING_MATCH_LIMIT,
  compareMatchesAscending,
  compareMatchesDescending,
  createLeagueStandings,
  createTeamMatchFilter,
  formatDateKey,
  getAverageRating,
  getStandingSourceLabel,
  getStandingSummaryText,
  isResultMatch,
  isStandingTeamActive,
  isTeamMatch,
  normalizeMatch,
  normalizeOfficialStandings,
} from "./teamDetailUtils";
import styles from "./TeamDetailPage.module.css";

const TeamDetailPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, isAuthLoading } = useAuth();

  const team = TEAM_BY_ID.get(teamId);
  const userId = user?.id || "";

  const [favoriteTeamState, setFavoriteTeamState] = useState({
    userId: "",
    teamIds: [],
  });
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [loginDialogState, setLoginDialogState] = useState({
    isOpen: false,
    type: "favorite",
    matchId: "",
  });
  const [matches, setMatches] = useState([]);
  const [resultMatches, setResultMatches] = useState([]);
  const [predictionResultMatches, setPredictionResultMatches] = useState([]);
  const [officialStandings, setOfficialStandings] = useState([]);
  const [standings, setStandings] = useState([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState("");
  const [rosterPageState, setRosterPageState] = useState({
    teamId: "",
    page: 0,
  });
  const [activeSectionId, setActiveSectionId] = useState(
    TEAM_DETAIL_NAV_ITEMS[0].id,
  );

  const favoriteTeamIds =
    userId && favoriteTeamState.userId === userId
      ? favoriteTeamState.teamIds
      : [];

  const isFavorite = team ? favoriteTeamIds.includes(team.id) : false;
  const averageRating = team ? getAverageRating(team.ratings) : 0;
  const totalRosterPages = team
    ? Math.ceil(team.members.length / ROSTER_PAGE_SIZE)
    : 0;
  const rosterPage =
    rosterPageState.teamId === teamId ? rosterPageState.page : 0;
  const currentRosterPage = Math.min(
    rosterPage,
    Math.max(totalRosterPages - 1, 0),
  );
  const visibleMembers = team
    ? team.members.slice(
        currentRosterPage * ROSTER_PAGE_SIZE,
        (currentRosterPage + 1) * ROSTER_PAGE_SIZE,
      )
    : [];
  const hasUsableOfficialStandings = officialStandings.some(
    (standingRow) =>
      standingRow.games > 0 ||
      standingRow.wins > 0 ||
      standingRow.draws > 0 ||
      standingRow.losses > 0,
  );
  const visibleStandings =
    hasUsableOfficialStandings ? officialStandings : standings;
  const isOfficialStanding = hasUsableOfficialStandings;
  const teamStanding = visibleStandings.find((standingRow) =>
    isStandingTeamActive(standingRow, team),
  );
  const hasStandingData = visibleStandings.some(
    (standingRow) => standingRow.games > 0,
  );

  useEffect(() => {
    if (!team || !userId) {
      return undefined;
    }

    let isMounted = true;

    const loadFavoriteTeamIds = async () => {
      const teamIds = await fetchFavoriteTeamIds(userId);

      if (isMounted) {
        setFavoriteTeamState({
          userId,
          teamIds,
        });
      }
    };

    const syncFavoriteTeams = (event) => {
      if (event.detail?.userId && event.detail.userId !== userId) {
        return;
      }

      setFavoriteTeamState({
        userId,
        teamIds: Array.isArray(event.detail?.teamIds)
          ? event.detail.teamIds
          : getFavoriteTeamIds(userId),
      });
    };

    loadFavoriteTeamIds();
    window.addEventListener(FAVORITE_TEAMS_CHANGED_EVENT, syncFavoriteTeams);
    window.addEventListener("storage", syncFavoriteTeams);

    return () => {
      isMounted = false;
      window.removeEventListener(
        FAVORITE_TEAMS_CHANGED_EVENT,
        syncFavoriteTeams,
      );
      window.removeEventListener("storage", syncFavoriteTeams);
    };
  }, [team, userId]);

  useEffect(() => {
    if (!team) {
      return undefined;
    }

    let isMounted = true;
    let standingsRefreshTimerId = null;

    const loadOfficialStandings = async () => {
      try {
        const nextStandings = await fetchTeamStandings(team.league);

        if (isMounted) {
          setOfficialStandings(normalizeOfficialStandings(nextStandings));
        }
      } catch (error) {
        console.warn(
          "공식 순위 조회 실패. 경기 결과 기반 순위를 사용합니다.",
          error,
        );

        if (isMounted) {
          setOfficialStandings([]);
        }
      }
    };

    const scheduleStandingsRefresh = () => {
      if (standingsRefreshTimerId) {
        globalThis.clearTimeout(standingsRefreshTimerId);
      }

      standingsRefreshTimerId = globalThis.setTimeout(() => {
        loadOfficialStandings();
      }, REALTIME_REFRESH_DEBOUNCE_MS);
    };

    loadOfficialStandings();

    const standingsChannel = supabase
      .channel(`team-detail-standings-${team.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_standings",
          filter: `league_id=eq.${team.league}`,
        },
        scheduleStandingsRefresh,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("팀 순위 실시간 구독 연결에 실패했습니다.");
        }
      });

    return () => {
      isMounted = false;

      if (standingsRefreshTimerId) {
        globalThis.clearTimeout(standingsRefreshTimerId);
      }

      supabase.removeChannel(standingsChannel);
    };
  }, [team]);

  useEffect(() => {
    if (!team) {
      return undefined;
    }

    let isMounted = true;
    let teamMatchIds = new Set();
    let predictionRefreshTimerId = null;

    const loadTeamMatches = async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setIsMatchesLoading(true);
          setMatchesError("");
        }

        const teamMatchFilter = createTeamMatchFilter(team);
        let matchQuery = supabase
          .from("matches")
          .select(
            `
              id,
              external_id,
              sport,
              league,
              match_date,
              match_time,
              away_team_code,
              home_team_code,
              score,
              status,
              venue
            `,
          )
          .eq("sport", team.matchSport)
          .order("match_date", { ascending: true })
          .order("match_time", { ascending: true });

        if (teamMatchFilter) {
          matchQuery = matchQuery.or(teamMatchFilter);
        }

        const { data, error } = await matchQuery.limit(500);

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const normalizedMatches = (data || [])
          .filter(
            (match) =>
              match.match_date &&
              match.home_team_code &&
              match.away_team_code,
          )
          .map(normalizeMatch);
        const nextTeamMatches = normalizedMatches.filter((match) =>
          isTeamMatch(match, team),
        );
        teamMatchIds = new Set(
          nextTeamMatches.map((match) => String(match.databaseId)),
        );
        const leagueStandingTeams = FEATURED_TEAMS.filter(
          (featuredTeam) => featuredTeam.league === team.league,
        );

        const [predictionStats, myPredictions] = await Promise.all([
          fetchMatchPredictionStats(),
          userId
            ? fetchMyPredictionSelections(
                userId,
                nextTeamMatches.map((match) => match.databaseId),
              ).catch((error) => {
                console.error("팀 경기 예측 여부 조회 실패", error);
                return [];
              })
            : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        const enrichedTeamMatches = markPredictedMatches(
          applyPredictionStatsToMatches(nextTeamMatches, predictionStats),
          myPredictions,
        );
        const todayKey = formatDateKey(new Date());
        const upcomingMatches = enrichedTeamMatches
          .filter(
            (match) =>
              match.status !== "finished" &&
              !CLOSED_MATCH_STATUSES.has(match.status) &&
              match.dateKey >= todayKey,
          )
          .sort(compareMatchesAscending)
          .slice(0, UPCOMING_MATCH_LIMIT);
        const finishedMatches = enrichedTeamMatches
          .filter(isResultMatch)
          .sort(compareMatchesDescending)
          .slice(0, FINISHED_MATCH_LIMIT);
        const nextPredictionResultMatches = enrichedTeamMatches
          .filter((match) => isResultMatch(match) && match.participants > 0)
          .sort(compareMatchesDescending)
          .slice(0, PREDICTION_RESULT_LIMIT);

        setMatches(upcomingMatches);
        setResultMatches(finishedMatches);
        setPredictionResultMatches(nextPredictionResultMatches);
        setStandings(
          createLeagueStandings(
            normalizedMatches,
            leagueStandingTeams,
            team.league,
          ),
        );
      } catch (error) {
        console.error("팀 경기 일정 불러오기 실패", error);

        if (isMounted && showLoading) {
          setMatchesError("경기 일정을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted && showLoading) {
          setIsMatchesLoading(false);
        }
      }
    };
    const schedulePredictionRefresh = () => {
      if (predictionRefreshTimerId) {
        globalThis.clearTimeout(predictionRefreshTimerId);
      }

      predictionRefreshTimerId = globalThis.setTimeout(() => {
        loadTeamMatches({ showLoading: false });
      }, REALTIME_REFRESH_DEBOUNCE_MS);
    };

    loadTeamMatches();

    const unsubscribe = subscribeToMatchChanges({
      channelName: `team-detail-matches-${team.id}`,
      onChange: () => loadTeamMatches({ showLoading: false }),
      shouldHandlePayload: ({ new: nextMatch }) => {
        if (!nextMatch?.sport) {
          return true;
        }

        return (
          nextMatch.sport === team.matchSport && isTeamMatch(nextMatch, team)
        );
      },
    });
    const predictionChannel = supabase
      .channel(`team-detail-predictions-${team.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "predictions",
        },
        ({ new: nextPrediction, old: previousPrediction }) => {
          const matchId = String(
            nextPrediction?.match_id ?? previousPrediction?.match_id ?? "",
          );

          if (!matchId || teamMatchIds.has(matchId)) {
            schedulePredictionRefresh();
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("팀 예측 결과 실시간 구독 연결에 실패했습니다.");
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();

      if (predictionRefreshTimerId) {
        globalThis.clearTimeout(predictionRefreshTimerId);
      }

      supabase.removeChannel(predictionChannel);
    };
  }, [team, userId]);

  const sortedRatings = team
    ? [...team.ratings].sort((first, second) => second.score - first.score)
    : [];

  if (!team) {
    return <Navigate to="/teams" replace />;
  }

  const handleFavoriteClick = async () => {
    if (isAuthLoading) {
      return;
    }

    if (!isLoggedIn || !userId) {
      setLoginDialogState({
        isOpen: true,
        type: "favorite",
        matchId: "",
      });
      return;
    }

    const nextTeamIds = isFavorite
      ? favoriteTeamIds.filter((favoriteTeamId) => favoriteTeamId !== team.id)
      : [...favoriteTeamIds, team.id];

    setIsSavingFavorite(true);
    setFavoriteTeamState({
      userId,
      teamIds: nextTeamIds,
    });

    try {
      const savedTeamIds = await toggleFavoriteTeamId(
        userId,
        team.id,
        favoriteTeamIds,
      );

      setFavoriteTeamState({
        userId,
        teamIds: savedTeamIds,
      });
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const handleMatchVoteClick = (matchId) => {
    if (isAuthLoading) {
      return;
    }

    if (!isLoggedIn) {
      setLoginDialogState({
        isOpen: true,
        type: "prediction",
        matchId,
      });
      return;
    }

    navigate(createPredictionPath({ matchId }));
  };

  const handleMoveRosterPage = (direction) => {
    setRosterPageState((currentState) => {
      const currentPage =
        currentState.teamId === teamId ? currentState.page : 0;
      const nextPage = Math.min(
        Math.max(currentPage + direction, 0),
        Math.max(totalRosterPages - 1, 0),
      );

      return {
        teamId,
        page: nextPage,
      };
    });
  };

  const handleSubNavItemClick = (itemId) => {
    setActiveSectionId(itemId);

    window.requestAnimationFrame(() => {
      document.getElementById("team-detail-content")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleMoveToLogin = () => {
    const from =
      loginDialogState.type === "prediction"
        ? createPredictionLocation({ matchId: loginDialogState.matchId })
        : {
            pathname: `/teams/${team.id}`,
            search: "",
            hash: "",
          };

    setLoginDialogState((currentState) => ({
      ...currentState,
      isOpen: false,
    }));

    navigate("/login", {
      state: { from },
    });
  };

  return (
    <main className={styles.detailPage}>
      <SubNav
        activeItemId={activeSectionId}
        ariaLabel={`${team.name} 상세 메뉴`}
        items={TEAM_DETAIL_NAV_ITEMS}
        onItemClick={handleSubNavItemClick}
      />

      <div id="team-detail-content" className={`container ${styles.inner}`}>
        <Link className={styles.backLink} to="/teams">
          TEAMS
        </Link>

        {activeSectionId === "team-schedule" && (
          <>
        <section id="team-overview" className={styles.heroSection}>
          <div className={styles.logoPanel}>
            <TeamLogo className={styles.heroLogo} team={team} />
          </div>

          <div className={styles.heroContent}>
            <span className={styles.leagueLabel}>
              {TEAM_LEAGUE_LABELS[team.league]} · {team.home}
            </span>

            <h1 className={styles.title}>{team.name}</h1>

            <p className={styles.tone}>{team.tone}</p>

            <p className={styles.intro}>{team.intro}</p>

            <div className={styles.tagList}>
              {team.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <div className={styles.heroActions}>
              <Button
                className={styles.heroActionButton}
                disabled={isSavingFavorite}
                onClick={handleFavoriteClick}
                variant={isFavorite ? "secondary" : "primary"}
              >
                {isSavingFavorite
                  ? "저장 중..."
                  : isFavorite
                    ? "관심 팀 해제"
                    : "관심 팀 등록"}
              </Button>

              <Button
                className={styles.heroActionButton}
                href="#team-schedule"
                variant="outline"
              >
                경기 일정 보기
              </Button>
            </div>
          </div>

          <aside className={styles.ratingSummary}>
            <span>입덕 평점</span>
            <strong>{averageRating.toFixed(1)}</strong>
            <small>/ 5</small>
          </aside>
        </section>

        <section className={styles.contentGrid}>
          <article className={styles.entryPanel}>
            <span className={styles.sectionLabel}>입덕 포인트</span>
            <p>{team.entryPoint}</p>
          </article>

          <article className={styles.guidePanel}>
            <span className={styles.sectionLabel}>팬 가이드</span>

            <ul>
              {team.fanGuide.map((guide) => (
                <li key={guide}>{guide}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.ratingsSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>평점</span>
            <h2>입덕 체크리스트</h2>
          </div>

          <div className={styles.ratingList}>
            {sortedRatings.map((rating) => (
              <div key={rating.label} className={styles.ratingRow}>
                <div className={styles.ratingMeta}>
                  <span>{rating.label}</span>
                  <strong>
                    {rating.score}
                    <small>/5</small>
                  </strong>
                </div>

                <div className={styles.ratingTrack} aria-hidden="true">
                  <span style={{ width: `${rating.score * 20}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.membersSection}>
          <div className={`${styles.sectionHeader} ${styles.memberHeader}`}>
            <span className={styles.sectionLabel}>멤버</span>

            <div className={styles.memberHeaderActions}>
              <h2>대표 로스터</h2>

              <PaginationControls
                ariaLabel="대표 로스터 페이지 이동"
                className={styles.memberNavigation}
                currentPage={currentRosterPage}
                nextLabel="다음 대표 로스터 보기"
                onNext={() => handleMoveRosterPage(1)}
                onPrevious={() => handleMoveRosterPage(-1)}
                previousLabel="이전 대표 로스터 보기"
                totalPages={totalRosterPages}
              />
            </div>
          </div>

          <div className={styles.memberGrid}>
            {visibleMembers.map((member) => (
              <article key={member.id} className={styles.memberCard}>
                <MemberPhoto member={member} />

                <div className={styles.memberInfo}>
                  <span>{member.role}</span>
                  <strong>{member.name}</strong>
                  {member.realName && <small>{member.realName}</small>}
                  <p>{member.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="team-schedule"
          className={styles.scheduleSection}
          aria-labelledby="team-schedule-title"
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>경기 일정</span>
            <h2 id="team-schedule-title">다가오는 경기</h2>
          </div>

          {isMatchesLoading ? (
            <div className={styles.matchGrid} aria-label="팀 경기 일정 로딩 중">
              {Array.from({ length: UPCOMING_MATCH_LIMIT }, (_, index) => (
                <TeamMatchCardSkeleton key={index} />
              ))}
            </div>
          ) : matchesError ? (
            <EmptyState
              title={matchesError}
              description="잠시 후 다시 시도해 주세요."
            />
          ) : matches.length > 0 ? (
            <div className={styles.matchGrid}>
              {matches.map((match) => (
                <TeamDetailMatchCard
                  key={match.id}
                  isAuthLoading={isAuthLoading}
                  match={match}
                  onVoteClick={handleMatchVoteClick}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="등록된 다가오는 경기 일정이 없습니다."
              description="새 일정이 업데이트되면 이곳에 표시됩니다."
            />
          )}
        </section>
          </>
        )}

        {activeSectionId === "team-results" && (
          <section
            id="team-results"
            className={styles.resultsSection}
            aria-labelledby="team-results-title"
          >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>경기 결과</span>
            <h2 id="team-results-title">최근 경기 결과</h2>
          </div>

          {isMatchesLoading ? (
            <div
              className={styles.resultMatchGrid}
              aria-label="팀 경기 결과 로딩 중"
            >
              {Array.from({ length: FINISHED_MATCH_LIMIT }, (_, index) => (
                <TeamMatchCardSkeleton key={index} />
              ))}
            </div>
          ) : matchesError ? (
            <EmptyState
              title={matchesError}
              description="잠시 후 다시 시도해 주세요."
            />
          ) : resultMatches.length > 0 ? (
            <div className={styles.resultMatchGrid}>
              {resultMatches.map((match) => (
                <PredictionResultMatchCard
                  focusTeam={team}
                  key={match.id}
                  match={match}
                  showPrediction={false}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="등록된 경기 결과가 없습니다."
              description="종료된 경기가 업데이트되면 이곳에 표시됩니다."
            />
          )}
          </section>
        )}

        {activeSectionId === "team-standings" && (
          <section
            id="team-standings"
            className={styles.standingsSection}
            aria-labelledby="team-standings-title"
          >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>순위</span>
            <h2 id="team-standings-title">리그 순위</h2>
          </div>

          {isMatchesLoading ? (
            <div className={styles.standingSkeleton}>
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton.Line key={index} className={styles.skeletonStandingRow} />
              ))}
            </div>
          ) : matchesError ? (
            <EmptyState
              title={matchesError}
              description="잠시 후 다시 시도해 주세요."
            />
          ) : hasStandingData ? (
            <>
              {teamStanding && (
                <div className={styles.standingSummary}>
                  <span>현재 순위</span>
                  <strong>{teamStanding.rank}위</strong>
                  <small>{getStandingSummaryText(teamStanding, team.league)}</small>
                  {isOfficialStanding && (
                    <em>{getStandingSourceLabel(teamStanding.source)} 기준</em>
                  )}
                </div>
              )}

              <StandingsTable
                activeTeam={team}
                league={{
                  id: team.league,
                  sport: team.matchSport,
                }}
                standings={visibleStandings}
              />
            </>
          ) : (
            <EmptyState
              title="순위를 계산할 종료 경기가 없습니다."
              description="같은 리그의 종료 경기 스코어가 쌓이면 순위가 표시됩니다."
            />
          )}
          </section>
        )}

        {activeSectionId === "team-prediction-results" && (
          <section
            id="team-prediction-results"
            className={styles.predictionResultsSection}
            aria-labelledby="team-prediction-results-title"
          >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>승부 예측 결과</span>
            <h2 id="team-prediction-results-title">팬픽 예측 결과</h2>
          </div>

          {isMatchesLoading ? (
            <div
              className={styles.resultMatchGrid}
              aria-label="팀 승부 예측 결과 로딩 중"
            >
              {Array.from({ length: PREDICTION_RESULT_LIMIT }, (_, index) => (
                <TeamMatchCardSkeleton key={index} />
              ))}
            </div>
          ) : matchesError ? (
            <EmptyState
              title={matchesError}
              description="잠시 후 다시 시도해 주세요."
            />
          ) : predictionResultMatches.length > 0 ? (
            <div className={styles.resultMatchGrid}>
              {predictionResultMatches.map((match) => (
                <PredictionResultMatchCard
                  key={match.id}
                  match={match}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="승부 예측 결과가 없습니다."
              description="참여자가 있는 종료 경기의 예측 결과가 이곳에 표시됩니다."
            />
          )}
          </section>
        )}

      </div>

      <FanPickDialog
        isOpen={loginDialogState.isOpen}
        title="로그인이 필요합니다"
        description={
          loginDialogState.type === "prediction"
            ? "경기 승부 예측에 참여하려면 먼저 로그인해 주세요."
            : "관심 팀을 마이페이지에 저장하려면 먼저 로그인해 주세요."
        }
        confirmText="로그인하기"
        cancelText="취소"
        onClose={() =>
          setLoginDialogState((currentState) => ({
            ...currentState,
            isOpen: false,
          }))
        }
        onConfirm={handleMoveToLogin}
      />
    </main>
  );
};

export default TeamDetailPage;
