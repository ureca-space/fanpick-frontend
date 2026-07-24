import CalendarItemCard from "./CalendarItemCard";
import css from "./CalendarCell/CalendarCell.module.css";

const CalendarCell = ({ day, matches = [] }) => {
  const cellClassName = [
    css.dayCell,
    !day.isCurrentMonth ? css.dayCellOutside : "",
    day.isCurrentMonth && day.isPastDate ? css.dayCellPast : "",
    day.isCurrentMonth && !day.isPastDate ? css.dayCellUpcoming : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cellClassName}>
      <div className={css.dayNumber}>{day.dayNumber}</div>

      <div className={css.matchList}>
        {matches.map((match) => (
          <CalendarItemCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

export default CalendarCell;
