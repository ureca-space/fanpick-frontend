import { useEffect, useMemo, useState } from "react";
import SubNav from "../../components/SubNav/SubNav";
import { MATCH_CENTER_SUB_NAV_ITEMS } from "../../constants/matchCenterNav";
import CalendarFilter from "./components/CalendarFilter/CalendarFilter";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import CalendarHeader from "./components/CalendarHeader/CalendarHeader";
import { fetchKBOSchedule } from "./api/getSportSchedule";
import styles from "./CalendarPage.module.css";

const SPORT_OPTIONS = [
  { label: "BASEBALL", value: "baseball" },
  { label: "SOCCER", value: "soccer" },
  { label: "LOL", value: "lol" },
];

const SUPPORTED_SPORTS = new Set(["baseball", "soccer", "lol"]);
const SAVED_MATCHES_STORAGE_KEY = "fanpick-calendar-saved-matches";

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

const isMatchingTeam = (team, selectedTeamCode) => {
  if (!team || selectedTeamCode === "all") {
    return false;
  }

  const target = normalizeTeamValue(selectedTeamCode);
  const teamValues = [team.code, team.shortName, team.name, team.alias]
    .filter(Boolean)
    .map(normalizeTeamValue);

  return teamValues.includes(target);
};

const groupMatchesByDate = (matches) =>
  matches.reduce((acc, match) => {
    if (!acc[match.date]) {
      acc[match.date] = [];
    }

    acc[match.date].push(match);
    return acc;
  }, {});

const formatMatchLabel = (match) => {
  const homeName = match.homeTeam?.name || "-";
  const awayName = match.awayTeam?.name || "-";

  return `${homeName} vs ${awayName}`;
};

const addTeamLogo = (team) => ({
  ...team,
  logo: team.logo || "",
});

const CalendarPage = () => {
  const [selectedSport, setSelectedSport] = useState("baseball");
  const [selectedTeamCode, setSelectedTeamCode] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [matches, setMatches] = useState([]);
  const [savedMatches, setSavedMatches] = useState(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_MATCHES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSupportedSport = SUPPORTED_SPORTS.has(selectedSport);
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
        const { matches: nextMatches } = await fetchKBOSchedule({
          sport: selectedSport,
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
  }, [currentMonth, selectedSport]);

  const visibleMatches = useMemo(() => {
    const sportMatches = matches.filter((match) => match.sport === selectedSport);

    if (selectedTeamCode === "all") {
      return sportMatches;
    }

    return sportMatches.filter(
      (match) =>
        isMatchingTeam(match.homeTeam, selectedTeamCode) ||
        isMatchingTeam(match.awayTeam, selectedTeamCode),
    );
  }, [matches, selectedSport, selectedTeamCode]);

  const teamOptions = useMemo(() => {
    if (!isSupportedSport) {
      return [];
    }

    return getUniqueTeams(
      matches.filter((match) => match.sport === selectedSport),
    ).map(addTeamLogo);
  }, [isSupportedSport, matches, selectedSport]);

  const matchByDate = useMemo(
    () => groupMatchesByDate(visibleMatches),
    [visibleMatches],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SAVED_MATCHES_STORAGE_KEY,
        JSON.stringify(savedMatches),
      );
    } catch {
      // ignore storage failures
    }
  }, [savedMatches]);

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

  const handleMatchClick = (match) => {
    setSavedMatches((prev) => {
      if (prev.some((item) => item.id === match.id)) {
        return prev;
      }

      return [match, ...prev];
    });
  };

  const handleRemoveSavedMatch = (matchId) => {
    setSavedMatches((prev) => prev.filter((match) => match.id !== matchId));
  };

  return (
    <>
      <SubNav
        activeItemId="calendar"
        ariaLabel="Match center menu"
        items={MATCH_CENTER_SUB_NAV_ITEMS}
      />

      <main className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <header className={styles.pageHeader}>
            <p className={styles.eyebrow}>FANPICK MATCH CENTER</p>
            <h1 className={styles.title}>CALENDAR</h1>
          </header>

          <div className={styles.selectSportBtn}>
            {SPORT_OPTIONS.map((sport) => (
              <button
                key={sport.value}
                type="button"
                onClick={() => setSelectedSport(sport.value)}
                className={
                  selectedSport === sport.value
                    ? styles.sportButtonActive
                    : styles.sportButton
                }
              >
                {sport.label}
              </button>
            ))}
          </div>

          <CalendarFilter
            selectedSport={selectedSport}
            isSupportedSport={isSupportedSport}
            loading={loading}
            teamOptions={teamOptions}
            selectedTeamCode={selectedTeamCode}
            onSelectTeamCode={setSelectedTeamCode}
            savedMatches={savedMatches}
            onRemoveSavedMatch={handleRemoveSavedMatch}
            formatMatchLabel={formatMatchLabel}
          />

          {loading ? (
            <p className={styles.statusMessage}>Loading schedule...</p>
          ) : null}
          {error ? <p className={styles.statusMessageError}>{error}</p> : null}

          <CalendarHeader
            year={year}
            month={month}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          <CalendarGrid
            year={year}
            month={month}
            matchByDate={matchByDate}
            onMatchClick={handleMatchClick}
          />
        </div>
      </main>
    </>
  );
};

export default CalendarPage;
