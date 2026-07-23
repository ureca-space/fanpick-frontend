import { useState } from "react";
import css from "./CalendarItemCard/CalendarItemCard.module.css";

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

const CalendarItemCard = ({ match }) => {
  return (
    <article className={css.calendarItemCard}>
     

      <div className={css.itemTeams}>
        <TeamBadge team={match.homeTeam} />
        <span className={css.vs}>VS</span>
        <TeamBadge team={match.awayTeam} />
      </div>

      <div className={css.itemMeta}>
        <span>{match.time}</span>
        <span>{match.venue}</span>
      </div>

      <div className={css.itemScore}>
        <span>{match.homeScore}</span>
        <span>:</span>
        <span>{match.awayScore}</span>
        <strong className={css.itemResult}>{match.resultText}</strong>
      </div>
    </article>
  );
};

export default CalendarItemCard;
