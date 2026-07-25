import { useEffect, useMemo, useState } from "react";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import Skeleton from "../../components/Skeleton/Skeleton";
import SubNav from "../../components/SubNav/SubNav";
import { MATCH_CENTER_SUB_NAV_ITEMS } from "../../constants/matchCenterNav";
import useAuth from "../../contexts/useAuth";
import {
  FAVORITE_TEAMS_CHANGED_EVENT,
  fetchFavoriteTeamIds,
  getFavoriteTeamIds,
} from "../../services/favoriteTeams";
import { getTeamsByIds, TEAM_BY_ID } from "../Teams/data/teams";
import CalendarFilter from "./components/CalendarFilter/CalendarFilter";
import CalendarGrid from "./components/CalendarGrid.jsx";
import CalendarHeader from "./components/CalendarHeader.jsx";
import MatchAlarmModal from "./components/MatchAlarmModal/MatchAlarmModal";
import { fetchCalendarSchedule } from "./api/getSportSchedule";
import styles from "./CalendarPage.module.css";

const SPORT_FILTERS = [
  { id: "my", label: "MY" },
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "lol", label: "LOL" },
];

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const CALENDAR_SKELETON_DAYS = Array.from({ length: 42 }, (_, index) => index);
const SUPPORTED_SPORTS = new Set(["baseball", "soccer", "lol"]);
const EXCLUDED_BASEBALL_TEAM_CODES = new Set(["NANUM", "DREAM"]);

