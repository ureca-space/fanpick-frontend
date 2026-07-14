import styles from "./MatchFilter.module.css";

const MatchFilter = ({ filters, activeFilter, onChange }) => {
  return (
    <div className={styles.filters}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            className={`${styles.filterButton} ${
              isActive ? styles.active : ""
            }`}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(filter.id)}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};

export default MatchFilter;
