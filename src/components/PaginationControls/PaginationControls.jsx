import styles from "./PaginationControls.module.css";

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

const PaginationControls = ({
  ariaLabel = "페이지 이동",
  className = "",
  currentPage,
  nextLabel = "다음 페이지",
  onNext,
  onPrevious,
  previousLabel = "이전 페이지",
  totalPages,
}) => {
  const hasPages = totalPages > 0;
  const safeCurrentPage = hasPages
    ? Math.min(Math.max(currentPage, 0), totalPages - 1)
    : 0;

  return (
    <div className={joinClassNames(styles.controls, className)} aria-label={ariaLabel}>
      {hasPages && (
        <span className={styles.page}>
          {safeCurrentPage + 1} / {totalPages}
        </span>
      )}

      <button
        type="button"
        className={styles.button}
        aria-label={previousLabel}
        onClick={onPrevious}
        disabled={!hasPages || safeCurrentPage === 0}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5L8 12L15 19" />
        </svg>
      </button>

      <button
        type="button"
        className={styles.button}
        aria-label={nextLabel}
        onClick={onNext}
        disabled={!hasPages || safeCurrentPage >= totalPages - 1}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5L16 12L9 19" />
        </svg>
      </button>
    </div>
  );
};

export default PaginationControls;