const getMonthRange = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const fromDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0);
  const toDate = `${lastDay.getFullYear()}-${String(
    lastDay.getMonth() + 1,
  ).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

  return { fromDate, toDate };
};

const normalizeTeamValue = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const getTeamValueCandidates = (team) =>
  [team?.code, team?.shortName, team?.name, team?.alias]
    .filter(Boolean)
    .map(normalizeTeamValue);

const getFeaturedTeamMatchValues = (team) =>
  [
    team?.id,
    team?.name,
    team?.shortName,
    ...(Array.isArray(team?.matchCodes) ? team.matchCodes : []),
  ]
    .filter(Boolean)
    .map(normalizeTeamValue);

const isMatchForTeamValues = (match, teamValues) =>
  [match.homeTeam, match.awayTeam].some((team) =>
    getTeamValueCandidates(team).some((teamValue) => teamValues.has(teamValue)),
  );

const getUniqueTeams = (matches) => {
  const teamMap = new Map();

  matches.forEach((match) => {
    [match.homeTeam, match.awayTeam].forEach((team) => {
      if (!team?.code || teamMap.has(team.code)) {
        return;
      }

      teamMap.set(team.code, team);
    });
  });

  return Array.from(teamMap.values());
};

const isExcludedCalendarTeam = (team) => {
  return EXCLUDED_BASEBALL_TEAM_CODES.has(normalizeTeamValue(team?.code));
};

const isMatchingTeam = (team, selectedTeamCode) => {
  if (!team || selectedTeamCode === "all") {
    return false;
  }

  const featuredTeam = TEAM_BY_ID.get(selectedTeamCode);
  const targetValues = new Set(
    featuredTeam
      ? getFeaturedTeamMatchValues(featuredTeam)
      : [normalizeTeamValue(selectedTeamCode)],
  );

  return getTeamValueCandidates(team).some((teamValue) =>
    targetValues.has(teamValue),
  );
};

const groupMatchesByDate = (matches) =>
  matches.reduce((acc, match) => {
    if (!acc[match.date]) {
      acc[match.date] = [];
    }

    acc[match.date].push(match);
    return acc;
  }, {});

const addTeamLogo = (team) => ({
  ...team,
  logo: team.logo || "",
});

const CalendarPage = () => {
  const { user, isAuthLoading } = useAuth();
  const userId = user?.id || "";
  const [selectedSport, setSelectedSport] = useState("my");
  const [selectedTeamCode, setSelectedTeamCode] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [matches, setMatches] = useState([]);
  const [favoriteTeamState, setFavoriteTeamState] = useState({
    userId: "",
    teamIds: [],
  });
  const [selectedAlarmMatch, setSelectedAlarmMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isMyFilter = selectedSport === "my";
  const isSupportedSport = isMyFilter || SUPPORTED_SPORTS.has(selectedSport);
  const favoriteTeamIds = useMemo(
    () =>
      userId && favoriteTeamState.userId === userId
        ? favoriteTeamState.teamIds
        : [],
    [favoriteTeamState.teamIds, favoriteTeamState.userId, userId],
  );
  const isFavoriteTeamsLoading =
    Boolean(userId) && favoriteTeamState.userId !== userId;
  const favoriteTeams = useMemo(
    () => getTeamsByIds(favoriteTeamIds),
    [favoriteTeamIds],
  );
  const favoriteTeamValues = useMemo(
    () => new Set(favoriteTeams.flatMap(getFeaturedTeamMatchValues)),
    [favoriteTeams],
  );
  const combinedLoading =
    loading || (isMyFilter && (isAuthLoading || isFavoriteTeamsLoading));
  const { year, month } = useMemo(
    () => ({
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth(),
    }),
    [currentMonth],
  );

  useEffect(() => {
    const { fromDate, toDate } = getMonthRange(currentMonth);
    const controller = new AbortController();

    const loadSchedule = async () => {
      setLoading(true);
      setError("");

      try {
        const { matches: nextMatches } = await fetchCalendarSchedule({
          sport: isMyFilter ? "my" : selectedSport,
          fromDate,
          toDate,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setMatches(nextMatches);
        }
      } catch (fetchError) {
        if (fetchError?.name !== "AbortError" && !controller.signal.aborted) {
          setError("Failed to load schedule data.");
          setMatches([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      controller.abort();
    };
  }, [currentMonth, isMyFilter, selectedSport]);

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

  const teamOptions = useMemo(() => {
    if (!isSupportedSport) {
      return [];
    }

    if (isMyFilter) {
      return favoriteTeams.map((team) => ({
        ...team,
        code: team.id,
      }));
    }

    return getUniqueTeams(
      matches.filter((match) => match.sport === selectedSport),
    )
      .filter(
        (team) =>
          !(selectedSport === "baseball" && isExcludedCalendarTeam(team)),
      )
      .map(addTeamLogo);
  }, [favoriteTeams, isMyFilter, isSupportedSport, matches, selectedSport]);

  const activeSelectedTeamCode = useMemo(() => {
    if (isMyFilter) {
      return selectedTeamCode !== "all" &&
        !favoriteTeamIds.includes(selectedTeamCode)
        ? "all"
        : selectedTeamCode;
    }

    if (teamOptions.length === 0) {
      return "all";
    }

    return teamOptions.some((team) => team.code === selectedTeamCode)
      ? selectedTeamCode
      : teamOptions[0].code;
  }, [favoriteTeamIds, isMyFilter, selectedTeamCode, teamOptions]);

  const visibleMatches = useMemo(() => {
    const sportMatches = isMyFilter
      ? matches.filter((match) => isMatchForTeamValues(match, favoriteTeamValues))
      : matches.filter((match) => match.sport === selectedSport);
    const filteredMatches =
      selectedSport === "baseball"
        ? sportMatches.filter(
            (match) =>
              !isExcludedCalendarTeam(match.homeTeam) &&
              !isExcludedCalendarTeam(match.awayTeam),
          )
        : sportMatches;

    if (activeSelectedTeamCode === "all") {
      return filteredMatches;
    }

    return filteredMatches.filter(
      (match) =>
        isMatchingTeam(match.homeTeam, activeSelectedTeamCode) ||
        isMatchingTeam(match.awayTeam, activeSelectedTeamCode),
    );
  }, [
    activeSelectedTeamCode,
    favoriteTeamValues,
    isMyFilter,
    matches,
    selectedSport,
  ]);

  const matchByDate = useMemo(
    () => groupMatchesByDate(visibleMatches),
    [visibleMatches],
  );

  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    setSelectedTeamCode("all");
  };

  const handleTeamSelect = (teamCode) => {
    setSelectedTeamCode((prevTeamCode) => {
      if (isMyFilter && prevTeamCode === teamCode) {
        return "all";
      }

      return teamCode;
    });
  };

  const handleOpenAlarmModal = (match) => {
    setSelectedAlarmMatch(match);
  };

  const handleCloseAlarmModal = () => {
    setSelectedAlarmMatch(null);
  };

  return (
    <>
      <SubNav
        activeItemId="calendar"
        ariaLabel="Match center menu"
        items={MATCH_CENTER_SUB_NAV_ITEMS}
      />

      <main className={styles.calendarPage}>
        <div className={`container ${styles.inner}`}>
          <header className={styles.pageHeader}>
            <p className={styles.eyebrow}>FANPICK MATCH CENTER</p>
            <h1 className={styles.title}>CALENDAR</h1>
          </header>

          <div className={styles.sportFilters}>
            <MatchFilter
              activeFilter={selectedSport}
              filters={SPORT_FILTERS}
              onChange={handleSportChange}
            />
          </div>

          <CalendarFilter
            selectedSport={selectedSport}
            isSupportedSport={isSupportedSport}
            loading={combinedLoading}
            teamOptions={teamOptions}
            selectedTeamCode={activeSelectedTeamCode}
            onSelectTeamCode={handleTeamSelect}
            emptyMessage={
              isMyFilter
                ? "관심 팀 등록한 팀이 없습니다."
                : "팀 데이터가 없습니다."
            }
          />

          {error ? <p className={styles.statusMessageError}>{error}</p> : null}

          <CalendarHeader
            year={year}
            month={month}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          {combinedLoading ? (
            <section
              className={styles.calendarSkeleton}
              aria-label="일정 불러오는 중"
            >
              <div className={styles.skeletonWeekdays}>
                {WEEKDAY_LABELS.map((weekday) => (
                  <div key={weekday} className={styles.skeletonWeekday}>
                    {weekday}
                  </div>
                ))}
              </div>
              <div className={styles.skeletonDays}>
                {CALENDAR_SKELETON_DAYS.map((day) => (
                  <div key={day} className={styles.skeletonDay}>
                    <Skeleton.Line className={styles.skeletonDate} />
                    {day % 3 !== 1 ? (
                      <div className={styles.skeletonMatch}>
                        <Skeleton.Circle className={styles.skeletonLogo} />
                        <Skeleton.Line className={styles.skeletonTeam} />
                      </div>
                    ) : null}
                    {day % 5 === 0 ? (
                      <Skeleton.Line className={styles.skeletonMeta} />
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              matchByDate={matchByDate}
              onMatchClick={handleOpenAlarmModal}
            />
          )}
        </div>
      </main>

      <MatchAlarmModal
        match={selectedAlarmMatch}
        isOpen={Boolean(selectedAlarmMatch)}
        onClose={handleCloseAlarmModal}
      />
    </>
  );
};

export default CalendarPage;
