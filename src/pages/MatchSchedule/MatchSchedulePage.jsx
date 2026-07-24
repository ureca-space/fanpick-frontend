import { useEffect, useMemo, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import EmptyState from "../../components/EmptyState/EmptyState";
import MatchCard from "../../components/MatchCard/MatchCard";
import MatchCardSkeleton from "../../components/MatchCard/MatchCardSkeleton";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import SearchInput from "../../components/SearchInput/SearchInput";
import SubNav from "../../components/SubNav/SubNav";
import WeekDateSelector from "../../components/WeekDateSelector/WeekDateSelector";
import { MATCH_CENTER_SUB_NAV_ITEMS } from "../../constants/matchCenterNav";
import useAuth from "../../contexts/useAuth";
import { supabase } from "../../lib/supabase";
import { subscribeToMatchChanges } from "../../services/matchRealtime";
import {
  applyPredictionStatsToMatches,
  fetchMatchPredictionStats,
  fetchMyPredictionSelections,
  markPredictedMatches,
} from "../../services/predictionApi";
import { normalizeMatchTimingStatus } from "../../utils/matchStatus";
import styles from "./MatchSchedulePage.module.css";

const FILTERS = [
  { id: "all", label: "ALL" },
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "esports", label: "LOL" },
];

const SUPPORTED_SPORT_IDS = new Set(
  FILTERS.filter((filter) => filter.id !== "all").map((filter) => filter.id),
);

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const SPORT_LABELS = {
  baseball: "BASEBALL",
  soccer: "SOCCER",
  esports: "LOL",
};

const KLEAGUE_LOGO_URL = "https://www.kleague.com/assets/images/emblem";

