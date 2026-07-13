import { useState } from "react";
import styles from "./MatchCard.module.css";

const TeamLogo = ({ src, name, shortName }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={styles.logoFallback} aria-hidden="true">
        {shortName}
      </div>
    );
  }

  return (
    <img
      className={styles.teamLogo}
      src={src}
      alt={`${name} 로고`}
      onError={() => setHasError(true)}
    />
  );
};

const MatchCard = ({ match, isVoted, onVote }) => {
  const totalVotes = match.homeVotes + match.awayVotes;

  const homeVoteRate =
    totalVotes === 0 ? 50 : Math.round((match.homeVotes / totalVotes) * 100);

  const awayVoteRate = 100 - homeVoteRate;

  return (
    <article className={styles.matchCard}>
      <div className={styles.cardHeader}>
        <span className={styles.sportBadge}>{match.sportLabel}</span>
        <span className={styles.league}>{match.league}</span>
      </div>

      <div className={styles.matchInfo}>
        <strong className={styles.matchDate}>
          {match.date} <span>[{match.day}]</span>
        </strong>

        <p className={styles.matchTime}>
          {match.time} | {match.venue}
        </p>
      </div>

      <div className={styles.teams}>
        <div className={styles.team}>
          <TeamLogo
            src={match.homeTeam.logo}
            name={match.homeTeam.name}
            shortName={match.homeTeam.shortName}
          />

          <span className={styles.teamName}>{match.homeTeam.name}</span>
        </div>

        <span className={styles.vs}>VS</span>

        <div className={styles.team}>
          <TeamLogo
            src={match.awayTeam.logo}
            name={match.awayTeam.name}
            shortName={match.awayTeam.shortName}
          />

          <span className={styles.teamName}>{match.awayTeam.name}</span>
        </div>
      </div>

      <div className={styles.voteArea}>
        <div className={styles.voteLabels}>
          <span>
            {match.homeTeam.name}
            <strong>{homeVoteRate}%</strong>
          </span>

          <span>
            <strong>{awayVoteRate}%</strong>
            {match.awayTeam.name}
          </span>
        </div>

        <div className={styles.voteBar}>
          <span
            className={styles.homeVoteBar}
            style={{ width: `${homeVoteRate}%` }}
          />

          <span
            className={styles.awayVoteBar}
            style={{ width: `${awayVoteRate}%` }}
          />
        </div>
      </div>

      <button
        className={styles.voteButton}
        type="button"
        disabled={isVoted}
        onClick={() => onVote(match.id)}
      >
        {isVoted ? "투표 완료" : "투표하기"}
      </button>
    </article>
  );
};

export default MatchCard;
