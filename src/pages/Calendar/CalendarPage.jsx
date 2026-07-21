import { useEffect, useMemo, useState } from "react";
import CalendarFilter from "./components/CalendarFilter/CalendarFilter";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import CalendarHeader from "./components/CalendarHeader/CalendarHeader";
import { fetchKBOSchedule } from "./api/getSportSchedule";
import css from "./CalendarPage.module.css";

const SPORT_OPTIONS = [
  { label: "BASEBALL", value: "baseball" },
  { label: "SOCCER", value: "soccer" },
  { label: "LOL", value: "lol" },
];

const SUPPORTED_SPORTS = new Set(["baseball", "soccer", "lol"]);

const BASEBALL_TEAM_OPTIONS = [
  { code: "DOOSAN", name: "두산 베어스", shortName: "DOOSAN" },
  { code: "LG", name: "LG 트윈스", shortName: "LG" },
  { code: "KIA", name: "KIA 타이거즈", shortName: "KIA" },
  { code: "KT", name: "KT 위즈", shortName: "KT" },
  { code: "LOTTE", name: "롯데 자이언츠", shortName: "LOTTE" },
  { code: "NC", name: "NC 다이노스", shortName: "NC" },
  { code: "SAMSUNG", name: "삼성 라이온즈", shortName: "SAMSUNG" },
  { code: "SSG", name: "SSG 랜더스", shortName: "SSG" },
  { code: "HANWHA", name: "한화 이글스", shortName: "HANWHA" },
  { code: "KIWOOM", name: "키움 히어로즈", shortName: "KIWOOM" },
];

const LOL_TEAM_OPTIONS = [
  { code: "T1", name: "T1", shortName: "T1" },
  { code: "GEN", name: "Gen.G", shortName: "GEN" },
  { code: "HLE", name: "Hanwha Life Esports", shortName: "HLE" },
  { code: "DK", name: "Dplus KIA", shortName: "DK" },
  { code: "KT", name: "KT Rolster", shortName: "KT" },
  { code: "KRX", name: "Kiwoom DRX", shortName: "KRX" },
  { code: "NS", name: "Nongshim RedForce", shortName: "NS" },
  { code: "BFX", name: "BNK FEARX", shortName: "BFX" },
  { code: "DNS", name: "DN SOOPers", shortName: "DNS" },
  { code: "BRO", name: "BRION", shortName: "BRO" },
];

const TEAM_LOGOS = {
  DOOSAN: "/logos/doosan.png",
  LG: "/logos/lg.png",
  KIA: "/logos/kia.png",
  KT: "/logos/kt.png",
  LOTTE: "/logos/lotte.png",
  NC: "/logos/nc.png",
  SAMSUNG: "/logos/samsung.png",
  SSG: "/logos/ssg.png",
  HANWHA: "/logos/hanwha.png",
  KIWOOM: "/logos/kiwoom.png",
  T1: "https://cdn-api.pandascore.co/images/team/image/126061/t_oscq04.png",
  GEN: "https://cdn-api.pandascore.co/images/team/image/2882/699px_gen.g_esports_2026_allmode.png",
  HLE: "https://cdn-api.pandascore.co/images/team/image/2883/hanwha-life-esports-1s04vbu0.png",
  DK: "https://cdn-api.pandascore.co/images/team/image/132531/800px_dplus_lightmode.png",
  KRX: "https://cdn-api.pandascore.co/images/team/image/126370/220px_dr_xlogo_square.png",
  NS: "https://cdn-api.pandascore.co/images/team/image/128217/nongshim_red_forcelogo_square.png",
  BFX: "https://cdn-api.pandascore.co/images/team/image/134115/663px_fear_x_icon_lightmode.png",
  DNS: "https://cdn-api.pandascore.co/images/team/image/136063/dn_soo_perslogo_profile.png",
  BRO: "https://cdn-api.pandascore.co/images/team/image/128218/628px_brion_2023_lightmode.png",
};

const addTeamLogo = (team) => ({
  ...team,
  logo: team.logo || TEAM_LOGOS[team.code] || "",
});

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

const normalizeTeamValue = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

const isMatchingTeam = (team, selectedTeamCode) => {
  if (!team || selectedTeamCode === "all") {
    return false;
  }

  const target = normalizeTeamValue(selectedTeamCode);
  const teamValues = [
    team.code,
    team.shortName,
    team.name,
    team.alias,
  ]
    .filter(Boolean)
    .map(normalizeTeamValue);

  return teamValues.includes(target);
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
        isMatchingTeam(match.homeTeam, selectedTeamCode) ||
        isMatchingTeam(match.awayTeam, selectedTeamCode),
    );
  }, [isSupportedSport, matches, selectedSport, selectedTeamCode]);

  const teamOptions = useMemo(() => {
    if (!isSupportedSport) {
      return [];
    }

    const sportMatches = matches.filter((match) => match.sport === selectedSport);

    if (selectedSport === "baseball") {
      const teamsFromMatches = getUniqueTeams(sportMatches);

      if (teamsFromMatches.length > 0) {
        return teamsFromMatches.map(addTeamLogo);
      }

      return BASEBALL_TEAM_OPTIONS.map(addTeamLogo);
    }

    if (selectedSport === "lol") {
      const teamsFromMatches = getUniqueTeams(sportMatches);

      if (teamsFromMatches.length > 0) {
        return teamsFromMatches.map(addTeamLogo);
      }

      return LOL_TEAM_OPTIONS.map(addTeamLogo);
    }

    return getUniqueTeams(sportMatches).map(addTeamLogo);
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
