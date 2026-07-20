import { useEffect, useMemo, useState } from "react";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import styles from "./PredictionPage.module.css";

/* 종목 필터 */
const FILTERS = [
  { id: "all", label: "전체" },
  { id: "soccer", label: "축구" },
  { id: "baseball", label: "야구" },
  { id: "basketball", label: "농구" },
  { id: "esports", label: "LoL" },
];

/* 날짜 목록 */
const DATES = [
  { day: "오늘", date: 14 },
  { day: "수", date: 15 },
  { day: "목", date: 16 },
  { day: "금", date: 17 },
  { day: "토", date: 18 },
  { day: "일", date: 19 },
  { day: "월", date: 20 },
];

/* 경기 더미 데이터 */
const MATCHES = [
  {
    id: 1,
    date: 14,
    sport: "baseball",
    sportLabel: "야구",
    league: "KBO",
    time: "18:00",
    participants: 5971,
    homeTeam: {
      name: "키움",
      logo: "",
    },
    awayTeam: {
      name: "한화",
      logo: "",
    },
    homeRate: 20,
  },
  {
    id: 2,
    date: 14,
    sport: "basketball",
    sportLabel: "농구",
    league: "KBL",
    time: "20:00",
    participants: 5971,
    homeTeam: {
      name: "KCC",
      logo: "",
    },
    awayTeam: {
      name: "SK",
      logo: "",
    },
    homeRate: 45,
  },
  {
    id: 3,
    date: 16,
    sport: "soccer",
    sportLabel: "축구",
    league: "EPL",
    time: "20:00",
    participants: 3200,
    homeTeam: {
      name: "아스날",
      logo: "",
    },
    awayTeam: {
      name: "토트넘",
      logo: "",
    },
    homeRate: 60,
  },
  {
    id: 4,
    date: 14,
    sport: "esports",
    sportLabel: "LoL",
    league: "LCK",
    time: "18:00",
    participants: 5971,
    homeTeam: {
      name: "T1",
      logo: "",
    },
    awayTeam: {
      name: "KT 롤스터",
      logo: "",
    },
    homeRate: 55,
  },
];

/* localStorage에 저장된 예측 결과 불러오기 */
const getSavedPredictions = () => {
  try {
    const savedPredictions = localStorage.getItem("fanpick-predictions");

    return savedPredictions ? JSON.parse(savedPredictions) : {};
  } catch {
    return {};
  }
};

/* 경기 한 개를 표시하는 컴포넌트 */
const PredictionMatch = ({ match, selection, onSelect }) => {
  const homeRate = match.homeRate ?? 50;
  const awayRate = 100 - homeRate;

  return (
    <article className={styles.matchCard}>
      {/* 종목과 리그 */}
      <div className={styles.matchMeta}>
        <span>{match.sportLabel}</span>
        <span className={styles.ball}>⚾</span>
        <strong>{match.league}</strong>
      </div>

      {/* 경기 시간과 진행 상태 */}
      <div className={styles.matchHeading}>
        <p>
          <strong>{match.time}</strong> 경기예정
        </p>

        <span>예측진행중</span>
      </div>

      {/* 팀 선택 영역 */}
      <div className={styles.teams}>
        {/* 홈팀 */}
        <button
          type="button"
          className={`${styles.teamButton} ${
            selection === "home" ? styles.selected : ""
          }`}
          onClick={() => onSelect(match.id, "home")}
        >
          <span className={styles.teamIdentity}>
            {match.homeTeam.logo && (
              <img
                className={styles.teamLogo}
                src={match.homeTeam.logo}
                alt={`${match.homeTeam.name} 로고`}
              />
            )}

            <strong>{match.homeTeam.name}</strong>
          </span>

          {/* 투표한 경기만 비율 표시 */}
          {selection && <b>{homeRate}%</b>}
        </button>

        {/* 원정팀 */}
        <button
          type="button"
          className={`${styles.teamButton} ${styles.awayTeam} ${
            selection === "away" ? styles.selected : ""
          }`}
          onClick={() => onSelect(match.id, "away")}
        >
          {/* 투표한 경기만 비율 표시 */}
          {selection && <b>{awayRate}%</b>}

          <span className={styles.teamIdentity}>
            <strong>{match.awayTeam.name}</strong>

            {/* 로고 */}
            {match.awayTeam.logo && (
              <img
                className={styles.teamLogo}
                src={match.awayTeam.logo}
                alt={`${match.awayTeam.name} 로고`}
              />
            )}
          </span>
        </button>
      </div>

      {/* 참여자 수 */}
      <small>{match.participants.toLocaleString()}명 참여</small>
    </article>
  );
};

const PredictionPage = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [activeDate, setActiveDate] = useState(14);

  /* 현재 선택한 종목 */
  const [activeFilter, setActiveFilter] = useState("all");

  /* localStorage에서 이전 예측 결과 불러오기 */
  const [predictions, setPredictions] = useState(getSavedPredictions);

  /* 예측 결과가 변경될 때마다 localStorage에 저장 */
  useEffect(() => {
    localStorage.setItem("fanpick-predictions", JSON.stringify(predictions));
  }, [predictions]);

  /* 팀을 선택했을 때 실행 */
  const handlePrediction = (matchId, team) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: team,
    }));
  };

  /* 날짜, 탭, 종목 필터 적용 */
  const filteredMatches = useMemo(() => {
    let matches = MATCHES;

    // 선택한 날짜의 경기
    matches = matches.filter((match) => match.date === activeDate);

    // 투표한 경기
    if (activeTab === "mine") {
      matches = matches.filter((match) => predictions[match.id]);
    }

    // 선택한 종목
    if (activeFilter !== "all") {
      matches = matches.filter((match) => match.sport === activeFilter);
    }

    return matches;
  }, [activeDate, activeTab, activeFilter, predictions]);

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
            type="button"
            className={activeTab === "today" ? styles.activeTab : ""}
            onClick={() => setActiveTab("today")}
          >
            오늘의 경기
          </button>

          <button
            type="button"
            className={activeTab === "mine" ? styles.activeTab : ""}
            onClick={() => setActiveTab("mine")}
          >
            나의 예측
          </button>
        </div>

        {/* 날짜 필터 */}
        <div className={styles.datePicker}>
          {DATES.map(({ day, date }) => (
            <button
              key={date}
              type="button"
              className={activeDate === date ? styles.activeDate : ""}
              onClick={() => setActiveDate(date)}
            >
              <span>{day}</span>
              <strong>{date}</strong>
            </button>
          ))}
        </div>

        {/* 종목 필터 */}
        <div className={styles.filterWrap}>
          <MatchFilter
            filters={FILTERS}
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        {/* 경기 목록 */}
        <div className={styles.matchList}>
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => (
              <PredictionMatch
                key={match.id}
                match={match}
                selection={predictions[match.id]}
                onSelect={handlePrediction}
              />
            ))
          ) : (
            <p className={styles.empty}>
              {activeTab === "mine"
                ? "이 날짜에 예측한 경기가 없습니다."
                : "이 날짜에 예정된 경기가 없습니다."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default PredictionPage;
