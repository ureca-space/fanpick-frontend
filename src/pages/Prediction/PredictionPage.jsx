import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import EmptyState from "../../components/EmptyState/EmptyState";
import FanPickDialog from "../../components/FanPickDialog/FanPickDialog";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import PredictionBadgeIcon from "../../components/PredictionBadgeIcon/PredictionBadgeIcon";
import SearchInput from "../../components/SearchInput/SearchInput";
import SubNav from "../../components/SubNav/SubNav";
import WeekDateSelector from "../../components/WeekDateSelector/WeekDateSelector";
import { MATCH_CENTER_SUB_NAV_ITEMS } from "../../constants/matchCenterNav";
import { getTeamInfo as getSharedTeamInfo } from "../../constants/teamInfo";
import useAuth from "../../contexts/useAuth";
import { supabase } from "../../lib/supabase";
import {
  applyPredictionStatsToMatches,
  createSettledPredictionSportStats,
  fetchMatchPredictionStats,
  fetchMyPredictions,
  hasResolvedPredictionScore,
  resolvePredictionResult,
} from "../../services/predictionApi";
import { getPredictionBadgeMeta } from "../../utils/predictionBadge";
import {
  canChangePredictionByBeginAt,
  createMatchBeginAt,
} from "../../utils/predictionDeadline";
import {
  CLOSED_MATCH_STATUSES,
  isLiveMatchStatus,
  isResultPendingMatchStatus,
  normalizeMatchTimingStatus,
  parseMatchScore,
} from "../../utils/matchStatus";
import { createPredictionLocation } from "../../utils/predictionPath";
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

const getPredictionTeamInfo = (teamCode, sport) => {
  const code = String(teamCode ?? "").trim().toUpperCase();
  const team = getSharedTeamInfo(teamCode, sport);

  return {
    id: code,
    name: team?.name ?? teamCode ?? "미정",
    shortName: (team?.shortName ?? code) || "-",
    logo: team?.logo ?? "",
  };
};

