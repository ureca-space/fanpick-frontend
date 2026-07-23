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
        <div className={css.teamGroup}>
          <TeamBadge team={match.homeTeam} />
          <span className={css.teamName}>{match.homeTeam?.shortName || match.homeTeam?.name}</span>
        </div>

        <span className={css.vs}>VS</span>

        <div className={css.teamGroup}>
          <span className={css.teamName}>{match.awayTeam?.shortName || match.awayTeam?.name}</span>
          <TeamBadge team={match.awayTeam} />
        </div>
      </div>
    </article>
  );
};

export default CalendarItemCard;
