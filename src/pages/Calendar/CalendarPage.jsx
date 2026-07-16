import { useEffect, useMemo, useState } from "react";
import CalendarFilter from "./components/CalendarFilter/CalendarFilter";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import CalendarHeader from "./components/CalendarHeader/CalendarHeader";
import { fetchKBOSchedule } from "./api/getSportSchedule";
import css from "./CalendarPage.module.css";

const SPORT_OPTIONS = [
  { label: "BASEBALL", value: "baseball" },
  { label: "SOCCER", value: "soccer" },
  { label: "BASKETBALL", value: "basketball" },
  { label: "LOL", value: "lol" },
];

const SUPPORTED_SPORTS = new Set(["baseball", "soccer", "basketball"]);

const getMonthRange = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const fromDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const toDate = new Date(year, month + 1, 0);
  const formattedToDate = `${toDate.getFullYear()}-${String(
    toDate.getMonth() + 1,
  ).padStart(2, "0")}-${String(toDate.getDate()).padStart(2, "0")}`;

  return { fromDate, toDate: formattedToDate };
};

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

const groupMatchesByDate = (matches) => {
  return matches.reduce((acc, match) => {
    if (!acc[match.date]) {
      acc[match.date] = [];
    }

    acc[match.date].push(match);
    return acc;
  }, {});
};

const formatMatchLabel = (match) => {
  return `${match.homeTeam.name} vs ${match.awayTeam.name}`;
};

const CalendarPage = () => {
  const start = new Date(2026, 6, 1);
  const [currentMonth, setCurrentMonth] = useState(start);
  const [selectedSport, setSelectedSport] = useState("baseball");
  const [selectedTeamCode, setSelectedTeamCode] = useState("all");
  const [matches, setMatches] = useState([]);
  const [savedMatches, setSavedMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const isSupportedSport = SUPPORTED_SPORTS.has(selectedSport);

  useEffect(() => {
    setSelectedTeamCode("all");
  }, [selectedSport]);

  useEffect(() => {
    if (!isSupportedSport) {
      setMatches([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    const loadSchedule = async () => {
      setLoading(true);
      setError("");

      try {
        const { matches: nextMatches } = await fetchKBOSchedule({
          sport: selectedSport,
          ...getMonthRange(currentMonth),
          signal: controller.signal,
        });

        setMatches(nextMatches);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
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
  }, [currentMonth, isSupportedSport, selectedSport]);

  const visibleMatches = useMemo(() => {
    const sportMatches = matches.filter((match) => match.sport === selectedSport);

    if (!isSupportedSport || selectedTeamCode === "all") {
      return sportMatches;
    }

    return sportMatches.filter(
      (match) =>
        match.homeTeam.code === selectedTeamCode ||
        match.awayTeam.code === selectedTeamCode,
    );
  }, [isSupportedSport, matches, selectedSport, selectedTeamCode]);

  const teamOptions = useMemo(() => {
    if (!isSupportedSport) {
      return [];
    }

    return getUniqueTeams(matches.filter((match) => match.sport === selectedSport));
  }, [isSupportedSport, matches, selectedSport]);

  const matchByDate = useMemo(() => {
    return groupMatchesByDate(visibleMatches);
  }, [visibleMatches]);

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
    <div className={css.calendarPage}>
      <div className={css.selectSportBtn}>
        {SPORT_OPTIONS.map((sport) => (
          <button
            key={sport.value}
            type="button"
            onClick={() => setSelectedSport(sport.value)}
            className={
              selectedSport === sport.value
                ? css.sportButtonActive
                : css.sportButton
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

      {loading ? <p className={css.statusMessage}>Loading schedule...</p> : null}
      {error ? <p className={css.statusMessageError}>{error}</p> : null}

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
  );
};

export default CalendarPage;