const TEAM_INFO = {
  // KBO
  DOOSAN: {
    name: "두산 베어스",
    shortName: "DOOSAN",
    logo: "/logos/doosan.png",
  },
  NC: {
    name: "NC 다이노스",
    shortName: "NC",
    logo: "/logos/nc.png",
  },
  LG: {
    name: "LG 트윈스",
    shortName: "LG",
    logo: "/logos/lg.png",
  },
  KIA: {
    name: "KIA 타이거즈",
    shortName: "KIA",
    logo: "/logos/kia.png",
  },
  SAMSUNG: {
    name: "삼성 라이온즈",
    shortName: "SAMSUNG",
    logo: "/logos/samsung.png",
  },
  LOTTE: {
    name: "롯데 자이언츠",
    shortName: "LOTTE",
    logo: "/logos/lotte.png",
  },
  HANWHA: {
    name: "한화 이글스",
    shortName: "HANWHA",
    logo: "/logos/hanwha.png",
  },
  SSG: {
    name: "SSG 랜더스",
    shortName: "SSG",
    logo: "/logos/ssg.png",
  },
  KIWOOM: {
    name: "키움 히어로즈",
    shortName: "KIWOOM",
    logo: "/logos/kiwoom.png",
  },
  KT: {
    name: "KT 위즈",
    shortName: "KT",
    logo: "/logos/kt.png",
  },

  // K리그
  K01: {
    name: "울산 HD FC",
    shortName: "울산",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K01.png`,
  },
  K02: {
    name: "수원 삼성 블루윙즈",
    shortName: "수원",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K02.png`,
  },
  K03: {
    name: "포항 스틸러스",
    shortName: "포항",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K03.png`,
  },
  K04: {
    name: "제주SK FC",
    shortName: "제주",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K04.png`,
  },
  K05: {
    name: "전북 현대 모터스",
    shortName: "전북",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K05.png`,
  },
  K06: {
    name: "부산 아이파크",
    shortName: "부산",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K06.png`,
  },
  K07: {
    name: "전남 드래곤즈",
    shortName: "전남",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K07.png`,
  },
  K08: {
    name: "성남 FC",
    shortName: "성남",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K08.png`,
  },
  K09: {
    name: "FC 서울",
    shortName: "서울",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K09.png`,
  },
  K10: {
    name: "대전 하나시티즌",
    shortName: "대전",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K10.png`,
  },
  K17: {
    name: "대구 FC",
    shortName: "대구",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K17.png`,
  },
  K18: {
    name: "인천 유나이티드",
    shortName: "인천",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K18.png`,
  },
  K20: {
    name: "경남 FC",
    shortName: "경남",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K20.png`,
  },
  K21: {
    name: "강원 FC",
    shortName: "강원",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K21.png`,
  },
  K22: {
    name: "광주 FC",
    shortName: "광주",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K22.png`,
  },
  K26: {
    name: "부천 FC 1995",
    shortName: "부천",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K26.png`,
  },
  K27: {
    name: "FC 안양",
    shortName: "안양",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K27.png`,
  },
  K29: {
    name: "수원 FC",
    shortName: "수원FC",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K29.png`,
  },
  K31: {
    name: "서울 이랜드 FC",
    shortName: "서울E",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K31.png`,
  },
  K32: {
    name: "안산 그리너스 FC",
    shortName: "안산",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K32.png`,
  },
  K34: {
    name: "충남아산 FC",
    shortName: "충남아산",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K34.png`,
  },
  K35: {
    name: "김천 상무",
    shortName: "김천",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K35.png`,
  },
  K36: {
    name: "김포 FC",
    shortName: "김포",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K36.png`,
  },
  K37: {
    name: "충북청주 FC",
    shortName: "충북청주",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K37.png`,
  },
  K38: {
    name: "천안 시티 FC",
    shortName: "천안",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K38.png`,
  },
  K39: {
    name: "화성 FC",
    shortName: "화성",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K39.png`,
  },
  K40: {
    name: "파주프런티어FC",
    shortName: "파주",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K40.png`,
  },
  K41: {
    name: "김해FC2008",
    shortName: "김해",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K41.png`,
  },
  K42: {
    name: "용인FC",
    shortName: "용인",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K42.png`,
  },
};

const LCK_TEAM_INFO = {
  T1: {
    name: "T1",
    shortName: "T1",
    logo: "https://cdn-api.pandascore.co/images/team/image/126061/t_oscq04.png",
  },
  GEN: {
    name: "Gen.G",
    shortName: "GEN",
    logo: "https://cdn-api.pandascore.co/images/team/image/2882/699px_gen.g_esports_2026_allmode.png",
  },
  HLE: {
    name: "한화생명 e스포츠",
    shortName: "HLE",
    logo: "https://cdn-api.pandascore.co/images/team/image/2883/hanwha-life-esports-1s04vbu0.png",
  },
  DK: {
    name: "Dplus KIA",
    shortName: "DK",
    logo: "https://cdn-api.pandascore.co/images/team/image/132531/800px_dplus_lightmode.png",
  },
  KT: {
    name: "KT Rolster",
    shortName: "KT",
    logo: "https://cdn-api.pandascore.co/images/team/image/63/kt_rolsterlogo_profile.png",
  },
  KRX: {
    name: "Kiwoom DRX",
    shortName: "KRX",
    logo: "https://cdn-api.pandascore.co/images/team/image/126370/220px_dr_xlogo_square.png",
  },
  NS: {
    name: "농심 레드포스",
    shortName: "NS",
    logo: "https://cdn-api.pandascore.co/images/team/image/128217/nongshim_red_forcelogo_square.png",
  },
  BFX: {
    name: "BNK FEARX",
    shortName: "BFX",
    logo: "https://cdn-api.pandascore.co/images/team/image/134115/663px_fear_x_icon_lightmode.png",
  },
  DNS: {
    name: "DN SOOPers",
    shortName: "DNS",
    logo: "https://cdn-api.pandascore.co/images/team/image/136063/dn_soo_perslogo_profile.png",
  },
  BRO: {
    name: "HANJIN BRION",
    shortName: "BRO",
    logo: "https://cdn-api.pandascore.co/images/team/image/128218/628px_brion_2023_lightmode.png",
  },
};

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

const addDays = (date, amount) => {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + amount);

  return nextDate;
};

const getMonday = (date) => {
  const currentDate = new Date(date);
  const currentDay = currentDate.getDay();
  const difference = currentDay === 0 ? -6 : 1 - currentDay;

  currentDate.setDate(currentDate.getDate() + difference);
  currentDate.setHours(12, 0, 0, 0);

  return currentDate;
};

const getTeamInfo = (teamCode, sport) => {
  const normalizedCode = teamCode?.trim().toUpperCase();

  const teamInfo =
    sport === "esports"
      ? LCK_TEAM_INFO[normalizedCode]
      : TEAM_INFO[normalizedCode];

  return (
    teamInfo ?? {
      name: teamCode || "미정",
      shortName: teamCode || "-",
      logo: "",
    }
  );
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
    status: match.status,
  });

  const homeTeam = getTeamInfo(match.home_team_code, match.sport);
  const awayTeam = getTeamInfo(match.away_team_code, match.sport);

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

    homeTeam,
    awayTeam,

    homeVotes: 50,
    awayVotes: 50,

    status: timingStatus.status,
    score: timingStatus.score,
    gameType: match.game_type,
    broadcast: match.broadcast,
    note: match.note,
  };
};

const includesSearchKeyword = (match, searchKeyword) => {
  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return true;
  }

  const searchableText = [
    match.sportLabel,
    match.league,
    match.venue,
    match.homeTeam.name,
    match.homeTeam.shortName,
    match.awayTeam.name,
    match.awayTeam.shortName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedKeyword);
};

const MatchSchedulePage = () => {
  const { user } = useAuth();
  const userId = user?.id || "";

  const [matches, setMatches] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [weekStart, setWeekStart] = useState(() => getMonday(createToday()));

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateKey(createToday()),
  );

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
              SUPPORTED_SPORT_IDS.has(match.sport) &&
              match.match_date &&
              match.home_team_code &&
              match.away_team_code,
          )
          .map(normalizeSupabaseMatch);

        const [predictionStats, myPredictions] = await Promise.all([
          fetchMatchPredictionStats(),
          userId
            ? fetchMyPredictionSelections(
                userId,
                normalizedMatches.map((match) => match.databaseId),
              ).catch((error) => {
                console.error("경기 일정 예측 여부 조회 실패", error);
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
        console.error("경기 일정 불러오기 실패", error);

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
      channelName: "match-schedule-matches",
      onChange: () => loadMatches({ showLoading: false }),
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [userId]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);

      return {
        date,
        dateKey: formatDateKey(date),
        dayLabel: DAY_LABELS[date.getDay()],
      };
    });
  }, [weekStart]);

  const searchedMatches = useMemo(() => {
    return matches.filter((match) => {
      const isSameSport =
        activeFilter === "all" || match.sport === activeFilter;

      const isIncludedSearchKeyword = includesSearchKeyword(
        match,
        searchKeyword,
      );

      return isSameSport && isIncludedSearchKeyword;
    });
  }, [matches, activeFilter, searchKeyword]);

  const filteredMatches = useMemo(() => {
    return searchedMatches.filter((match) => match.dateKey === selectedDate);
  }, [searchedMatches, selectedDate]);

  const handleMoveWeek = (weekAmount) => {
    const nextWeekStart = addDays(weekStart, weekAmount * 7);

    setWeekStart(nextWeekStart);
    setSelectedDate(formatDateKey(nextWeekStart));
  };

  const handleMoveToCurrentWeek = () => {
    const today = createToday();

    setWeekStart(getMonday(today));
    setSelectedDate(formatDateKey(today));
  };

  const hasMatchOnDate = (dateKey) => {
    return searchedMatches.some((match) => match.dateKey === dateKey);
  };

  return (
    <>
      <SubNav
        ariaLabel="매치 센터 메뉴"
        items={MATCH_CENTER_SUB_NAV_ITEMS}
      />

      <section className={styles.schedulePage}>
        <div className="container">
          <header className={styles.pageHeader}>
            <p className={styles.eyebrow}>FANPICK MATCH CENTER</p>

            <h1 className={styles.title}>MATCH SCHEDULE</h1>

            <p className={styles.description}>
              주요 경기 일정을 확인하고 원하는 경기를 선택해 보세요.
            </p>
          </header>

          <div className={styles.controlArea}>
            <div className={styles.filterArea}>
              <MatchFilter
                filters={FILTERS}
                activeFilter={activeFilter}
                onChange={setActiveFilter}
              />
            </div>

            <div className={styles.searchArea}>
              <SearchInput
                value={searchKeyword}
                onChange={setSearchKeyword}
                placeholder="팀 이름을 검색해보세요"
                ariaLabel="경기 검색"
                debounceDelay={500}
              />
            </div>
          </div>

          <WeekDateSelector
            className={styles.schedulePanel}
            dates={weekDates}
            selectedDate={selectedDate}
            onMoveWeek={handleMoveWeek}
            onMoveToCurrentWeek={handleMoveToCurrentWeek}
            onSelectDate={setSelectedDate}
            hasItemOnDate={hasMatchOnDate}
          />

          <div className={styles.resultHeader}>
            <div>
              <p className={styles.resultDate}>
                {selectedDate.replaceAll("-", ".")}
              </p>

              <h2 className={styles.resultTitle}>MATCHES</h2>
            </div>

            <span className={styles.matchCount}>
              {filteredMatches.length} MATCHES
            </span>
          </div>

          {isLoading ? (
            <div className={styles.matchList} aria-label="경기 일정 로딩 중">
              {Array.from({ length: 8 }, (_, index) => (
                <MatchCardSkeleton key={index} />
              ))}
            </div>
          ) : loadError ? (
            <EmptyState
              icon={FiCalendar}
              title={loadError}
              description="Supabase 연결 상태와 조회 권한을 확인해 주세요."
            />
          ) : filteredMatches.length > 0 ? (
            <div className={styles.matchList}>
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FiCalendar}
              title={
                searchKeyword.trim()
                  ? "검색 조건에 맞는 경기가 없습니다."
                  : "예정된 경기가 없습니다."
              }
              description="다른 날짜, 종목 또는 검색어를 선택해 주세요."
            />
          )}
        </div>
      </section>
    </>
  );
};

export default MatchSchedulePage;
