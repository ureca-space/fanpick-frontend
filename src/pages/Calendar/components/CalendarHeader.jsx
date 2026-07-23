import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import css from "./CalendarHeader.module.css";

const CalendarHeader = ({ year, month, onPrevMonth, onNextMonth }) => {
  return (
    <header className={css.calendarHeader}>
      <button
        type="button"
        onClick={onPrevMonth}
        className={css.navButton}
        aria-label="Previous month"
      >
        <IoIosArrowBack />
      </button>

      <h1 className={css.calendarTitle}>
        {year}년 {month + 1}월
      </h1>

      <button
        type="button"
        onClick={onNextMonth}
        className={css.navButton}
        aria-label="Next month"
      >
        <IoIosArrowForward />
      </button>
    </header>
  );
};

export default CalendarHeader;
