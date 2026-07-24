import { useMemo, useState } from "react";
import CalendarGrid from "./components/CalendarGrid";
import CalendarHeader from "./components/CalendarHeader";
import css from "./Calendar.module.css";

const SPORT_OPTIONS = [
  { label: "BASEBALL", value: "baseball" },
  { label: "SOCCER", value: "soccer" },
  { label: "BASKETBALL", value: "basketball" },
  { label: "LOL", value: "lol" },
];

const MATCHES = [
  {
    id: 1,
    date: "2026-07-01",
    sport: "baseball",
    sportLabel: "BASEBALL",
    league: "KBO",
    time: "18:30",
    venue: "잠실",
    homeTeam: {
      name: "Doosan Bears",
      shortName: "두산",
      logo: "/images/team-logos/doosan.png",
    },
    awayTeam: {
      name: "NC Dinos",
      shortName: "NC",
      logo: "/images/team-logos/nc.png",
    },
    homeScore: 5,
    awayScore: 2,
    resultText: "패",
  },
  {
    id: 2,
    date: "2026-07-02",
    sport: "baseball",
    sportLabel: "BASEBALL",
    league: "KBO",
    time: "18:30",
    venue: "잠실",
    homeTeam: {
      name: "Doosan Bears",
      shortName: "두산",
      logo: "/images/team-logos/doosan.png",
    },
    awayTeam: {
      name: "NC Dinos",
      shortName: "NC",
      logo: "/images/team-logos/nc.png",
    },
    homeScore: 3,
    awayScore: 8,
    resultText: "승",
  },
  {
    id: 3,
    date: "2026-07-07",
    sport: "baseball",
    sportLabel: "BASEBALL",
    league: "KBO",
    time: "18:30",
    venue: "잠실",
    homeTeam: {
      name: "LG Twins",
      shortName: "LG",
      logo: "/images/team-logos/lg.png",
    },
    awayTeam: {
      name: "KIA Tigers",
      shortName: "KIA",
      logo: "/images/team-logos/kia.png",
    },
    homeScore: 4,
    awayScore: 2,
    resultText: "패",
  },
  {
    id: 4,
    date: "2026-07-16",
    sport: "soccer",
    sportLabel: "SOCCER",
    league: "K LEAGUE",
    time: "20:00",
    venue: "서울월드컵경기장",
    homeTeam: {
      name: "FC Seoul",
      shortName: "서울",
      logo: "/images/team-logos/seoul.png",
    },
    awayTeam: {
      name: "Ulsan HD",
      shortName: "울산",
      logo: "/images/team-logos/ulsan.png",
    },
    homeScore: 0,
    awayScore: 0,
    resultText: "경기전",
  },
];

const Calendar = () => {
  const start = new Date(2026, 6, 1);
  const [currentMonth, setCurrentMonth] = useState(start);
  const [selectedSport, setSelectedSport] = useState("baseball");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const filteredMatches = useMemo(() => {
    return MATCHES.filter((match) => match.sport === selectedSport);
}, [selectedSport]);

const matchByDate = useMemo(() => {
  return filteredMatches.reduce((acc, match) => {
    if (!acc[match.date]) {
      acc[match.date] = [];
    }

    acc[match.date].push(match);
    return acc;
  }, {});
}, [filteredMatches]);

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

  return (
    <div className={css.calendarPage}>
      <div className={css.selectSportBtn}>
        {SPORT_OPTIONS.map((sport) => (
          <button
            key={sport.value}
            type="button"
            onClick={() =>setSelectedSport(sport.value)}
                className={selectedSport===sport.value ? css.sportButtonActive : css.sportButton}
          >
            {sport.label}
          </button>
        ))}
      </div>
      <CalendarHeader
        year={year}
        month={month}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      <CalendarGrid year={year} month={month} matchByDate={matchByDate} />
    </div>
  );
};

export default Calendar;
