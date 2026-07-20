import { SPORT_ICONS } from "../predictionUtils";
import styles from "../PredictionPage.module.css";
import TeamMark from "./TeamMark";

// - 오늘의 경기 표시
// - 홈팀 또는 원정팀 선택 처리
const TodayMatchCard = ({ match, selection, onSelect }) => {
  // - 홈팀 비율이 없으면 기본값 50% 사용
  const homeRate = match.homeRate ?? 50;
  const awayRate = 100 - homeRate;

  return (
    <article className={styles.matchCard}>
      <div className={styles.matchMeta}>
        <span>{match.sportLabel}</span>
        <span>{SPORT_ICONS[match.sport]}</span>
        <strong>{match.league}</strong>
      </div>

      <div className={styles.matchHeading}>
        <p>
          <strong>{match.time}</strong> 경기예정
        </p>
        <span>예측진행중</span>
      </div>

      <div className={styles.teams}>
        <button
          type="button"
          className={`${styles.teamButton} ${selection === "home" ? styles.selected : ""}`}
          onClick={() => onSelect(match.id, "home")}
        >
          <span className={styles.teamIdentity}>
            <TeamMark team={match.homeTeam} />
            <strong>{match.homeTeam.name}</strong>
          </span>
          {selection && <b>{homeRate}%</b>}
        </button>

        <button
          type="button"
          className={`${styles.teamButton} ${styles.awayTeam} ${selection === "away" ? styles.selected : ""}`}
          onClick={() => onSelect(match.id, "away")}
        >
          {selection && <b>{awayRate}%</b>}
          <span className={styles.teamIdentity}>
            <strong>{match.awayTeam.name}</strong>
            <TeamMark team={match.awayTeam} />
          </span>
        </button>
      </div>

      <small>{(match.participants ?? 0).toLocaleString()}명 참여</small>
    </article>
  );
};

export default TodayMatchCard;
