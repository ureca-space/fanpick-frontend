import { useEffect, useMemo, useState } from "react";
import { getTeamInfo } from "../../constants/teamInfo";
import SubNav from "../../components/SubNav/SubNav";
import { MATCH_CENTER_SUB_NAV_ITEMS } from "../../constants/matchCenterNav";
import { fetchKBOSchedule } from "./api/getSportSchedule";
import CalendarFilter from "./components/CalendarFilter/CalendarFilter";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import CalendarHeader from "./components/CalendarHeader/CalendarHeader";
import css from "./CalendarPage.module.css";

const SPORT_OPTIONS = [
  { label: "BASEBALL", value: "baseball" },
  { label: "SOCCER", value: "soccer" },
  { label: "LOL", value: "lol" },
];

const BASEBALL_TEAM_CODES = [
  "DOOSAN",
  "LG",
  "KIA",
  "KT",
  "LOTTE",
  "NC",
  "SAMSUNG",
  "SSG",
  "HANWHA",
  "KIWOOM",
];

const SOCCER_TEAM_CODES = [
  "K01",
  "K02",
  "K03",
  "K04",
  "K05",
  "K06",
  "K07",
  "K08",
  "K09",
  "K10",
  "K17",
  "K18",
  "K20",
  "K21",
  "K22",
  "K26",
  "K27",
  "K29",
  "K31",
  "K32",
  "K34",
  "K35",
  "K36",
  "K37",
  "K38",
  "K39",
  "K40",
  "K41",
  "K42",
];

const LOL_TEAM_CODES = [
  "T1",
  "GEN",
  "HLE",
  "DK",
  "KT",
  "KRX",
  "NS",
  "BFX",
  "DNS",
  "BRO",
];

const SUPPORTED_SPORTS = new Set(SPORT_OPTIONS.map((item) => item.value));
const SAVED_MATCHES_STORAGE_KEY = "fanpick-calendar-saved-matches";

const getMonthRange = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const fromDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0);
  const toDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

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

  return [...teamMap.values()];
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

const formatMatchLabel = (match) =>
  `${match.homeTeam?.shortName || match.homeTeam?.name || "-"} vs ${
    match.awayTeam?.shortName || match.awayTeam?.name || "-"
  }`;

const addTeamLogo = (team, sport) => ({
  ...team,
  logo: team.logo || getTeamInfo(team.code, sport).logo || "",
});

const getDefaultTeamOptions = (sport) => {
  if (sport === "baseball") {
    return BASEBALL_TEAM_CODES.map((code) => addTeamLogo({ code, ...getTeamInfo(code, "baseball") }, "baseball"));
  }

  if (sport === "soccer") {
    return SOCCER_TEAM_CODES.map((code) => addTeamLogo({ code, ...getTeamInfo(code, "soccer") }, "soccer"));
  }

  if (sport === "lol") {
    return LOL_TEAM_CODES.map((code) => addTeamLogo({ code, ...getTeamInfo(code, "esports") }, "esports"));
  }

  return [];
};

const CalendarPage = () => {
  const [selectedSport, setSelectedSport] = useState("baseball");
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
  const [selectedTeamCode, setSelectedTeamCode] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSupportedSport = SUPPORTED_SPORTS.has(selectedSport);
  const { fromDate, toDate } = useMemo(
    () => getMonthRange(currentMonth),
    [currentMonth],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SAVED_MATCHES_STORAGE_KEY,
        JSON.stringify(savedMatches),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [savedMatches]);

  useEffect(() => {
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

        if (controller.signal.aborted) {
          return;
        }

        setMatches(nextMatches);
      } catch (fetchError) {
        if (fetchError?.name !== "AbortError") {
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
  }, [fromDate, toDate, selectedSport]);

  useEffect(() => {
    setSelectedTeamCode("all");
  }, [selectedSport]);

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
    const sportMatches = matches.filter((match) => match.sport === selectedSport);
    const uniqueTeams = getUniqueTeams(sportMatches);
    const fallbackTeams = getDefaultTeamOptions(selectedSport);

    const sourceTeams = uniqueTeams.length > 0 ? uniqueTeams : fallbackTeams;
    const sportKey = selectedSport === "lol" ? "esports" : selectedSport;

    return sourceTeams.map((team) => addTeamLogo(team, sportKey));
  }, [matches, selectedSport]);

  const matchByDate = useMemo(
    () => groupMatchesByDate(visibleMatches),
    [visibleMatches],
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handleSelectSport = (sport) => {
    setSelectedSport(sport);
    setSelectedTeamCode("all");
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
        ariaLabel="match center menu"
        items={MATCH_CENTER_SUB_NAV_ITEMS}
      />

      <section className={css.calendarPage}>
        <div className="container">
          <div className={css.inner}>
            <header className={css.pageHeader}>
              <p className={css.eyebrow}>FANPICK MATCH CENTER</p>
              <h1 className={css.title}>CALENDAR</h1>
            </header>

            <div className={css.selectSportBtn}>
              {SPORT_OPTIONS.map((sport) => (
                <button
                  key={sport.value}
                  type="button"
                  onClick={() => handleSelectSport(sport.value)}
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

            {loading ? (
              <p className={css.statusMessage}>Loading schedule...</p>
            ) : null}
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
        </div>
      </section>
    </>
  );
};

export default CalendarPage;
