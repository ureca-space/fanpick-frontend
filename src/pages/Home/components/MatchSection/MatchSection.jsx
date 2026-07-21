import { useEffect, useMemo, useState } from "react";
import MatchCard from "../../../../components/MatchCard/MatchCard";
import MatchFilter from "../../../../components/MatchFilter/MatchFilter";
import { getTeamInfo } from "../../../../constants/teamInfo";
import { supabase } from "../../../../lib/supabase";
import styles from "./MatchSection.module.css";

const FILTERS = [
  { id: "all", label: "ALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "baseball", label: "BASEBALL" },
  { id: "esports", label: "LOL" },
];

const SPORT_LABELS = {
  baseball: "BASEBALL",
  soccer: "SOCCER",
  esports: "LOL",
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const STADIUM_NAMES = {
  JAMSIL: "잠실 야구장",
  GOCHEOKSKY: "고척 스카이돔",
  SUWON: "수원 KT 위즈 파크",
  DAEGU: "대구 삼성 라이온즈 파크",
  SAJIK: "사직 야구장",
  CHANGWON: "창원 NC 파크",
  DAEJEON: "대전 한화생명 볼파크",
  GWANGJU: "광주-기아 챔피언스 필드",
  MUNHAK: "인천 SSG 랜더스필드",
  INCHEON: "인천 SSG 랜더스필드",
};

const CARDS_PER_PAGE = 4;

const padNumber = (number) => String(number).padStart(2, "0");

const createToday = () => {
  const today = new Date();

  today.setHours(12, 0, 0, 0);

  return today;
};

const addDays = (date, amount) => {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + amount);

  return nextDate;
};

const getMonday = (date) => {
  const monday = new Date(date);
  const currentDay = monday.getDay();
  const difference = currentDay === 0 ? -6 : 1 - currentDay;

  monday.setDate(monday.getDate() + difference);
  monday.setHours(12, 0, 0, 0);

  return monday;
};

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

const formatDateRange = (startDate, endDate) => {
  const startText = [
    startDate.getFullYear(),
    padNumber(startDate.getMonth() + 1),
    padNumber(startDate.getDate()),
  ].join(".");

  const endText = [
    endDate.getFullYear(),
    padNumber(endDate.getMonth() + 1),
    padNumber(endDate.getDate()),
  ].join(".");

  return `${startText} ~ ${endText}`;
};

const getStadiumName = (stadium) => {
  const normalizedStadium = stadium?.trim().toUpperCase();

  return STADIUM_NAMES[normalizedStadium] ?? stadium ?? "경기장 미정";
};

const normalizeSupabaseMatch = (match) => {
  const matchDate = parseDateKey(match.match_date);

  return {
    id: match.external_id,
    dateKey: match.match_date,

    sport: match.sport,
    sportLabel: SPORT_LABELS[match.sport] ?? match.sport?.toUpperCase() ?? "",

    league: match.league,

    date: `${padNumber(matchDate.getMonth() + 1)}.${padNumber(
      matchDate.getDate(),
    )}`,

    day: DAY_LABELS[matchDate.getDay()],
    time: match.match_time?.slice(0, 5) ?? "미정",
    venue: getStadiumName(match.venue),

    homeTeam: getTeamInfo(match.home_team_code, match.sport),
    awayTeam: getTeamInfo(match.away_team_code, match.sport),

    homeVotes: 50,
    awayVotes: 50,

    status: match.status,
    score: match.score,
    gameType: match.game_type,
    broadcast: match.broadcast,
    note: match.note,
  };
};

const MatchSection = () => {
  const [matches, setMatches] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const weekRange = useMemo(() => {
    const weekStart = getMonday(createToday());
    const weekEnd = addDays(weekStart, 6);

    return {
      startDate: weekStart,
      endDate: weekEnd,
      startDateKey: formatDateKey(weekStart),
      endDateKey: formatDateKey(weekEnd),
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadMatches = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const { data, error } = await supabase
          .from("matches")
          .select(
            `
              external_id,
              sport,
              league,
              match_date,
              match_time,
              game_type,
              away_team_code,
              home_team_code,
              score,
              status,
              venue,
              broadcast,
              note
            `,
          )
          .gte("match_date", weekRange.startDateKey)
          .lte("match_date", weekRange.endDateKey)
          .in("sport", ["baseball", "soccer", "esports"])
          .order("match_date", {
            ascending: true,
          })
          .order("match_time", {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const normalizedMatches = (data ?? [])
          .filter(
            (match) =>
              match.match_date &&
              match.home_team_code &&
              match.away_team_code &&
              !["cancelled", "postponed"].includes(match.status),
          )
          .map(normalizeSupabaseMatch);

        setMatches(normalizedMatches);
      } catch (error) {
        console.error("홈 경기 일정 불러오기 실패", error);

        if (isMounted) {
          setLoadError("경기 일정을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMatches();

    return () => {
      isMounted = false;
    };
  }, [weekRange]);

  const filteredMatches = useMemo(() => {
    return activeFilter === "all"
      ? matches
      : matches.filter((match) => match.sport === activeFilter);
  }, [matches, activeFilter]);

  const totalPages = Math.ceil(filteredMatches.length / CARDS_PER_PAGE);
  const safeCurrentPage =
    totalPages === 0 ? 0 : Math.min(currentPage, totalPages - 1);

  const visibleMatches = useMemo(() => {
    const startIndex = safeCurrentPage * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;

    return filteredMatches.slice(startIndex, endIndex);
  }, [filteredMatches, safeCurrentPage]);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    setCurrentPage(0);
  };

  const handlePreviousPage = () => {
    setCurrentPage((previousPage) =>
      Math.max(Math.min(previousPage, safeCurrentPage) - 1, 0),
    );
  };

  const handleNextPage = () => {
    setCurrentPage((previousPage) =>
      Math.min(Math.max(previousPage, safeCurrentPage) + 1, totalPages - 1),
    );
  };

  return (
    <section className={styles.matchSection}>
      <div className={`container ${styles.inner}`}>
        <MatchFilter
          filters={FILTERS}
          activeFilter={activeFilter}
          onChange={handleFilterChange}
        />

        <header className={styles.sectionHeader}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>MATCHES</h2>

            <p className={styles.dateRange}>
              {formatDateRange(weekRange.startDate, weekRange.endDate)}
            </p>
          </div>

          <div className={styles.navigation}>
            <button
              type="button"
              className={styles.navigationButton}
              aria-label="이전 경기 보기"
              onClick={handlePreviousPage}
              disabled={safeCurrentPage === 0}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5L8 12L15 19" />
              </svg>
            </button>

            <button
              type="button"
              className={styles.navigationButton}
              aria-label="다음 경기 보기"
              onClick={handleNextPage}
              disabled={safeCurrentPage >= totalPages - 1}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5L16 12L9 19" />
              </svg>
            </button>
          </div>
        </header>

        {isLoading ? (
          <p className={styles.emptyMessage}>경기 일정을 불러오는 중입니다.</p>
        ) : loadError ? (
          <p className={styles.emptyMessage}>{loadError}</p>
        ) : filteredMatches.length > 0 ? (
          <div className={styles.matchList}>
            {visibleMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyMessage}>예정된 경기가 없습니다.</p>
        )}
      </div>
    </section>
  );
};

export default MatchSection;
