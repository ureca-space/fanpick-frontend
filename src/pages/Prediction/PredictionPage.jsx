import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import useAuth from "../../contexts/useAuth";
import { supabase } from "../../lib/supabase";
import {
  fetchMatchPredictionStats,
  fetchMyPredictionStats,
} from "../../services/predictionApi";
import { getPredictionBadge } from "../../utils/predictionBadge";
import MyPredictionCard from "./components/MyPredictionCard/MyPredictionCard";
import TodayMatchCard from "./components/TodayMatchCard/TodayMatchCard";
import styles from "./PredictionPage.module.css";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// - 종목 필터 버튼 목록
const FILTERS = [
  { id: "all", label: "전체" },
  { id: "soccer", label: "축구" },
  { id: "baseball", label: "야구" },
  { id: "esports", label: "LoL" },
];

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

const formatWeekRange = (dates) => {
  const formatDate = (date) =>
    [
      date.getFullYear(),
      padNumber(date.getMonth() + 1),
      padNumber(date.getDate()),
    ].join(".");

  return `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`;
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
    sourceId: match.external_id,
    dateKey: match.match_date,
    beginAt: `${match.match_date}T${time === "--:--" ? "00:00" : time}:00+09:00`,
    sport,
    sportLabel:
      sport === "esports" ? "LoL" : sport === "soccer" ? "축구" : "야구",
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
        external_id,
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
        match.external_id &&
        match.match_date &&
        match.home_team_code &&
        match.away_team_code,
    )
    .map(normalizeSupabaseMatch);
};

// - 경기 목록에 서버가 계산한 참여자 수와 투표 비율 합치기
const addPredictionStats = (matches, stats) => {
  const statsByMatchId = Object.fromEntries(
    stats.map((item) => [String(item.match_id), item]),
  );

  return matches.map((match) => {
    const matchStats = statsByMatchId[String(match.databaseId)];

    return {
      ...match,
      participants: Number(matchStats?.participant_count ?? 0),
      homeRate: Number(matchStats?.home_rate ?? 50),
      awayRate: Number(matchStats?.away_rate ?? 50),
    };
  });
};

