import CalendarCell from "./CalendarCell";
import css from "./CalendarGrid/CalendarGrid.module.css";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

const getCalendarDays = ({ year, month }) => {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date: formatDate(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
};

const CalendarGrid = ({ year, month, matchByDate }) => {
  const days = getCalendarDays({ year, month });

  return (
    <section className={css.calendarGrid}>
      <div className={css.weekdays}>
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className={css.weekday}>
            {weekday}
          </div>
        ))}
      </div>

      <div className={css.days}>
        {days.map((day) => (
          <CalendarCell
            key={day.date}
            day={day}
            matches={matchByDate[day.date] || []}
          />
        ))}
      </div>
    </section>
  );
};

export default CalendarGrid;
