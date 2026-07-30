import Button from "../../../components/Button/Button";
import {
  MATCH_STATUS_LABELS,
  formatScoreText,
  getPredictionRates,
} from "../teamDetailUtils";
import styles from "../TeamDetailPage.module.css";
import { TeamBadgeLogo } from "./TeamLogo";

const TeamDetailMatchCard = ({ isAuthLoading, match, onVoteClick }) => {
  const { homeRate, awayRate } = getPredictionRates(match);
  const hasScore = formatScoreText(match) !== "VS";

  return (
    <article className={styles.matchCard}>
      <div className={styles.matchDate}>
        <strong>{match.date}</strong>
        <span>
          {match.day} · {match.time}
        </span>
      </div>

      <div className={styles.matchTeams}>
        <div>
          <TeamBadgeLogo team={match.homeTeam} />
          <span>{match.homeTeam.name}</span>
        </div>

        <strong className={hasScore ? styles.matchScore : ""}>
          {formatScoreText(match)}
        </strong>

        <div>
          <TeamBadgeLogo team={match.awayTeam} />
          <span>{match.awayTeam.name}</span>
        </div>
      </div>

      <div className={styles.matchPrediction}>
        <div className={styles.predictionLabels}>
          <span>
            {match.homeTeam.name}
            <strong>{homeRate}%</strong>
          </span>

          <span>
            <strong>{awayRate}%</strong>
            {match.awayTeam.name}
          </span>
        </div>

        <div className={styles.predictionBar}>
          <span
            className={styles.homePredictionBar}
            style={{ width: `${homeRate}%` }}
          />

          <span
            className={styles.awayPredictionBar}
            style={{ width: `${awayRate}%` }}
          />
        </div>
      </div>

      <div className={styles.matchMeta}>
        <span className={styles.matchLeague}>{match.league}</span>

        {MATCH_STATUS_LABELS[match.status] && (
          <span
            className={`${styles.matchStatus} ${
              match.status === "live" ? styles.matchStatusLive : ""
            }`}
          >
            {MATCH_STATUS_LABELS[match.status]}
          </span>
        )}
      </div>

      <div className={styles.matchAction}>
        <Button
          disabled={isAuthLoading || match.isPredicted}
          fullWidth
          onClick={() => onVoteClick(match.databaseId ?? match.id)}
          size="sm"
          variant="outline"
        >
          {match.isPredicted ? "투표완료" : "투표하기"}
        </Button>
      </div>
    </article>
  );
};

export default TeamDetailMatchCard;
