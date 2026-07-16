import { useState } from "react";
import css from "./CalendarItemCard.module.css";

const TeamBadge = ({ team }) => {
  const [hasError, setHasError] = useState(false);

  if (!team?.logo || hasError) {
    return <span className={css.teamFallback}>{team?.shortName}</span>;
  }

  return (
    <img
      className={css.teamLogo}
      src={team.logo}
      alt={team.name}
      onError={(event) => {
        event.currentTarget.style.display = "none";
        setHasError(true);
      }}
    />
  );
};

const CalendarItemCard = ({ match, onClick }) => {
  return (
    <button
      type="button"
      className={css.calendarItemCard}
      onClick={() => onClick?.(match)}
      aria-label={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
    >
      <div className={css.matchupText}>
        <span className={css.teamGroup}>
          <TeamBadge team={match.homeTeam} />
          <span className={css.teamName}>{match.homeTeam.name}</span>
        </span>

        <span className={css.matchupSeparator}>vs</span>

        <span className={css.teamGroup}>
          <span className={css.teamName}>{match.awayTeam.name}</span>
          <TeamBadge team={match.awayTeam} />
        </span>
      </div>
    </button>
  );
};

export default CalendarItemCard;