// - MatchSchedulePage의 Supabase 경기 데이터를 예측 카드 형식으로 변환
const normalizeSupabaseMatch = (match) => {
  const sport = match.sport;
  const time = match.match_time?.slice(0, 5) ?? "--:--";
  const timingStatus = normalizeMatchTimingStatus({
    matchDate: match.match_date,
    matchTime: time,
    score: match.score,
    sport,
    status: match.status,
  });
  const { homeScore, awayScore } = parseMatchScore(timingStatus.score);
  const normalizedMatch = {
    ...match,
    score: timingStatus.score,
    status: timingStatus.status,
  };

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
    status: timingStatus.status,
    score: timingStatus.score,
    participants: 0,
    homeRate: 50,
    homeTeam: getPredictionTeamInfo(match.home_team_code, sport),
    awayTeam: getPredictionTeamInfo(match.away_team_code, sport),
    homeScore,
    awayScore,
    isFinished:
      timingStatus.status === "finished" ||
      hasResolvedPredictionScore(normalizedMatch),
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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthLoading } = useAuth();
  const requestedTab = searchParams.get("tab");
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
  const [activeTab, setActiveTab] = useState(() =>
    requestedTab === "mine" ? "mine" : "today",
  );
  const visibleTab =
    !isAuthLoading && !user && activeTab === "mine" ? "today" : activeTab;
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
  const [loginDialogState, setLoginDialogState] = useState({
    description: "",
    from: null,
    isOpen: false,
  });
  const [noticeDialogState, setNoticeDialogState] = useState({
    description: "",
    isOpen: false,
    title: "",
  });

  const openNoticeDialog = useCallback((title, description) => {
    setNoticeDialogState({
      description,
      isOpen: true,
      title,
    });
  }, []);

  const closeNoticeDialog = useCallback(() => {
    setNoticeDialogState((previous) => ({
      ...previous,
      isOpen: false,
    }));
  }, []);

  const openLoginDialog = useCallback((description, from) => {
    setLoginDialogState({
      description,
      from,
      isOpen: true,
    });
  }, []);

  const closeLoginDialog = () => {
    setLoginDialogState((previous) => ({
      ...previous,
      isOpen: false,
    }));
  };

  const handleMoveToLogin = () => {
    const from =
      loginDialogState.from ?? {
        pathname: location.pathname,
        search: location.search,
      };

    setLoginDialogState((previous) => ({
      ...previous,
      isOpen: false,
    }));

    navigate("/login", {
      state: {
        from,
      },
    });
  };

  const handleTabClick = (tabId) => {
    if (tabId === "mine" && !isAuthLoading && !user) {
      openLoginDialog("나의 예측을 확인하려면 먼저 로그인해 주세요.", {
        pathname: "/prediction",
        search: "?tab=mine",
      });
      return;
    }

    setActiveTab(tabId);
  };

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
            matches (
              home_team_code,
              away_team_code,
              match_date,
              match_time,
              score,
              status
            )
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
          resolvePredictionResult(prediction),
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
      const selectedTeamCode =
        selection === "home" ? match.homeTeam.id : match.awayTeam.id;

      if (!user) {
        openLoginDialog("승부 예측에 참여하려면 먼저 로그인해 주세요.", {
          ...createPredictionLocation({
            matchId: match.databaseId,
            teamCode: selectedTeamCode,
          }),
        });
        return;
      }

      const currentSelection = predictions[match.id];
      const hasExistingPrediction = Boolean(currentSelection);
      const isCancellingPrediction = currentSelection === selection;
      const matchBeginTime = new Date(match.beginAt).getTime();

      if (
        CLOSED_MATCH_STATUSES.has(match.status) ||
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
        openNoticeDialog(
          "투표 변경 마감",
          "경기 시작 30분 전부터는 투표를 변경할 수 없습니다.",
        );
        return;
      }

      const refreshPredictionStats = async () => {
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
      };

      setSavingMatchId(match.id);

      if (isCancellingPrediction) {
        const { error } = await supabase
          .from("predictions")
          .delete()
          .eq("user_id", user.id)
          .eq("match_id", match.databaseId);

        setSavingMatchId(null);

        if (error) {
          console.error("예측 취소 오류:", error);
          openNoticeDialog(
            "예측 취소 실패",
            error.message
              ? `예측을 취소하지 못했습니다. ${error.message}`
              : "예측을 취소하지 못했습니다.",
          );
          return;
        }

        setPredictions((previous) => {
          const nextPredictions = { ...previous };
          delete nextPredictions[match.id];

          return nextPredictions;
        });
        setPredictionResults((previous) => {
          const nextResults = { ...previous };
          delete nextResults[match.id];

          return nextResults;
        });

        await refreshPredictionStats();
        return;
      }

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
        openNoticeDialog(
          "예측 저장 실패",
          error.message
            ? `예측을 저장하지 못했습니다. ${error.message}`
            : "예측을 저장하지 못했습니다.",
        );
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
      await refreshPredictionStats();
    },
    [openLoginDialog, openNoticeDialog, predictions, savingMatchId, user],
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
            (visibleTab === "today" || predictions[match.id])
          );
        })
        .map((match) => {
          const isResultPending = isResultPendingMatchStatus(match.status);
          const isClosedByStatus =
            CLOSED_MATCH_STATUSES.has(match.status) || isResultPending;
          const hasStarted =
            currentTime >= new Date(match.beginAt).getTime();
          const isLive =
            !isResultPending &&
            (isLiveMatchStatus(match.status) ||
              (!isClosedByStatus && !match.isFinished && hasStarted));

          return {
            ...match,
            status: isLive ? "live" : match.status,
            // - DB가 scheduled여도 경기 시작 시각이 지나면 예측 마감
            isFinished:
              match.isFinished ||
              (!isClosedByStatus && hasStarted),
          };
        });
    },
    [
      matches,
      selectedDate,
      activeFilter,
      searchKeyword,
      visibleTab,
      predictions,
      currentTime,
    ],
  );

  useEffect(() => {
    if (
      !targetMatchId ||
      isLoading ||
      apiError ||
      visibleTab !== "today" ||
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
  }, [apiError, filteredMatches, isLoading, targetMatchId, visibleTab]);

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

  const getResolvedMatchPredictionResult = (match, selection) => {
    const selectedTeamCode =
      selection === "home"
        ? match.homeTeam.id
        : selection === "away"
          ? match.awayTeam.id
          : "";

    return resolvePredictionResult({
      result: predictionResults[match.id],
      selected_team_code: selectedTeamCode,
      matches: {
        away_team_code: match.awayTeam.id,
        home_team_code: match.homeTeam.id,
        match_date: match.dateKey,
        match_time: match.time,
        score: match.score,
        status: match.status,
      },
    });
  };

  const emptyMessage = searchKeyword.trim()
    ? "검색 조건에 맞는 경기가 없습니다."
    : visibleTab === "mine"
      ? "이 날짜에 예측한 경기가 없습니다."
      : "이 날짜에 예정된 경기가 없습니다.";
  const emptyDescription = searchKeyword.trim()
    ? "검색어를 바꾸거나 필터를 전체로 변경해 보세요."
    : visibleTab === "mine"
      ? "오늘의 경기에서 승부예측에 참여해 보세요."
      : "다른 날짜 또는 종목을 선택해 보세요.";

  return (
    <>
      <SubNav
        activeItemId="prediction"
        ariaLabel="매치 센터 메뉴"
        items={MATCH_CENTER_SUB_NAV_ITEMS}
      />

      <section className={styles.page}>
        <div className={`container ${styles.inner}`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>FANPICK PREDICTION</p>

          <h1 className={styles.title}>승부 예측</h1>

          <p className={styles.description}>
            오늘의 경기와 나의 승부 예측 기록을 확인해 보세요.
          </p>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="예측 보기">
          <button
            className={visibleTab === "today" ? styles.activeTab : ""}
            onClick={() => handleTabClick("today")}
            type="button"
          >
            오늘의 경기
          </button>
          <button
            className={visibleTab === "mine" ? styles.activeTab : ""}
            onClick={() => handleTabClick("mine")}
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
          {visibleTab === "mine" && (
            <aside className={styles.summary}>
              {displayedBadges.map((badge) => {
                return (
                  <div className={styles.badgeItem} key={badge.sport}>
                    <PredictionBadgeIcon badge={badge} size="sm" />
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
                visibleTab === "today" ? (
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
                if (visibleTab === "today") {
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
                    result={getResolvedMatchPredictionResult(
                      match,
                      predictions[match.id],
                    )}
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

      <FanPickDialog
        isOpen={loginDialogState.isOpen}
        title="로그인이 필요합니다"
        description={loginDialogState.description}
        confirmText="로그인하기"
        cancelText="취소"
        onClose={closeLoginDialog}
        onConfirm={handleMoveToLogin}
      />

      <FanPickDialog
        isOpen={noticeDialogState.isOpen}
        title={noticeDialogState.title}
        description={noticeDialogState.description}
        confirmText="확인"
        onClose={closeNoticeDialog}
        onConfirm={closeNoticeDialog}
      />
    </>
  );
};

export default PredictionPage;