const PredictionPage = () => {
  const { user, isAuthLoading } = useAuth();

  // - API 경기 목록
  const [matches, setMatches] = useState([]);

  // - 화면 상태
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [activeFilter, setActiveFilter] = useState("all");
  const [weekStart, setWeekStart] = useState(() => getMonday(createToday()));
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateKey(createToday()),
  );

  // - 사용자가 선택한 예측
  const [predictions, setPredictions] = useState({});
  const [predictionResults, setPredictionResults] = useState({});
  const [sportStats, setSportStats] = useState([]);
  const [savingMatchId, setSavingMatchId] = useState(null);

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
        const data = await fetchMyPredictionStats();

        if (isMounted) setSportStats(data);
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
        return;
      }

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
          addPredictionStats(supabaseMatches, predictionStats).sort(
            (a, b) => new Date(a.beginAt) - new Date(b.beginAt),
          ),
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

  // - 예측은 한 번만 Supabase에 저장하고 수정하지 않음
  const handlePrediction = async (match, selection) => {
    if (!user) {
      alert("로그인 후 예측할 수 있습니다.");
      return;
    }

    if (predictions[match.id] || savingMatchId === match.id) return;

    const selectedTeamCode =
      selection === "home" ? match.homeTeam.id : match.awayTeam.id;

    setSavingMatchId(match.id);

    const { data, error } = await supabase
      .from("predictions")
      .insert({
        user_id: user.id,
        match_id: match.databaseId,
        selected_team_code: selectedTeamCode,
      })
      .select("result")
      .single();

    setSavingMatchId(null);

    if (error) {
      if (error.code === "23505") {
        alert("이미 예측을 완료한 경기입니다.");
      } else {
        console.error("예측 저장 오류:", error);
        alert(`예측을 저장하지 못했습니다.\n${error.message}`);
      }
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
      setMatches((previous) => addPredictionStats(previous, latestStats));
    } catch (statsError) {
      console.error("경기 투표 통계 조회 오류:", statsError);
    }
  };

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

  // - 선택한 날짜, 종목, 탭에 맞는 경기만 표시
  const filteredMatches = useMemo(
    () =>
      matches.filter(
        (match) =>
          match.dateKey === selectedDate &&
          (activeFilter === "all" || match.sport === activeFilter) &&
          (activeTab === "today" || predictions[match.id]),
      ),
    [matches, selectedDate, activeFilter, activeTab, predictions],
  );

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
      name: getPredictionBadge(sport, totalCount, accuracyRate),
    };
  });

  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <header className={styles.hero}>
          <h1>
            승부<span>🎯</span>예측
          </h1>
          <p>오늘도 예측 완료!</p>
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

        <div className={styles.schedulePanel}>
          <div className={styles.scheduleToolbar}>
            <div className={styles.weekController}>
              <button
                className={styles.arrowButton}
                type="button"
                aria-label="이전 주 보기"
                onClick={() => handleMoveWeek(-1)}
              >
                <FiChevronLeft aria-hidden="true" />
              </button>

              <strong className={styles.weekRange}>
                {formatWeekRange(weekDates.map((weekDate) => weekDate.date))}
              </strong>

              <button
                className={styles.arrowButton}
                type="button"
                aria-label="다음 주 보기"
                onClick={() => handleMoveWeek(1)}
              >
                <FiChevronRight aria-hidden="true" />
              </button>
            </div>

            <button
              className={styles.currentWeekButton}
              type="button"
              onClick={handleMoveToCurrentWeek}
            >
              <FiCalendar aria-hidden="true" />
              이번 주
            </button>
          </div>

          <div className={styles.dateScroller}>
            <div className={styles.dateList}>
              {weekDates.map(({ date, dateKey, dayLabel }) => {
                const isSelected = selectedDate === dateKey;
                const hasMatch = hasMatchOnDate(dateKey);

                return (
                  <button
                    key={dateKey}
                    className={`${styles.dateButton} ${isSelected ? styles.active : ""}`}
                    type="button"
                    aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일 ${dayLabel}요일`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDate(dateKey)}
                  >
                    <span className={styles.dayLabel}>{dayLabel}</span>
                    <strong className={styles.dateNumber}>
                      {date.getDate()}
                    </strong>
                    {hasMatch && (
                      <span className={styles.matchDot} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.filterWrap}>
          <MatchFilter
            filters={FILTERS}
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        {activeTab === "mine" && (
          <aside className={styles.summary}>
            {displayedBadges.map((badge) => (
              <div className={styles.badgeItem} key={badge.sport}>
                <span>🏅</span>
                <strong>{badge.name}</strong>
                <p>
                  나의 예측 <b>{badge.totalCount}회</b>
                  <br />
                  예측 성공률 <b>{badge.accuracyRate}%</b>
                </p>
              </div>
            ))}
          </aside>
        )}

        {isLoading && <p className={styles.empty}>경기를 불러오는 중입니다.</p>}
        {!isLoading && apiError && <p className={styles.empty}>{apiError}</p>}

        {!isLoading && !apiError && (
          <div className={styles.matchList}>
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match) =>
                activeTab === "today" ? (
                  <TodayMatchCard
                    key={match.id}
                    match={match}
                    selection={predictions[match.id]}
                    isSaving={savingMatchId === match.id}
                    onSelect={handlePrediction}
                  />
                ) : (
                  <MyPredictionCard
                    key={match.id}
                    match={match}
                    selection={predictions[match.id]}
                    result={predictionResults[match.id]}
                  />
                ),
              )
            ) : (
              <p className={styles.empty}>
                {activeTab === "mine"
                  ? "이 날짜에 예측한 경기가 없습니다."
                  : "이 날짜에 예정된 경기가 없습니다."}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PredictionPage;
