import CalendarItemCard from "../CalendarItemCard/CalendarItemCard";
import css from "./CalendarCell.module.css";

const CalendarCell = ({ day, matches = [], onMatchClick }) => {
  const cellClassName = [
    css.dayCell,
    !day.isCurrentMonth ? css.dayCellOutside : "",
    matches.length > 0 ? css.dayCellActive : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cellClassName}>
      <div className={css.dayNumber}>{day.dayNumber}</div>

      <div className={css.matchList}>
        {matches.map((match) => (
          <CalendarItemCard
            key={match.id}
            match={match}
            onClick={onMatchClick}
          />
        ))}
      </div>
    </div>
  );
};

export default CalendarCell;
