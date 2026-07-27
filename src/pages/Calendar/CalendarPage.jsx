import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  cancelCalendarMatchAlarm,
  fetchCalendarMatchAlarm,
  fetchCalendarMatchAlarmIds,
  saveCalendarMatchAlarm,
} from "../../services/calendarMatchAlarms";
import {
  fetchNotificationPreferences,
  getDefaultMatchReminderSettings,
} from "../../services/notificationPreferences";
import { getTeamsByIds, TEAM_BY_ID } from "../Teams/data/teams";
import CalendarFilter from "./components/CalendarFilter/CalendarFilter";
import CalendarGrid from "./components/CalendarGrid.jsx";
import CalendarHeader from "./components/CalendarHeader.jsx";
import CalendarItemCard from "./components/CalendarItemCard";
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

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatSelectedDateLabel = (dateKey) => {
  const [year, month, day] = String(dateKey ?? "").split("-");

  return year && month && day ? `${year}.${month}.${day}` : "날짜 미정";
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

const isAlarmUnavailableMatch = (match) => {
  const status = String(match?.statusCode ?? match?.statusInfo ?? "")
    .trim()
    .toLowerCase();

  return ["finished", "ended", "final", "ft", "canceled", "cancelled", "postponed"].includes(status);
};

const CalendarPage = () => {
  const { user, isAuthLoading } = useAuth();
  const userId = user?.id || "";
  const [selectedSport, setSelectedSport] = useState("my");
  const [selectedTeamCode, setSelectedTeamCode] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateKey(new Date()),
  );
  const [matches, setMatches] = useState([]);
  const [favoriteTeamState, setFavoriteTeamState] = useState({
    userId: "",
    teamIds: [],
  });
  const [selectedAlarmMatch, setSelectedAlarmMatch] = useState(null);
  const [selectedAlarmRecord, setSelectedAlarmRecord] = useState(null);
  const [selectedAlarmRecordLoading, setSelectedAlarmRecordLoading] =
    useState(false);
  const [alarmMatchIds, setAlarmMatchIds] = useState([]);
  const [alarmDefaultSettings, setAlarmDefaultSettings] = useState({
    presetId: "60",
    customAmount: "15",
    customUnit: "minutes",
  });
  const [saveNotice, setSaveNotice] = useState(null);
  const saveNoticeTimerRef = useRef(null);
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
      setAlarmMatchIds([]);
      setSelectedAlarmRecord(null);
      setSelectedAlarmRecordLoading(false);
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

    const loadCalendarAlarmIds = async () => {
      try {
        const matchIds = await fetchCalendarMatchAlarmIds(userId);

        if (isMounted) {
          setAlarmMatchIds(matchIds);
        }
      } catch (alarmError) {
        console.error("Failed to load calendar alarms.", alarmError);

        if (isMounted) {
          setAlarmMatchIds([]);
        }
      }
    };

    const loadNotificationPreferences = async () => {
      try {
        const preferences = await fetchNotificationPreferences(userId);

        if (isMounted) {
          setAlarmDefaultSettings(getDefaultMatchReminderSettings(preferences));
        }
      } catch (preferenceError) {
        console.error(
          "Failed to load notification preferences.",
          preferenceError,
        );
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
    loadCalendarAlarmIds();
    loadNotificationPreferences();

    window.addEventListener(FAVORITE_TEAMS_CHANGED_EVENT, syncFavoriteTeams);
    window.addEventListener("storage", syncFavoriteTeams);

    return () => {
      isMounted = false;
      window.removeEventListener(FAVORITE_TEAMS_CHANGED_EVENT, syncFavoriteTeams);
      window.removeEventListener("storage", syncFavoriteTeams);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedAlarmMatch?.id) {
      setSelectedAlarmRecord(null);
      setSelectedAlarmRecordLoading(false);
      return undefined;
    }

    let isMounted = true;
    setSelectedAlarmRecordLoading(true);
    setSelectedAlarmRecord(null);

    const loadSelectedAlarm = async () => {
      try {
        const alarm = await fetchCalendarMatchAlarm(
          userId,
          selectedAlarmMatch.id,
        );

        if (isMounted) {
          setSelectedAlarmRecord(alarm);
        }
      } catch (alarmError) {
        console.error("Failed to load selected calendar alarm.", alarmError);

        if (isMounted) {
          setSelectedAlarmRecord(null);
        }
      } finally {
        if (isMounted) {
          setSelectedAlarmRecordLoading(false);
        }
      }
    };

    loadSelectedAlarm();

    return () => {
      isMounted = false;
    };
  }, [selectedAlarmMatch?.id, userId]);

  useEffect(() => {
    return () => {
      if (saveNoticeTimerRef.current) {
        window.clearTimeout(saveNoticeTimerRef.current);
      }
    };
  }, []);

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
  const selectedDateMatches = matchByDate[selectedDate] || [];

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const nextMonth = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      setSelectedDate(formatDateKey(nextMonth));
      return nextMonth;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const nextMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      setSelectedDate(formatDateKey(nextMonth));
      return nextMonth;
    });
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
    setSelectedAlarmRecord(null);
  };

  const handleSaveAlarm = async (alarmSettings) => {
    if (!selectedAlarmMatch?.id) {
      return;
    }

    if (isAlarmUnavailableMatch(selectedAlarmMatch)) {
      setSaveNotice({
        type: "error",
        message: "종료, 취소, 연기된 경기에는 알림을 저장할 수 없어요.",
      });
      if (saveNoticeTimerRef.current) {
        window.clearTimeout(saveNoticeTimerRef.current);
      }
      saveNoticeTimerRef.current = window.setTimeout(() => {
        setSaveNotice(null);
      }, 2500);
      return;
    }

    if (saveNoticeTimerRef.current) {
      window.clearTimeout(saveNoticeTimerRef.current);
    }

    try {
      console.log("[calendar-alarm] save attempt", {
        userId,
        matchId: selectedAlarmMatch.id,
        matchDate: selectedAlarmMatch.date,
        matchTime: selectedAlarmMatch.time,
        alarmSettings,
      });

      const savedAlarm = await saveCalendarMatchAlarm(userId, {
        matchId: selectedAlarmMatch.id,
        presetId: alarmSettings?.presetId ?? "60",
        customAmount: alarmSettings?.customAmount ?? "15",
        customUnit: alarmSettings?.customUnit ?? "minutes",
        matchDate: selectedAlarmMatch.date,
        matchTime: selectedAlarmMatch.time,
      });

      if (savedAlarm?.matchId) {
        setAlarmMatchIds((prevIds) =>
          prevIds.includes(String(savedAlarm.matchId))
            ? prevIds
            : [...prevIds, String(savedAlarm.matchId)],
        );
      }

      console.log("[calendar-alarm] save success", savedAlarm);
      setSaveNotice({
        type: "success",
        message: "알림이 저장됐어요.",
      });
      saveNoticeTimerRef.current = window.setTimeout(() => {
        setSaveNotice(null);
      }, 2500);
      setSelectedAlarmMatch(null);
      setSelectedAlarmRecord(null);
    } catch (saveError) {
      console.error("Failed to save calendar alarm.", saveError);
      setSaveNotice({
        type: "error",
        message: "알림 저장에 실패했어요.",
      });
      saveNoticeTimerRef.current = window.setTimeout(() => {
        setSaveNotice(null);
      }, 2500);
    }
  };

  const handleDeleteAlarm = async () => {
    if (!selectedAlarmMatch?.id) {
      return;
    }

    if (saveNoticeTimerRef.current) {
      window.clearTimeout(saveNoticeTimerRef.current);
    }

    try {
      console.log("[calendar-alarm] delete attempt", {
        userId,
        matchId: selectedAlarmMatch.id,
      });

      const canceledAlarm = await cancelCalendarMatchAlarm(
        userId,
        selectedAlarmMatch.id,
      );

      const matchIdToRemove = String(
        canceledAlarm?.matchId ?? selectedAlarmMatch.id,
      );

      setAlarmMatchIds((prevIds) =>
        prevIds.filter((matchId) => matchId !== matchIdToRemove),
      );

      console.log("[calendar-alarm] delete success", canceledAlarm);
      setSaveNotice({
        type: "success",
        message: "알림이 해제됐어요.",
      });
      saveNoticeTimerRef.current = window.setTimeout(() => {
        setSaveNotice(null);
      }, 2500);

      setSelectedAlarmMatch(null);
      setSelectedAlarmRecord(null);
    } catch (deleteError) {
      console.error("Failed to delete calendar alarm.", deleteError);
      setSaveNotice({
        type: "error",
        message: "알림 해제에 실패했어요.",
      });
      saveNoticeTimerRef.current = window.setTimeout(() => {
        setSaveNotice(null);
      }, 2500);
    }
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
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onMatchClick={handleOpenAlarmModal}
              alarmMatchIds={alarmMatchIds}
            />
          )}

          {!combinedLoading ? (
            <section className={styles.mobileSelectedDay}>
              <div className={styles.mobileSelectedDayHeader}>
                <div>
                  <span className={styles.mobileSelectedDate}>
                    {formatSelectedDateLabel(selectedDate)}
                  </span>
                  <h2 className={styles.mobileSelectedTitle}>MATCHES</h2>
                </div>
                <span className={styles.mobileSelectedCount}>
                  {selectedDateMatches.length} MATCHES
                </span>
              </div>

              {selectedDateMatches.length > 0 ? (
                <div className={styles.mobileSelectedList}>
                  {selectedDateMatches.map((match) => (
                    <CalendarItemCard
                      key={match.id}
                      match={match}
                      variant="agenda"
                      onClick={handleOpenAlarmModal}
                      isAlarmSet={alarmMatchIds.includes(String(match.id))}
                    />
                  ))}
                </div>
              ) : (
                <p className={styles.mobileSelectedEmpty}>
                  선택한 날짜의 경기가 없습니다.
                </p>
              )}
            </section>
          ) : null}
        </div>
      </main>

      {saveNotice ? (
        <div
          className={[
            styles.saveNotice,
            saveNotice.type === "success"
              ? styles.saveNoticeSuccess
              : styles.saveNoticeError,
          ]
            .filter(Boolean)
            .join(" ")}
          role="status"
          aria-live="polite"
        >
          {saveNotice.message}
        </div>
      ) : null}

      <MatchAlarmModal
        match={selectedAlarmMatch}
        isOpen={Boolean(selectedAlarmMatch)}
        onClose={handleCloseAlarmModal}
        onConfirm={handleSaveAlarm}
        onDelete={handleDeleteAlarm}
        defaultReminderSettings={alarmDefaultSettings}
        existingAlarm={selectedAlarmRecord}
        isAlarmLoading={selectedAlarmRecordLoading}
        canSaveAlarm={
          selectedAlarmMatch ? !isAlarmUnavailableMatch(selectedAlarmMatch) : false
        }
      />
    </>
  );
};

export default CalendarPage;
