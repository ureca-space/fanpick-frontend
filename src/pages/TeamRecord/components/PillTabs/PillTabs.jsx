import styles from "./PillTabs.module.css";

const PillTabs = ({ tabs, activeId, onChange, ariaLabel, variant = "filter" }) => {
  return (
    <div
      className={`${styles.tabs} ${styles[`${variant}Tabs`] ?? ""}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;

        return (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${styles[variant] ?? ""} ${
              isActive ? styles.active : ""
            }`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-pressed={isActive}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default PillTabs;
