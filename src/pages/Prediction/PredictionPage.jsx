import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EmptyState from "../../components/EmptyState/EmptyState";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import SearchInput from "../../components/SearchInput/SearchInput";
import WeekDateSelector from "../../components/WeekDateSelector/WeekDateSelector";
import useAuth from "../../contexts/useAuth";
import { supabase } from "../../lib/supabase";
import {
  applyPredictionStatsToMatches,
  createSettledPredictionSportStats,
  fetchMatchPredictionStats,
  fetchMyPredictions,
} from "../../services/predictionApi";
import { getPredictionBadgeMeta } from "../../utils/predictionBadge";
import {
  canChangePredictionByBeginAt,
  createMatchBeginAt,
} from "../../utils/predictionDeadline";
import MyPredictionCard, {
  MyPredictionCardSkeleton,
} from "./components/MyPredictionCard/MyPredictionCard";
import TodayMatchCard, {
  TodayMatchCardSkeleton,
} from "./components/TodayMatchCard/TodayMatchCard";
import styles from "./PredictionPage.module.css";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// - 종목 필터 버튼 목록
const FILTERS = [
  { id: "all", label: "ALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "baseball", label: "BASEBALL" },
  { id: "esports", label: "LOL" },
];
const PREDICTION_SPORTS = FILTERS.filter((filter) => filter.id !== "all").map(
  (filter) => filter.id,
);

// - MatchSchedulePage의 팀 코드와 동일한 KBO/LCK 팀 정보
const KBO_TEAMS = {
  DOOSAN: { name: "두산 베어스", logo: "/logos/doosan.png" },
  NC: { name: "NC 다이노스", logo: "/logos/nc.png" },
  LG: { name: "LG 트윈스", logo: "/logos/lg.png" },
  KIA: { name: "KIA 타이거즈", logo: "/logos/kia.png" },
  SAMSUNG: { name: "삼성 라이온즈", logo: "/logos/samsung.png" },
  LOTTE: { name: "롯데 자이언츠", logo: "/logos/lotte.png" },
  HANWHA: { name: "한화 이글스", logo: "/logos/hanwha.png" },
  SSG: { name: "SSG 랜더스", logo: "/logos/ssg.png" },
  KIWOOM: { name: "키움 히어로즈", logo: "/logos/kiwoom.png" },
  KT: { name: "KT 위즈", logo: "/logos/kt.png" },
};

const KLEAGUE_LOGO_URL = "https://www.kleague.com/assets/images/emblem";

// - MatchSchedulePage와 동일한 K리그 팀 정보
const KLEAGUE_TEAMS = {
  K01: { name: "울산 HD FC", shortName: "울산" },
  K02: { name: "수원 삼성 블루윙즈", shortName: "수원" },
  K03: { name: "포항 스틸러스", shortName: "포항" },
  K04: { name: "제주SK FC", shortName: "제주" },
  K05: { name: "전북 현대 모터스", shortName: "전북" },
  K06: { name: "부산 아이파크", shortName: "부산" },
  K07: { name: "전남 드래곤즈", shortName: "전남" },
  K08: { name: "성남 FC", shortName: "성남" },
  K09: { name: "FC 서울", shortName: "서울" },
  K10: { name: "대전 하나시티즌", shortName: "대전" },
  K17: { name: "대구 FC", shortName: "대구" },
  K18: { name: "인천 유나이티드", shortName: "인천" },
  K20: { name: "경남 FC", shortName: "경남" },
  K21: { name: "강원 FC", shortName: "강원" },
  K22: { name: "광주 FC", shortName: "광주" },
  K26: { name: "부천 FC 1995", shortName: "부천" },
  K27: { name: "FC 안양", shortName: "안양" },
  K29: { name: "수원 FC", shortName: "수원FC" },
  K31: { name: "서울 이랜드 FC", shortName: "서울E" },
  K32: { name: "안산 그리너스 FC", shortName: "안산" },
  K34: { name: "충남아산 FC", shortName: "충남아산" },
  K35: { name: "김천 상무", shortName: "김천" },
  K36: { name: "김포 FC", shortName: "김포" },
  K37: { name: "충북청주 FC", shortName: "충북청주" },
  K38: { name: "천안 시티 FC", shortName: "천안" },
  K39: { name: "화성 FC", shortName: "화성" },
  K40: { name: "파주프런티어FC", shortName: "파주" },
  K41: { name: "김해FC2008", shortName: "김해" },
  K42: { name: "용인FC", shortName: "용인" },
};

Object.entries(KLEAGUE_TEAMS).forEach(([code, team]) => {
  team.logo = `${KLEAGUE_LOGO_URL}/emblem_${code}.png`;
});

const LCK_TEAMS = {
  T1: {
    name: "T1",
    logo: "https://cdn-api.pandascore.co/images/team/image/126061/t_oscq04.png",
  },
  GEN: {
    name: "Gen.G",
    logo: "https://cdn-api.pandascore.co/images/team/image/2882/699px_gen.g_esports_2026_allmode.png",
  },
  HLE: {
    name: "한화생명 e스포츠",
    logo: "https://cdn-api.pandascore.co/images/team/image/2883/hanwha-life-esports-1s04vbu0.png",
  },
  DK: {
    name: "Dplus KIA",
    logo: "https://cdn-api.pandascore.co/images/team/image/132531/800px_dplus_lightmode.png",
  },
  KT: {
    name: "KT Rolster",
    logo: "https://cdn-api.pandascore.co/images/team/image/63/kt_rolsterlogo_profile.png",
  },
  KRX: {
    name: "Kiwoom DRX",
    logo: "https://cdn-api.pandascore.co/images/team/image/126370/220px_dr_xlogo_square.png",
  },
  NS: {
    name: "농심 레드포스",
    logo: "https://cdn-api.pandascore.co/images/team/image/128217/nongshim_red_forcelogo_square.png",
  },
  BFX: {
    name: "BNK FEARX",
    logo: "https://cdn-api.pandascore.co/images/team/image/134115/663px_fear_x_icon_lightmode.png",
  },
  DNS: {
    name: "DN SOOPers",
    logo: "https://cdn-api.pandascore.co/images/team/image/136063/dn_soo_perslogo_profile.png",
  },
  BRO: {
    name: "HANJIN BRION",
    logo: "https://cdn-api.pandascore.co/images/team/image/128218/628px_brion_2023_lightmode.png",
  },
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
  const code = teamCode?.trim().toUpperCase() ?? "";
  const teams =
    sport === "esports"
      ? LCK_TEAMS
      : sport === "soccer"
        ? KLEAGUE_TEAMS
        : KBO_TEAMS;
  const team = teams[code];

  return {
    id: code,
    name: team?.name ?? teamCode ?? "미정",
    shortName: (team?.shortName ?? code) || "-",
    logo: team?.logo ?? "",
  };
};

// - matches 테이블의 "원정점수:홈점수" 형식 분리
const parseScore = (score) => {
  if (!score) return { homeScore: null, awayScore: null };

  const [awayScore, homeScore] = score.split(":").map(Number);

  return {
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
  };
};

// - MatchSchedulePage의 Supabase 경기 데이터를 예측 카드 형식으로 변환
const normalizeSupabaseMatch = (match) => {
  const sport = match.sport;
  const time = match.match_time?.slice(0, 5) ?? "--:--";
  const { homeScore, awayScore } = parseScore(match.score);

  return {
    id: `match-${match.id}`,
    databaseId: match.id,
    dateKey: match.match_date,
    beginAt: createMatchBeginAt(
      match.match_date,
      time === "--:--" ? "00:00" : time,
    ),
    sport,
    sportLabel:
      sport === "esports" ? "LOL" : sport === "soccer" ? "SOCCER" : "BASEBALL",
    league: match.league,
    time,
    status: match.status,
    participants: 0,
    homeRate: 50,
    homeTeam: getTeamInfo(match.home_team_code, sport),
    awayTeam: getTeamInfo(match.away_team_code, sport),
    homeScore,
    awayScore,
    isFinished: match.status === "finished",
  };
};

// - MatchSchedulePage와 같은 Supabase matches 테이블 조회 방식
const fetchPredictionMatches = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
        id,
        sport,
        league,
        match_date,
        match_time,
        away_team_code,
        home_team_code,
        score,
        status
      `,
    )
    .in("sport", ["baseball", "esports", "soccer"])
    .gte("match_date", startDate)
    .lte("match_date", endDate)
    .order("match_date", { ascending: true })
    .order("match_time", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter(
      (match) =>
        match.match_date &&
        match.home_team_code &&
        match.away_team_code,
    )
    .map(normalizeSupabaseMatch);
};

const PredictionPage = () => {
  const [searchParams] = useSearchParams();
  const { user, isAuthLoading } = useAuth();
  const targetMatchId = searchParams.get("matchId")?.replace(/^match-/, "");
  const targetTeamCode = searchParams.get("team")?.trim().toUpperCase() ?? "";
  const handledAutoPredictionRef = useRef("");
  const targetMatchCardRef = useRef(null);
  const scrolledTargetMatchRef = useRef("");

  // - API 경기 목록
  const [matches, setMatches] = useState([]);

  // - 화면 상태
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [weekStart, setWeekStart] = useState(() => getMonday(createToday()));
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateKey(createToday()),
  );

  // - 사용자가 선택한 예측
  const [predictions, setPredictions] = useState({});
  const [predictionResults, setPredictionResults] = useState({});
  const [arePredictionsLoading, setArePredictionsLoading] = useState(false);
  const [sportStats, setSportStats] = useState([]);
  const [savingMatchId, setSavingMatchId] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    if (!targetMatchId) {
      return undefined;
    }

    let isMounted = true;

    const openTargetMatchWeek = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("match_date")
        .eq("id", targetMatchId)
        .maybeSingle();

      if (error) {
        console.error("예측 대상 경기 조회 오류:", error);
        return;
      }

      if (!isMounted || !data?.match_date) {
        return;
      }

      const matchDate = parseDateKey(data.match_date);

      setActiveTab("today");
      setWeekStart(getMonday(matchDate));
      setSelectedDate(data.match_date);
    };

    openTargetMatchWeek();

    return () => {
      isMounted = false;
    };
  }, [targetMatchId]);

  useEffect(() => {
    scrolledTargetMatchRef.current = "";
  }, [targetMatchId]);

  // - 경기 시작 시간이 되면 서버 갱신을 기다리지 않고 화면을 바로 변경
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1_000);

    return () => clearInterval(timer);
  }, []);

  // - 페이지 진입 및 탭 이동 시 Supabase에서 최신 통계 조회
  useEffect(() => {
    let isMounted = true;

    const loadPredictionStats = async () => {
      if (isAuthLoading) return;

      if (!user) {
        setSportStats([]);
        return;
      }

      try {
        const data = await fetchMyPredictions(user.id);

        if (isMounted) {
          setSportStats(
            createSettledPredictionSportStats(data, PREDICTION_SPORTS),
          );
        }
      } catch (error) {
        console.error("예측 통계 조회 오류:", error);
      }
    };

    loadPredictionStats();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading, activeTab]);

  // - 로그인한 사용자의 저장된 예측 불러오기
  useEffect(() => {
    let isMounted = true;

    const fetchPredictions = async () => {
      if (isAuthLoading) return;

      if (!user) {
        setPredictions({});
        setPredictionResults({});
        setArePredictionsLoading(false);
        return;
      }

      setArePredictionsLoading(true);

      const { data, error } = await supabase
        .from("predictions")
        .select(
          `
            match_id,
            selected_team_code,
            result,
            matches (home_team_code, away_team_code)
          `,
        )
        .eq("user_id", user.id);

      if (error) {
        console.error("예측 조회 오류:", error);
        if (isMounted) {
          setArePredictionsLoading(false);
        }
        return;
      }

      if (!isMounted) return;

      const savedPredictions = Object.fromEntries(
        (data ?? []).map((prediction) => {
          const selectedCode = prediction.selected_team_code?.toUpperCase();
          const homeCode = prediction.matches?.home_team_code?.toUpperCase();
          const selection = selectedCode === homeCode ? "home" : "away";

          return [`match-${prediction.match_id}`, selection];
        }),
      );

      const savedResults = Object.fromEntries(
        (data ?? []).map((prediction) => [
          `match-${prediction.match_id}`,
          prediction.result,
        ]),
      );

      setPredictions(savedPredictions);
      setPredictionResults(savedResults);
      setArePredictionsLoading(false);
    };

    fetchPredictions();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading, activeTab]);

  useEffect(() => {
    let isMounted = true;

    // - Supabase에서 K리그/KBO/LCK 경기 불러오기
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        setApiError("");

        const startDate = formatDateKey(weekStart);
        const endDate = formatDateKey(addDays(weekStart, 6));

        const [supabaseMatches, predictionStats] = await Promise.all([
          fetchPredictionMatches(startDate, endDate),
          fetchMatchPredictionStats(),
        ]);

        if (!isMounted) return;

        setMatches(
          applyPredictionStatsToMatches(supabaseMatches, predictionStats, {
            awayRateKey: "awayRate",
            homeRateKey: "homeRate",
          }).sort((a, b) => new Date(a.beginAt) - new Date(b.beginAt)),
        );
      } catch (error) {
        console.error("경기 API 호출 오류:", error);

        if (isMounted) {
          setApiError(error.message ?? "경기를 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // - 페이지 진입 시 즉시 호출
    fetchGames();

    // - 1분마다 경기 상태 갱신
    const timer = setInterval(fetchGames, 60_000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [weekStart]);

  // - 기존 예측은 경기 시작 30분 전까지만 변경 가능
  const handlePrediction = useCallback(
    async (match, selection) => {
      if (!user) {
        alert("로그인 후 예측할 수 있습니다.");
        return;
      }

      const hasExistingPrediction = Boolean(predictions[match.id]);
      const matchBeginTime = new Date(match.beginAt).getTime();

      if (
        savingMatchId === match.id ||
        !Number.isFinite(matchBeginTime) ||
        Date.now() >= matchBeginTime
      ) {
        return;
      }

      if (
        hasExistingPrediction &&
        !canChangePredictionByBeginAt(match.beginAt)
      ) {
        alert("경기 시작 30분 전부터는 투표를 변경할 수 없습니다.");
        return;
      }

      const selectedTeamCode =
        selection === "home" ? match.homeTeam.id : match.awayTeam.id;

      setSavingMatchId(match.id);

      const { data, error } = await supabase
        .from("predictions")
        .upsert(
          {
            user_id: user.id,
            match_id: match.databaseId,
            selected_team_code: selectedTeamCode,
          },
          {
            onConflict: "user_id,match_id",
          },
        )
        .select("result")
        .single();

      setSavingMatchId(null);

      if (error) {
        console.error("예측 저장 오류:", error);
        alert(`예측을 저장하지 못했습니다.\n${error.message}`);
        return;
      }

      setPredictions((previous) => ({
        ...previous,
        [match.id]: selection,
      }));
      setPredictionResults((previous) => ({
        ...previous,
        [match.id]: data.result,
      }));

      // - 저장 직후 서버에서 최신 참여자 수와 투표 비율 다시 받기
      try {
        const latestStats = await fetchMatchPredictionStats();
        setMatches((previous) =>
          applyPredictionStatsToMatches(previous, latestStats, {
            awayRateKey: "awayRate",
            homeRateKey: "homeRate",
          }),
        );
      } catch (statsError) {
        console.error("경기 투표 통계 조회 오류:", statsError);
      }
    },
    [predictions, savingMatchId, user],
  );

  useEffect(() => {
    if (
      !targetMatchId ||
      !targetTeamCode ||
      isAuthLoading ||
      !user ||
      isLoading ||
      arePredictionsLoading ||
      savingMatchId
    ) {
      return;
    }

    const targetMatch = matches.find(
      (match) => String(match.databaseId) === String(targetMatchId),
    );

    if (!targetMatch) {
      return;
    }

    const selection =
      targetTeamCode === targetMatch.homeTeam.id
        ? "home"
        : targetTeamCode === targetMatch.awayTeam.id
          ? "away"
          : "";

    if (!selection) {
      return;
    }

    if (predictions[targetMatch.id] === selection) {
      return;
    }

    if (
      predictions[targetMatch.id] &&
      !canChangePredictionByBeginAt(targetMatch.beginAt)
    ) {
      return;
    }

    const autoPredictionKey = `${targetMatchId}:${targetTeamCode}`;

    if (handledAutoPredictionRef.current === autoPredictionKey) {
      return;
    }

    handledAutoPredictionRef.current = autoPredictionKey;
    handlePrediction(targetMatch, selection);
  }, [
    arePredictionsLoading,
    handlePrediction,
    isAuthLoading,
    isLoading,
    matches,
    predictions,
    savingMatchId,
    targetMatchId,
    targetTeamCode,
    user,
  ]);

  // - 선택한 주의 월요일부터 일요일까지 생성
  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);

        return {
          date,
          dateKey: formatDateKey(date),
          dayLabel: DAY_LABELS[date.getDay()],
        };
      }),
    [weekStart],
  );

  // - 선택한 날짜, 종목, 검색어, 탭에 맞는 경기만 표시
  const filteredMatches = useMemo(
    () => {
      const normalizedKeyword = searchKeyword.trim().toLowerCase();

      return matches
        .filter((match) => {
          const searchableText = [
            match.homeTeam?.name,
            match.homeTeam?.shortName,
            match.awayTeam?.name,
            match.awayTeam?.shortName,
            match.league,
            match.sportLabel,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return (
            match.dateKey === selectedDate &&
            (activeFilter === "all" || match.sport === activeFilter) &&
            (!normalizedKeyword ||
              searchableText.includes(normalizedKeyword)) &&
            (activeTab === "today" || predictions[match.id])
          );
        })
        .map((match) => ({
          ...match,
          // - DB가 scheduled여도 경기 시작 시각이 지나면 예측 마감
          isFinished:
            match.isFinished || currentTime >= new Date(match.beginAt).getTime(),
        }));
    },
    [
      matches,
      selectedDate,
      activeFilter,
      searchKeyword,
      activeTab,
      predictions,
      currentTime,
    ],
  );

  useEffect(() => {
    if (
      !targetMatchId ||
      isLoading ||
      apiError ||
      activeTab !== "today" ||
      scrolledTargetMatchRef.current === targetMatchId
    ) {
      return undefined;
    }

    const hasTargetMatch = filteredMatches.some(
      (match) => String(match.databaseId) === String(targetMatchId),
    );

    if (!hasTargetMatch) {
      return undefined;
    }

    const scrollTimer = window.setTimeout(() => {
      targetMatchCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      targetMatchCardRef.current?.focus({ preventScroll: true });
      scrolledTargetMatchRef.current = targetMatchId;
    }, 120);

    return () => window.clearTimeout(scrollTimer);
  }, [activeTab, apiError, filteredMatches, isLoading, targetMatchId]);

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

  const hasMatchOnDate = (dateKey) =>
    matches.some(
      (match) =>
        match.dateKey === dateKey &&
        (activeFilter === "all" || match.sport === activeFilter),
    );

  // - 전체에서는 종목별 배지를 모두, 종목 필터에서는 해당 배지만 표시
  const badgeSports =
    activeFilter === "all"
      ? ["soccer", "baseball", "esports"]
      : [activeFilter];

  const displayedBadges = badgeSports.map((sport) => {
    const stats = sportStats.find((stat) => stat.sport === sport);
    const totalCount = Number(stats?.total_count ?? 0);
    const accuracyRate = Number(stats?.accuracy_rate ?? 0);

    return {
      sport,
      totalCount,
      accuracyRate,
      ...getPredictionBadgeMeta(sport, totalCount, accuracyRate),
    };
  });

  const emptyMessage = searchKeyword.trim()
    ? "검색 조건에 맞는 경기가 없습니다."
    : activeTab === "mine"
      ? "이 날짜에 예측한 경기가 없습니다."
      : "이 날짜에 예정된 경기가 없습니다.";
  const emptyDescription = searchKeyword.trim()
    ? "검색어를 바꾸거나 필터를 전체로 변경해 보세요."
    : activeTab === "mine"
      ? "오늘의 경기에서 승부예측에 참여해 보세요."
      : "다른 날짜 또는 종목을 선택해 보세요.";

  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>FANPICK PREDICTION</p>

          <h1 className={styles.title}>PREDICTION</h1>

          <p className={styles.description}>
            오늘의 경기와 나의 승부 예측 기록을 확인해 보세요.
          </p>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="예측 보기">
          <button
            className={activeTab === "today" ? styles.activeTab : ""}
            onClick={() => setActiveTab("today")}
            type="button"
          >
            오늘의 경기
          </button>
          <button
            className={activeTab === "mine" ? styles.activeTab : ""}
            onClick={() => setActiveTab("mine")}
            type="button"
          >
            나의 예측
          </button>
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
              placeholder="팀 이름, 리그를 검색해보세요"
              ariaLabel="예측 경기 검색"
              debounceDelay={500}
            />
          </div>
        </div>

        <div className={styles.contentArea}>
          {activeTab === "mine" && (
            <aside className={styles.summary}>
              {displayedBadges.map((badge) => {
                const SportIcon = badge.SportIcon;
                const TierIcon = badge.TierIcon;

                return (
                  <div className={styles.badgeItem} key={badge.sport}>
                    <span
                      className={styles.summaryIcon}
                      data-tier={badge.tier}
                      aria-hidden="true"
                    >
                      <SportIcon />
                      <span className={styles.summaryTierIcon}>
                        <TierIcon />
                      </span>
                    </span>
                    <strong>{badge.name}</strong>
                    <p>
                      나의 예측 <b>{badge.totalCount}회</b>
                      <br />
                      예측 성공률 <b>{badge.accuracyRate}%</b>
                    </p>
                  </div>
                );
              })}
            </aside>
          )}

          {isLoading && (
            <div className={styles.matchList} aria-label="예측 경기 로딩 중">
              {Array.from({ length: 3 }, (_, index) =>
                activeTab === "today" ? (
                  <TodayMatchCardSkeleton key={index} />
                ) : (
                  <MyPredictionCardSkeleton key={index} />
                ),
              )}
            </div>
          )}

          {!isLoading && apiError && (
            <EmptyState
              title={apiError}
              description="잠시 후 다시 시도해 주세요."
            />
          )}

          {!isLoading && !apiError && filteredMatches.length > 0 && (
            <div className={styles.matchList}>
              {filteredMatches.map((match) => {
                if (activeTab === "today") {
                  const isTargetMatch =
                    String(match.databaseId) === String(targetMatchId);

                  return (
                    <TodayMatchCard
                      key={match.id}
                      ref={isTargetMatch ? targetMatchCardRef : null}
                      match={match}
                      selection={predictions[match.id]}
                      canChangePrediction={canChangePredictionByBeginAt(
                        match.beginAt,
                        currentTime,
                      )}
                      isSaving={savingMatchId === match.id}
                      isTarget={isTargetMatch}
                      onSelect={handlePrediction}
                    />
                  );
                }

                return (
                  <MyPredictionCard
                    key={match.id}
                    match={match}
                    selection={predictions[match.id]}
                    result={predictionResults[match.id]}
                  />
                );
              })}
            </div>
          )}

          {!isLoading && !apiError && filteredMatches.length === 0 && (
            <EmptyState title={emptyMessage} description={emptyDescription} />
          )}
        </div>
      </div>
    </section>
  );
};

export default PredictionPage;
