import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import FanPickDialog from "../../components/FanPickDialog/FanPickDialog";
import useAuth from "../../contexts/useAuth";
import { getTeamInfo } from "../../constants/teamInfo.js";
import { supabase } from "../../lib/supabase.js";
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
    id: match.external_id,
    date: `${padNumber(matchDate.getMonth() + 1)}.${padNumber(
      matchDate.getDate(),
    )}`,
    day: DAY_LABELS[matchDate.getDay()],
    time: match.match_time?.slice(0, 5) || "미정",
    league: match.league,
    status: match.status,
    score: match.score,
    homeTeam: getTeamInfo(match.home_team_code, match.sport),
    awayTeam: getTeamInfo(match.away_team_code, match.sport),
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
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState("");

  const favoriteTeamIds =
    userId && favoriteTeamState.userId === userId
      ? favoriteTeamState.teamIds
      : [];

  const isFavorite = team ? favoriteTeamIds.includes(team.id) : false;
  const averageRating = team ? getAverageRating(team.ratings) : 0;

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

    const loadTeamMatches = async () => {
      try {
        setIsMatchesLoading(true);
        setMatchesError("");

        const { data, error } = await supabase
          .from("matches")
          .select(
            `
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

        setMatches(nextMatches);
      } catch (error) {
        console.error("팀 경기 일정 불러오기 실패", error);

        if (isMounted) {
          setMatchesError("경기 일정을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setIsMatchesLoading(false);
        }
      }
    };

    loadTeamMatches();

    return () => {
      isMounted = false;
    };
  }, [team]);

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
      setIsLoginDialogOpen(true);
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

  const handleMoveToLogin = () => {
    setIsLoginDialogOpen(false);

    navigate("/login", {
      state: {
        from: {
          pathname: `/teams/${team.id}`,
          search: "",
          hash: "",
        },
      },
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
              <button
                type="button"
                className={`${styles.favoriteButton} ${
                  isFavorite ? styles.favoriteButtonActive : ""
                }`}
                disabled={isSavingFavorite}
                onClick={handleFavoriteClick}
              >
                {isSavingFavorite
                  ? "저장 중..."
                  : isFavorite
                    ? "관심 팀 해제"
                    : "관심 팀 등록"}
              </button>

              <a className={styles.scheduleLink} href="#team-schedule">
                경기 일정 보기
              </a>
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

        <section className={styles.membersSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>멤버</span>
            <h2>대표 로스터</h2>
          </div>

          <div className={styles.memberGrid}>
            {team.members.map((member) => (
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
            <p className={styles.stateMessage}>경기 일정을 불러오는 중입니다.</p>
          ) : matchesError ? (
            <p className={styles.stateMessage}>{matchesError}</p>
          ) : matches.length > 0 ? (
            <div className={styles.matchGrid}>
              {matches.map((match) => (
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

                    <strong>VS</strong>

                    <div>
                      <TeamBadgeLogo team={match.awayTeam} />
                      <span>{match.awayTeam.name}</span>
                    </div>
                  </div>

                  <span className={styles.matchLeague}>{match.league}</span>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.stateMessage}>
              등록된 다가오는 경기 일정이 없습니다.
            </p>
          )}
        </section>

        <section className={styles.ratingsSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>평점</span>
            <h2>입덕 체크리스트</h2>
          </div>

          <div className={styles.ratingList}>
            {sortedRatings.map((rating) => (
              <div key={rating.label} className={styles.ratingRow}>
                <span>{rating.label}</span>
                <div className={styles.ratingTrack} aria-hidden="true">
                  <span style={{ width: `${rating.score * 20}%` }} />
                </div>
                <strong>{rating.score}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <FanPickDialog
        isOpen={isLoginDialogOpen}
        title="로그인이 필요합니다"
        description="관심 팀을 마이페이지에 저장하려면 먼저 로그인해 주세요."
        confirmText="로그인하기"
        cancelText="취소"
        onClose={() => setIsLoginDialogOpen(false)}
        onConfirm={handleMoveToLogin}
      />
    </main>
  );
};

export default TeamDetailPage;
