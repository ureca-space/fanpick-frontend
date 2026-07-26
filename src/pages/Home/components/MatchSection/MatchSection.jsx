import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../../../components/EmptyState/EmptyState";
import MatchCard from "../../../../components/MatchCard/MatchCard";
import MatchCardSkeleton from "../../../../components/MatchCard/MatchCardSkeleton";
import MatchFilter from "../../../../components/MatchFilter/MatchFilter";
import PaginationControls from "../../../../components/PaginationControls/PaginationControls";
import ViewAllLink from "../../../../components/ViewAllLink/ViewAllLink";
import { getTeamInfo } from "../../../../constants/teamInfo";
import useAuth from "../../../../contexts/useAuth";
import { supabase } from "../../../../lib/supabase";
import {
  applyPredictionStatsToMatches,
  fetchMatchPredictionStats,
  fetchMyPredictionSelections,
  markPredictedMatches,
} from "../../../../services/predictionApi";
import { subscribeToMatchChanges } from "../../../../services/matchRealtime";
import { normalizeMatchTimingStatus } from "../../../../utils/matchStatus";
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
const HOME_MATCH_STATUS_PRIORITY = {
  live: 0,
  scheduled: 1,
  finished: 3,
};

const padNumber = (number) => String(number).padStart(2, "0");

const createToday = () => {
  const today = new Date();

  today.setHours(12, 0, 0, 0);

  return today;
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

const formatDateLabel = (date) => {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join(".");
};

const getStadiumName = (stadium) => {
  const normalizedStadium = stadium?.trim().toUpperCase();

  return STADIUM_NAMES[normalizedStadium] ?? stadium ?? "경기장 미정";
};

const normalizeSupabaseMatch = (match) => {
  const matchDate = parseDateKey(match.match_date);
  const time = match.match_time?.slice(0, 5) ?? "미정";
  const timingStatus = normalizeMatchTimingStatus({
    matchDate: match.match_date,
    matchTime: time,
    score: match.score,
    sport: match.sport,
    status: match.status,
  });

  return {
    id: match.external_id ?? `match-${match.id}`,
    databaseId: match.id,
    dateKey: match.match_date,

    sport: match.sport,
    sportLabel: SPORT_LABELS[match.sport] ?? match.sport?.toUpperCase() ?? "",

    league: match.league,

    date: `${padNumber(matchDate.getMonth() + 1)}.${padNumber(
      matchDate.getDate(),
    )}`,

    day: DAY_LABELS[matchDate.getDay()],
    time,
    venue: getStadiumName(match.venue),

    homeTeam: getTeamInfo(match.home_team_code, match.sport),
    awayTeam: getTeamInfo(match.away_team_code, match.sport),

    homeVotes: 50,
    awayVotes: 50,

    status: timingStatus.status,
    score: timingStatus.score,
    gameType: match.game_type,
    broadcast: match.broadcast,
    note: match.note,
  };
};

const getMatchTimeValue = (match) => {
  const [year, month, day] = match.dateKey.split("-").map(Number);
  const [hourText, minuteText] = match.time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const matchDateTime = new Date(
    year,
    month - 1,
    day,
    Number.isFinite(hour) ? hour : 23,
    Number.isFinite(minute) ? minute : 59,
  );

  return matchDateTime.getTime();
};

const getHomeMatchPriority = (match) => {
  if (match.status !== "scheduled") {
    return HOME_MATCH_STATUS_PRIORITY[match.status] ?? 2;
  }

  return getMatchTimeValue(match) >= Date.now() ? 1 : 2;
};

const sortHomeMatches = (firstMatch, secondMatch) => {
  const firstPriority = getHomeMatchPriority(firstMatch);
  const secondPriority = getHomeMatchPriority(secondMatch);

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority;
  }

  const firstTime = getMatchTimeValue(firstMatch);
  const secondTime = getMatchTimeValue(secondMatch);

  if (firstPriority === HOME_MATCH_STATUS_PRIORITY.finished) {
    return secondTime - firstTime;
  }

  return firstTime - secondTime;
};

const MatchSection = () => {
  const { user } = useAuth();
  const userId = user?.id || "";

  const [matches, setMatches] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const todayInfo = useMemo(() => {
    const today = createToday();

    return {
      date: today,
      dateKey: formatDateKey(today),
      label: formatDateLabel(today),
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadMatches = async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setIsLoading(true);
          setLoadError("");
        }

        const { data, error } = await supabase
          .from("matches")
          .select(
            `
              id,
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
          .eq("match_date", todayInfo.dateKey)
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

        const [predictionStats, myPredictions] = await Promise.all([
          fetchMatchPredictionStats(),
          userId
            ? fetchMyPredictionSelections(
                userId,
                normalizedMatches.map((match) => match.databaseId),
              ).catch((error) => {
                console.error("홈 예측 여부 조회 실패", error);
                return [];
              })
            : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        setMatches(
          markPredictedMatches(
            applyPredictionStatsToMatches(normalizedMatches, predictionStats),
            myPredictions,
          ),
        );
      } catch (error) {
        console.error("홈 경기 일정 불러오기 실패", error);

        if (isMounted && showLoading) {
          setLoadError("경기 일정을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted && showLoading) {
          setIsLoading(false);
        }
      }
    };

    loadMatches();

    const unsubscribe = subscribeToMatchChanges({
      channelName: "home-today-matches",
      onChange: () => loadMatches({ showLoading: false }),
      shouldHandlePayload: ({ new: nextMatch }) => {
        if (!nextMatch?.match_date) {
          return true;
        }

        return nextMatch.match_date === todayInfo.dateKey;
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [todayInfo, userId]);

  const filteredMatches = useMemo(() => {
    const nextMatches =
      activeFilter === "all"
        ? matches
        : matches.filter((match) => match.sport === activeFilter);

    return [...nextMatches].sort(sortHomeMatches);
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

            <p className={styles.dateRange}>{todayInfo.label}</p>
          </div>

          <PaginationControls
            ariaLabel="홈 경기 페이지 이동"
            className={styles.navigationControls}
            currentPage={safeCurrentPage}
            nextLabel="다음 경기 보기"
            onNext={handleNextPage}
            onPrevious={handlePreviousPage}
            previousLabel="이전 경기 보기"
            totalPages={totalPages}
          />
        </header>

        <div className={styles.viewAllRow}>
          <ViewAllLink to="/matches" />
        </div>

        {isLoading ? (
          <div className={styles.matchList} aria-label="경기 일정 로딩 중">
            {Array.from({ length: CARDS_PER_PAGE }, (_, index) => (
              <MatchCardSkeleton key={index} />
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            title={loadError}
            description="잠시 후 다시 시도해 주세요."
          />
        ) : filteredMatches.length > 0 ? (
          <div className={styles.matchList}>
            {visibleMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="오늘 예정된 경기가 없습니다."
            description="전체 경기 일정에서 다른 날짜를 확인해 주세요."
          />
        )}
      </div>
    </section>
  );
};

export default MatchSection;
