import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button/Button";
import EmptyState from "../../components/EmptyState/EmptyState";
import FanPickDialog from "../../components/FanPickDialog/FanPickDialog";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import Skeleton from "../../components/Skeleton/Skeleton";
import useAuth from "../../contexts/useAuth";
import { getTeamInfo } from "../../constants/teamInfo.js";
import { supabase } from "../../lib/supabase.js";
import { subscribeToMatchChanges } from "../../services/matchRealtime.js";
import {
  applyPredictionStatsToMatches,
  fetchMatchPredictionStats,
  fetchMyPredictionSelections,
  markPredictedMatches,
} from "../../services/predictionApi.js";
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
import { TEAM_BY_ID, TEAM_LEAGUE_LABELS } from "./data/teams.js";
import styles from "./TeamDetailPage.module.css";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const UPCOMING_MATCH_LIMIT = 6;
const ROSTER_PAGE_SIZE = 8;
const MATCH_STATUS_LABELS = {
  live: "LIVE",
  finished: "종료",
  cancelled: "취소",
  postponed: "연기",
};
const SCORE_VISIBLE_STATUSES = new Set(["live", "finished"]);

const padNumber = (number) => String(number).padStart(2, "0");

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());

  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day, 12);
};

const getAverageRating = (ratings) => {
  if (!ratings.length) {
    return 0;
  }

  const total = ratings.reduce((sum, rating) => sum + rating.score, 0);

  return Number((total / ratings.length).toFixed(1));
};

const normalizeTeamCode = (teamCode) => teamCode?.trim().toUpperCase() || "";

const isTeamMatch = (match, team) => {
  const homeTeamCode = normalizeTeamCode(match.home_team_code);
  const awayTeamCode = normalizeTeamCode(match.away_team_code);

  return team.matchCodes.some(
    (teamCode) => teamCode === homeTeamCode || teamCode === awayTeamCode,
  );
};

const normalizeMatch = (match) => {
  const matchDate = parseDateKey(match.match_date);

  return {
    id: match.external_id ?? `match-${match.id}`,
    databaseId: match.id,
    date: `${padNumber(matchDate.getMonth() + 1)}.${padNumber(
      matchDate.getDate(),
    )}`,
    day: DAY_LABELS[matchDate.getDay()],
    time: match.match_time?.slice(0, 5) || "미정",
    league: match.league,
    status: match.status,
    score: match.score,
    hasScore:
      SCORE_VISIBLE_STATUSES.has(match.status) && Boolean(match.score),
    homeTeam: getTeamInfo(match.home_team_code, match.sport),
    awayTeam: getTeamInfo(match.away_team_code, match.sport),
    homeVotes: 50,
    awayVotes: 50,
  };
};

const getPredictionRates = (match) => {
  const homeVotes = Number(match.homeVotes ?? 50);
  const awayVotes = Number(match.awayVotes ?? 50);
  const totalVotes = homeVotes + awayVotes;

  if (
    !Number.isFinite(homeVotes) ||
    !Number.isFinite(awayVotes) ||
    totalVotes <= 0
  ) {
    return {
      homeRate: 50,
      awayRate: 50,
    };
  }

  const homeRate = Math.round((homeVotes / totalVotes) * 100);

  return {
    homeRate,
    awayRate: 100 - homeRate,
  };
};

