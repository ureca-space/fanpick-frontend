import { useEffect, useMemo, useState } from "react";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import { fetchLolMatchesByDateRange } from "../../services/lolApi";
import { fetchEplMatchesByDateRange } from "../../services/soccerApi";
import MyPredictionCard from "./components/MyPredictionCard/MyPredictionCard";
import TodayMatchCard from "./components/TodayMatchCard/TodayMatchCard";
import {
  createDateFilter,
  getPredictionStats,
  getSavedPredictions,
} from "./predictionUtils";
import styles from "./PredictionPage.module.css";

const STORAGE_KEY = "fanpick-predictions";

// - 임시 API 테스트 기간
const TEST_START_DATE = "2026-07-30";
const TEST_END_DATE = "2026-08-07";

// - 종목 필터 버튼 목록
const FILTERS = [
  { id: "all", label: "전체" },
  { id: "soccer", label: "축구" },
  { id: "baseball", label: "야구" },
  { id: "lol", label: "LoL" },
];

const PredictionPage = () => {
  // - API 경기 목록
  const [matches, setMatches] = useState([]);

  // - 화면 상태
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [activeDate, setActiveDate] = useState(TEST_START_DATE);
  const [activeFilter, setActiveFilter] = useState("all");

  // - 사용자가 선택한 예측
  const [predictions, setPredictions] = useState(() =>
    getSavedPredictions(STORAGE_KEY),
  );

  useEffect(() => {
    let isMounted = true;

    // - LoL과 축구 경기 동시에 불러오기
    const fetchGames = async () => {
      try {
        setApiError("");

        const [lolMatches, soccerMatches] = await Promise.all([
          fetchLolMatchesByDateRange(TEST_START_DATE, TEST_END_DATE),
          fetchEplMatchesByDateRange(TEST_START_DATE, TEST_END_DATE),
        ]);

        if (!isMounted) return;

        setMatches(
          [...lolMatches, ...soccerMatches].sort(
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
  }, []);

  // - 예측이 바뀔 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
  }, [predictions]);

  // - 선택한 팀을 경기 ID별로 저장
  const handlePrediction = (matchId, team) => {
    setPredictions((previous) => ({ ...previous, [matchId]: team }));
  };

  // - 날짜 버튼은 처음 한 번만 생성
  const dates = useMemo(() => createDateFilter(TEST_START_DATE), []);

  // - 선택한 날짜, 종목, 탭에 맞는 경기만 표시
  const filteredMatches = useMemo(
    () =>
      matches.filter(
        (match) =>
          match.dateKey === activeDate &&
          (activeFilter === "all" || match.sport === activeFilter) &&
          (activeTab === "today" || predictions[match.id]),
      ),
    [matches, activeDate, activeFilter, activeTab, predictions],
  );

  // - 나의 전체 예측 횟수와 성공률 계산
  const { predictionCount, successRate } = useMemo(
    () => getPredictionStats(matches, predictions),
    [matches, predictions],
  );

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

        <div className={styles.datePicker}>
          {dates.map(({ day, date, dateKey }) => (
            <button
              key={dateKey}
              type="button"
              className={activeDate === dateKey ? styles.activeDate : ""}
              onClick={() => setActiveDate(dateKey)}
            >
              <span>{day}</span>
              <strong>{date}</strong>
            </button>
          ))}
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
            <span>🏅</span>
            <strong>역배 장인</strong>
            <p>
              나의 예측 <b>{predictionCount}회</b>
              <br />
              예측 성공률 <b>{successRate}%</b>
            </p>
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
                    onSelect={handlePrediction}
                  />
                ) : (
                  <MyPredictionCard
                    key={match.id}
                    match={match}
                    selection={predictions[match.id]}
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
