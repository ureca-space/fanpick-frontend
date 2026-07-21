import { SPORT_ICONS } from "../../predictionUtils";
import TeamMark from "../TeamMark/TeamMark";
import styles from "./TodayMatchCard.module.css";

// - 오늘의 경기 표시
// - 홈팀 또는 원정팀 선택 처리
const TodayMatchCard = ({ match, selection, isSaving, onSelect }) => {
  // - API에 비율이 없으면 기본값 50% 사용
  const homeRate = match.homeRate ?? 50;
  const awayRate = match.awayRate ?? 50;

  return (
    <article className={styles.matchCard}>
      <div className={styles.matchMeta}>
        <span>{match.sportLabel}</span>
        <span>{SPORT_ICONS[match.sport]}</span>
        <strong>{match.league}</strong>
      </div>

      <div className={styles.matchHeading}>
        <p>
          <strong>{match.time}</strong>{" "}
          {match.isFinished ? "경기종료" : "경기예정"}
        </p>
        <span className={match.isFinished ? styles.finished : ""}>
          {match.isFinished
            ? selection
              ? "경기종료"
              : "미참여"
            : "예측진행중"}
        </span>
      </div>

      <div
        className={`${styles.teams} ${match.isFinished ? styles.finishedTeams : ""}`}
      >
        <button
          type="button"
          className={`${styles.teamButton} ${!match.isFinished && selection === "home" ? styles.selected : ""}`}
          disabled={match.isFinished || Boolean(selection) || isSaving}
          onClick={() => onSelect(match, "home")}
        >
          <span className={styles.teamIdentity}>
            <TeamMark team={match.homeTeam} />
            <span className={styles.teamText}>
              <strong>{match.homeTeam.name}</strong>
              {match.isFinished && <small>{homeRate}%</small>}
            </span>
          </span>
          {match.isFinished ? (
            <b>{match.homeScore ?? "-"}</b>
          ) : (
            selection && <b>{homeRate}%</b>
          )}
        </button>

        <button
          type="button"
          className={`${styles.teamButton} ${styles.awayTeam} ${!match.isFinished && selection === "away" ? styles.selected : ""}`}
          disabled={match.isFinished || Boolean(selection) || isSaving}
          onClick={() => onSelect(match, "away")}
        >
          {match.isFinished ? (
            <b>{match.awayScore ?? "-"}</b>
          ) : (
            selection && <b>{awayRate}%</b>
          )}
          <span className={styles.teamIdentity}>
            <span className={styles.teamText}>
              <strong>{match.awayTeam.name}</strong>
              {match.isFinished && <small>{awayRate}%</small>}
            </span>
            <TeamMark team={match.awayTeam} />
          </span>
        </button>
      </div>

      <small>{(match.participants ?? 0).toLocaleString()}명 참여</small>
    </article>
  );
};

export default TodayMatchCard;
