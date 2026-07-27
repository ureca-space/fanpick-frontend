import { useState } from "react";
import CalendarItemCard from "./CalendarItemCard";
import css from "./CalendarCell/CalendarCell.module.css";

const MAX_MOBILE_INDICATOR_MATCHES = 2;

const TeamIndicator = ({ team }) => {
  const [hasError, setHasError] = useState(false);

  if (!team?.logo || hasError) {
    return <span className={css.mobileTeamFallback}>{team?.shortName}</span>;
  }

  return (
    <img
      className={css.mobileTeamLogo}
      src={team.logo}
      alt=""
      aria-hidden="true"
      onError={() => setHasError(true)}
    />
  );
};

const CalendarCell = ({
  day,
  matches = [],
  isSelected = false,
  onSelectDate,
  onMatchClick,
  alarmMatchIds = [],
}) => {
  const hasMatches = matches.length > 0;
  const indicatorMatches = matches.slice(0, MAX_MOBILE_INDICATOR_MATCHES);
  const cellClassName = [
    css.dayCell,
    !day.isCurrentMonth ? css.dayCellOutside : "",
    day.isCurrentMonth && day.isPastDate ? css.dayCellPast : "",
    day.isCurrentMonth && !day.isPastDate ? css.dayCellUpcoming : "",
    day.isCurrentMonth ? css.dayCellSelectable : "",
    isSelected ? css.dayCellSelected : "",
    hasMatches ? css.dayCellHasMatches : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleSelectDate = () => {
    if (!day.isCurrentMonth) {
      return;
    }

    onSelectDate?.(day.date);
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleSelectDate();
  };

  return (
    <div
      className={cellClassName}
      role={day.isCurrentMonth ? "button" : undefined}
      tabIndex={day.isCurrentMonth ? 0 : undefined}
      aria-pressed={day.isCurrentMonth ? isSelected : undefined}
      onClick={handleSelectDate}
      onKeyDown={handleKeyDown}
    >
      <div className={css.dayNumber}>{day.dayNumber}</div>

      {hasMatches ? (
        <div
          className={css.mobileMatchSummary}
          aria-label={`${matches.length}경기`}
        >
          {indicatorMatches.map((match) => (
            <div key={match.id} className={css.mobileMatchRow}>
              <TeamIndicator team={match.homeTeam} />
              <span className={css.mobileVs}>VS</span>
              <TeamIndicator team={match.awayTeam} />
            </div>
          ))}
        </div>
      ) : null}

      <div className={css.matchList}>
        {matches.map((match) => (
          <CalendarItemCard
            key={match.id}
            match={match}
            onClick={onMatchClick}
            isAlarmSet={alarmMatchIds.includes(String(match.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default CalendarCell;
