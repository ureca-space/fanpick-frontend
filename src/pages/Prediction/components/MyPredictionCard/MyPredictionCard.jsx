import {
  getPredictionResult,
  RESULT_LABELS,
  SPORT_ICONS,
} from "../../predictionUtils";
import TeamMark from "../TeamMark/TeamMark";
import styles from "./MyPredictionCard.module.css";

// - 사용자가 선택한 경기 결과 표시
// - 진행 중, 성공, 실패 상태에 맞는 CSS 적용
const MyPredictionCard = ({ match, selection }) => {
  // - API에 비율이 없으면 기본값 50% 사용
  const homeRate = match.homeRate ?? 50;
  const awayRate = 100 - homeRate;
  const isAwaySelected = selection === "away";
  const result = getPredictionResult(match, selection);

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
        <span className={styles[result]}>{RESULT_LABELS[result]}</span>
      </div>

      <div className={`${styles.scoreBoard} ${styles[result]}`}>
        <div
          className={`${styles.scoreTeam} ${!isAwaySelected ? styles.myPick : ""}`}
        >
          <TeamMark team={match.homeTeam} />
          <span>
            <strong>{match.homeTeam.name}</strong>
            <small>{homeRate}%</small>
          </span>
          <b>{match.homeScore ?? "-"}</b>
        </div>

        <div
          className={`${styles.scoreTeam} ${styles.awayScore} ${isAwaySelected ? styles.myPick : ""}`}
        >
          <b>{match.awayScore ?? "-"}</b>
          <span>
            <strong>{match.awayTeam.name}</strong>
            <small>{awayRate}%</small>
          </span>
          <TeamMark team={match.awayTeam} />
        </div>
      </div>

      <small>{(match.participants ?? 0).toLocaleString()}명 참여</small>
    </article>
  );
};

export default MyPredictionCard;
