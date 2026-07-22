import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "./WeekDateSelector.module.css";

const padNumber = (number) => String(number).padStart(2, "0");

const formatDateRange = (dates) => {
  if (dates.length === 0) {
    return "";
  }

  const formatDate = (date) =>
    [
      date.getFullYear(),
      padNumber(date.getMonth() + 1),
      padNumber(date.getDate()),
    ].join(".");

  return `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`;
};

const WeekDateSelector = ({
  className = "",
  currentWeekLabel = "이번 주",
  dates = [],
  hasItemOnDate = () => false,
  onMoveToCurrentWeek = () => {},
  onMoveWeek = () => {},
  onSelectDate = () => {},
  selectedDate,
}) => {
  const classNames = [styles.weekDateSelector, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      <div className={styles.toolbar}>
        <div className={styles.weekController}>
          <button
            className={styles.arrowButton}
            type="button"
            aria-label="이전 주 보기"
            onClick={() => onMoveWeek(-1)}
          >
            <FiChevronLeft aria-hidden="true" />
          </button>

          <strong className={styles.weekRange}>
            {formatDateRange(dates.map((weekDate) => weekDate.date))}
          </strong>

          <button
            className={styles.arrowButton}
            type="button"
            aria-label="다음 주 보기"
            onClick={() => onMoveWeek(1)}
          >
            <FiChevronRight aria-hidden="true" />
          </button>
        </div>

        <button
          className={styles.currentWeekButton}
          type="button"
          onClick={onMoveToCurrentWeek}
        >
          <FiCalendar aria-hidden="true" />
          {currentWeekLabel}
        </button>
      </div>

      <div className={styles.dateScroller}>
        <div className={styles.dateList}>
          {dates.map(({ date, dateKey, dayLabel }) => {
            const isSelected = selectedDate === dateKey;
            const hasItem = hasItemOnDate(dateKey);

            return (
              <button
                key={dateKey}
                className={`${styles.dateButton} ${
                  isSelected ? styles.active : ""
                }`}
                type="button"
                aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일 ${dayLabel}요일`}
                aria-pressed={isSelected}
                onClick={() => onSelectDate(dateKey)}
              >
                <span className={styles.dayLabel}>{dayLabel}</span>

                <strong className={styles.dateNumber}>
                  {date.getDate()}
                </strong>

                {hasItem && (
                  <span className={styles.itemDot} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekDateSelector;
