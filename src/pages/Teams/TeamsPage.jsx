import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Button from "../../components/Button/Button";
import EmptyState from "../../components/EmptyState/EmptyState";
import FanPickDialog from "../../components/FanPickDialog/FanPickDialog";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import SearchInput from "../../components/SearchInput/SearchInput";
import SubNav from "../../components/SubNav/SubNav";
import ViewAllLink from "../../components/ViewAllLink/ViewAllLink";
import { TEAMS_SUB_NAV_ITEMS } from "../../constants/teamsNav";
import useAuth from "../../contexts/useAuth";
import {
  FAVORITE_TEAMS_CHANGED_EVENT,
  fetchFavoriteTeamIds,
  getFavoriteTeamIds,
  toggleFavoriteTeamId,
} from "../../services/favoriteTeams";
import {
  FEATURED_TEAMS,
  TEAM_FILTERS,
  TEAM_LEAGUE_LABELS,
} from "./data/teams";
import styles from "./TeamsPage.module.css";

const VALID_FILTER_IDS = TEAM_FILTERS.map((filter) => filter.id);
const TEAMS_PER_PAGE = 8;

const getValidFilter = (filterId) =>
  VALID_FILTER_IDS.includes(filterId) ? filterId : "all";

const getAverageRating = (ratings) => {
  if (!ratings.length) return 0;

  const total = ratings.reduce((sum, rating) => sum + rating.score, 0);

  return Number((total / ratings.length).toFixed(1));
};

const searchTeams = (teams, keyword) => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return teams;
  }

  return teams.filter((team) => {
    const searchableText = [
      team.name,
      team.shortName,
      TEAM_LEAGUE_LABELS[team.league],
      team.home,
      team.tone,
      team.intro,
      team.entryPoint,
      ...(team.tags || []),
      ...(team.players || []).map((player) => `${player.name} ${player.role}`),
      ...(team.members || []).map(
        (member) => `${member.name} ${member.realName || ""} ${member.role}`,
      ),
    ]
      .flat()
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedKeyword);
  });
};