const TeamLogo = ({ team, className = "" }) => {
  const [hasError, setHasError] = useState(false);

  if (!team.logo || hasError) {
    return (
      <div className={`${styles.logoFallback} ${className}`} aria-hidden="true">
        {team.shortName}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={team.logo}
      alt={`${team.name} 로고`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

const TeamBadgeLogo = ({ team }) => {
  const [hasError, setHasError] = useState(false);

  if (!team.logo || hasError) {
    return (
      <span className={styles.matchLogoFallback} aria-hidden="true">
        {team.shortName}
      </span>
    );
  }

  return (
    <img
      className={styles.matchLogo}
      src={team.logo}
      alt={`${team.name} 로고`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

const TeamMatchCardSkeleton = () => (
  <article
    className={`${styles.matchCard} ${styles.matchSkeletonCard}`}
    aria-label="팀 경기 일정 로딩 중"
  >
    <div className={styles.matchDate}>
      <Skeleton.Line className={styles.skeletonMatchDate} />
      <Skeleton.Line className={styles.skeletonMatchTime} />
    </div>

    <div className={styles.matchTeams}>
      <div>
        <Skeleton.Circle className={styles.skeletonMatchLogo} />
        <Skeleton.Line className={styles.skeletonMatchTeamName} />
      </div>

      <Skeleton.Line className={styles.skeletonMatchVs} />

      <div>
        <Skeleton.Circle className={styles.skeletonMatchLogo} />
        <Skeleton.Line className={styles.skeletonMatchTeamName} />
      </div>
    </div>

    <div className={styles.matchPrediction}>
      <div className={styles.predictionLabels}>
        <Skeleton.Line className={styles.skeletonPredictionLabel} />
        <Skeleton.Line className={styles.skeletonPredictionLabel} />
      </div>

      <Skeleton.Line className={styles.skeletonPredictionBar} />
    </div>

    <div className={styles.matchMeta}>
      <Skeleton.Line className={styles.skeletonMatchLeague} />
      <Skeleton.Line className={styles.skeletonMatchStatus} />
    </div>

    <Skeleton.Line className={styles.skeletonMatchButton} />
  </article>
);

const MemberPhoto = ({ member }) => {
  const [activePhoto, setActivePhoto] = useState(member.photo);

  const handlePhotoError = () => {
    if (activePhoto !== member.fallbackPhoto) {
      setActivePhoto(member.fallbackPhoto);
    }
  };

  return (
    <img
      className={styles.memberPhoto}
      src={activePhoto}
      alt={`${member.name} 프로필 이미지`}
      loading="lazy"
      onError={handlePhotoError}
    />
  );
};

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
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState("");
  const [rosterPageState, setRosterPageState] = useState({
    teamId: "",
    page: 0,
  });

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

    const loadTeamMatches = async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setIsMatchesLoading(true);
          setMatchesError("");
        }

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
              away_team_code,
              home_team_code,
              score,
              status
            `,
          )
          .eq("sport", team.matchSport)
          .gte("match_date", formatDateKey(new Date()))
          .order("match_date", { ascending: true })
          .order("match_time", { ascending: true })
          .limit(120);

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const nextMatches = (data || [])
          .filter(
            (match) =>
              match.match_date &&
              match.home_team_code &&
              match.away_team_code &&
              !["cancelled", "postponed"].includes(match.status) &&
              isTeamMatch(match, team),
          )
          .map(normalizeMatch)
          .slice(0, UPCOMING_MATCH_LIMIT);

        const [predictionStats, myPredictions] = await Promise.all([
          fetchMatchPredictionStats(),
          userId
            ? fetchMyPredictionSelections(
                userId,
                nextMatches.map((match) => match.databaseId),
              ).catch((error) => {
                console.error("팀 경기 예측 여부 조회 실패", error);
                return [];
              })
            : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        setMatches(
          markPredictedMatches(
            applyPredictionStatsToMatches(nextMatches, predictionStats),
            myPredictions,
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

    return () => {
      isMounted = false;
      unsubscribe();
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
      <div className={`container ${styles.inner}`}>
        <Link className={styles.backLink} to="/teams">
          TEAMS
        </Link>

        <section className={styles.heroSection}>
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
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>멤버</span>
            <h2>대표 로스터</h2>
          </div>

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
              {matches.map((match) => {
                const { homeRate, awayRate } = getPredictionRates(match);

                return (
                  <article key={match.id} className={styles.matchCard}>
                    <div className={styles.matchDate}>
                      <strong>{match.date}</strong>
                      <span>{match.day} · {match.time}</span>
                    </div>

                    <div className={styles.matchTeams}>
                      <div>
                        <TeamBadgeLogo team={match.homeTeam} />
                        <span>{match.homeTeam.name}</span>
                      </div>

                      <strong
                        className={match.hasScore ? styles.matchScore : ""}
                      >
                        {match.hasScore
                          ? match.score.replace(":", " : ")
                          : "VS"}
                      </strong>

                      <div>
                        <TeamBadgeLogo team={match.awayTeam} />
                        <span>{match.awayTeam.name}</span>
                      </div>
                    </div>

                    <div className={styles.matchPrediction}>
                      <div className={styles.predictionLabels}>
                        <span>
                          {match.homeTeam.name}
                          <strong>{homeRate}%</strong>
                        </span>

                        <span>
                          <strong>{awayRate}%</strong>
                          {match.awayTeam.name}
                        </span>
                      </div>

                      <div className={styles.predictionBar}>
                        <span
                          className={styles.homePredictionBar}
                          style={{ width: `${homeRate}%` }}
                        />

                        <span
                          className={styles.awayPredictionBar}
                          style={{ width: `${awayRate}%` }}
                        />
                      </div>
                    </div>

                    <div className={styles.matchMeta}>
                      <span className={styles.matchLeague}>{match.league}</span>

                      {MATCH_STATUS_LABELS[match.status] && (
                        <span
                          className={`${styles.matchStatus} ${
                            match.status === "live"
                              ? styles.matchStatusLive
                              : ""
                          }`}
                        >
                          {MATCH_STATUS_LABELS[match.status]}
                        </span>
                      )}
                    </div>

                    <div className={styles.matchAction}>
                      <Button
                        disabled={isAuthLoading || match.isPredicted}
                        fullWidth
                        onClick={() =>
                          handleMatchVoteClick(match.databaseId ?? match.id)
                        }
                        size="sm"
                        variant="outline"
                      >
                        {match.isPredicted ? "투표완료" : "투표하기"}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="등록된 다가오는 경기 일정이 없습니다."
              description="새 일정이 업데이트되면 이곳에 표시됩니다."
            />
          )}
        </section>

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
