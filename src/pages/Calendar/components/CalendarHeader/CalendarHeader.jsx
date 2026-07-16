import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import css from "./CalendarHeader.module.css";

const CalendarHeader = ({ year, month, onPrevMonth, onNextMonth }) => {
  return (
    <header className={css.calendarHeader}>
      <button
        type="button"
        onClick={onPrevMonth}
        className={css.navButton}
        aria-label="이전 달"
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
        aria-label="다음 달"
      >
        <IoIosArrowForward />
      </button>
    </header>
  );
};

export default CalendarHeader;