const LogoImage = ({ src, name, shortName, className = "" }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`${styles.logoFallback} ${className}`} aria-hidden="true">
        {shortName}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={`${name} 로고`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

const TeamCard = ({
  team,
  isFavorite,
  isSaving,
  onTeamClick,
  onFavoriteClick,
}) => {
  const averageRating = getAverageRating(team.ratings);

  return (
    <article className={styles.teamCard}>
      <button
        type="button"
        className={styles.teamCardButton}
        onClick={() => onTeamClick(team.id)}
        aria-label={`${team.name} 팀 정보 보기`}
      >
        <div className={styles.cardTop}>
          <span className={styles.leagueBadge}>
            {TEAM_LEAGUE_LABELS[team.league]}
          </span>

          <span className={styles.ratingBadge}>{averageRating.toFixed(1)}</span>
        </div>

        <div className={styles.logoArea}>
          <LogoImage
            className={styles.teamLogo}
            src={team.logo}
            name={team.name}
            shortName={team.shortName}
          />
        </div>

        <div className={styles.cardContent}>
          <strong className={styles.teamName}>{team.name}</strong>

          <span className={styles.teamMeta}>
            {team.home} · {team.shortName}
          </span>

          <p className={styles.teamTone}>{team.tone}</p>

          <div className={styles.tagList}>
            {team.tags.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </button>

      <Button
        className={styles.favoriteButton}
        disabled={isSaving}
        fullWidth
        onClick={() => onFavoriteClick(team.id)}
        variant={isFavorite ? "primary" : "ghost"}
      >
        {isSaving ? "저장 중..." : isFavorite ? "관심 팀 해제" : "관심 팀 등록"}
      </Button>
    </article>
  );
};

const TeamsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoggedIn, isAuthLoading } = useAuth();

  const [favoriteTeamState, setFavoriteTeamState] = useState({
    userId: "",
    teamIds: [],
  });
  const [savingFavoriteTeamId, setSavingFavoriteTeamId] = useState("");
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [pendingTeamId, setPendingTeamId] = useState("");
  const [teamGridPages, setTeamGridPages] = useState({});

  const userId = user?.id || "";
  const activeFilter = getValidFilter(searchParams.get("league"));
  const searchKeyword = searchParams.get("keyword") || "";
  const hasSearchKeyword = searchKeyword.trim() !== "";

  const favoriteTeamIds =
    userId && favoriteTeamState.userId === userId
      ? favoriteTeamState.teamIds
      : [];

  useEffect(() => {
    if (!userId) {
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
  }, [userId]);

  const leagueTeams = useMemo(() => {
    if (activeFilter === "all") {
      return FEATURED_TEAMS;
    }

    return FEATURED_TEAMS.filter((team) => team.league === activeFilter);
  }, [activeFilter]);

  const teamsToRender = useMemo(
    () => searchTeams(leagueTeams, searchKeyword),
    [leagueTeams, searchKeyword],
  );

  const groupedTeams = useMemo(
    () =>
      TEAM_FILTERS.filter((filter) => filter.id !== "all").map((filter) => ({
        ...filter,
        teams: FEATURED_TEAMS.filter((team) => team.league === filter.id),
      })),
    [],
  );

  const isFavorite = (teamId) => favoriteTeamIds.includes(teamId);

  const getTeamGridPage = (sectionId, totalPages) =>
    Math.min(teamGridPages[sectionId] || 0, Math.max(totalPages - 1, 0));

  const handleMoveTeamGrid = (sectionId, direction, totalPages) => {
    const currentPage = getTeamGridPage(sectionId, totalPages);
    const nextPage = Math.min(
      Math.max(currentPage + direction, 0),
      Math.max(totalPages - 1, 0),
    );

    if (nextPage === currentPage) {
      return;
    }

    setTeamGridPages((previousPages) => ({
      ...previousPages,
      [sectionId]: nextPage,
    }));
  };

  const handleFilterChange = (filterId) => {
    const nextFilter = getValidFilter(filterId);

    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);

      if (nextFilter === "all") {
        nextParams.delete("league");
      } else {
        nextParams.set("league", nextFilter);
      }

      return nextParams;
    });
  };

  const handleSearchChange = (keyword) => {
    setSearchParams(
      (previousParams) => {
        const nextParams = new URLSearchParams(previousParams);

        if (keyword.trim()) {
          nextParams.set("keyword", keyword);
        } else {
          nextParams.delete("keyword");
        }

        return nextParams;
      },
      { replace: true },
    );
  };

  const handleTeamClick = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  const handleFavoriteClick = async (teamId) => {
    if (isAuthLoading) return;

    if (!isLoggedIn || !userId) {
      setPendingTeamId(teamId);
      setIsLoginDialogOpen(true);
      return;
    }

    const nextTeamIds = favoriteTeamIds.includes(teamId)
      ? favoriteTeamIds.filter((favoriteTeamId) => favoriteTeamId !== teamId)
      : [...favoriteTeamIds, teamId];

    setSavingFavoriteTeamId(teamId);
    setFavoriteTeamState({
      userId,
      teamIds: nextTeamIds,
    });

    try {
      const savedTeamIds = await toggleFavoriteTeamId(
        userId,
        teamId,
        favoriteTeamIds,
      );

      setFavoriteTeamState({
        userId,
        teamIds: savedTeamIds,
      });
    } finally {
      setSavingFavoriteTeamId("");
    }
  };

  const handleCloseLoginDialog = () => {
    setPendingTeamId("");
    setIsLoginDialogOpen(false);
  };

  const handleMoveToLogin = () => {
    const pathname = pendingTeamId ? `/teams/${pendingTeamId}` : "/teams";

    setPendingTeamId("");
    setIsLoginDialogOpen(false);

    navigate("/login", {
      state: {
        from: {
          pathname,
          search: "",
          hash: "",
        },
      },
    });
  };

  const renderTeamGrid = (teams) => (
    <div className={styles.teamGrid}>
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          isFavorite={isFavorite(team.id)}
          isSaving={savingFavoriteTeamId === team.id}
          onTeamClick={handleTeamClick}
          onFavoriteClick={handleFavoriteClick}
        />
      ))}
    </div>
  );

  return (
    <>
      <SubNav ariaLabel="팀 메뉴" items={TEAMS_SUB_NAV_ITEMS} />

      <main className={styles.teamsPage}>
      <div className="container">
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>FIND YOUR TEAM</p>

          <h1 className={styles.title}>TEAMS</h1>

          <p className={styles.description}>
            KBO, K리그, LCK 팀의 분위기와 입덕 포인트를 비교해 보고
            마음이 가는 팀을 관심 팀으로 저장해 보세요.
          </p>
        </header>

        <div className={styles.controlArea}>
          <div className={styles.filterArea}>
            <MatchFilter
              filters={TEAM_FILTERS}
              activeFilter={activeFilter}
              onChange={handleFilterChange}
            />
          </div>

          <div className={styles.searchArea}>
            <SearchInput
              value={searchKeyword}
              onChange={handleSearchChange}
              placeholder="팀 이름, 지역, 키워드를 검색해보세요"
              ariaLabel="팀 검색"
              debounceDelay={500}
            />
          </div>
        </div>

        {hasSearchKeyword && (
          <div className={styles.searchResultHeader} aria-live="polite">
            <p>
              <strong>{searchKeyword}</strong> 검색 결과
            </p>

            <span>{teamsToRender.length} TEAMS</span>
          </div>
        )}

        {activeFilter === "all" && !hasSearchKeyword ? (
          <div className={styles.leagueSections}>
            {groupedTeams.map((section) => {
              const totalPages = Math.ceil(
                section.teams.length / TEAMS_PER_PAGE,
              );
              const currentPage = getTeamGridPage(section.id, totalPages);
              const visibleTeams = section.teams.slice(
                currentPage * TEAMS_PER_PAGE,
                (currentPage + 1) * TEAMS_PER_PAGE,
              );

              return (
                <section
                  key={section.id}
                  className={styles.leagueSection}
                  aria-labelledby={`${section.id}-teams-title`}
                >
                  <div className={styles.leagueHeader}>
                    <h2
                      id={`${section.id}-teams-title`}
                      className={styles.leagueTitle}
                    >
                      {section.label}
                    </h2>

                    <ViewAllLink
                      onClick={() => handleFilterChange(section.id)}
                    />
                  </div>

                  <PaginationControls
                    ariaLabel={`${section.label} 팀 카드 페이지 이동`}
                    className={styles.leagueNavigation}
                    currentPage={currentPage}
                    nextLabel={`${section.label} 다음 팀 페이지 보기`}
                    onNext={() =>
                      handleMoveTeamGrid(section.id, 1, totalPages)
                    }
                    onPrevious={() =>
                      handleMoveTeamGrid(section.id, -1, totalPages)
                    }
                    previousLabel={`${section.label} 이전 팀 페이지 보기`}
                    totalPages={totalPages}
                  />

                  {renderTeamGrid(visibleTeams)}
                </section>
              );
            })}
          </div>
        ) : teamsToRender.length > 0 ? (
          renderTeamGrid(teamsToRender)
        ) : (
          <EmptyState
            className={styles.emptyMessage}
            title="검색 조건에 맞는 팀이 없습니다."
            description="검색어를 바꾸거나 필터를 전체로 변경해 보세요."
          />
        )}
      </div>

      <FanPickDialog
        isOpen={isLoginDialogOpen}
        title="로그인이 필요합니다"
        description="관심 팀을 마이페이지에 저장하려면 먼저 로그인해 주세요."
        confirmText="로그인하기"
        cancelText="취소"
        onClose={handleCloseLoginDialog}
        onConfirm={handleMoveToLogin}
      />
      </main>
    </>
  );
};

export default TeamsPage;
