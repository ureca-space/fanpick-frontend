import styles from "./PredictionBadgeIcon.module.css";

const PredictionBadgeIcon = ({
  badge,
  className = "",
  size = "md",
  ...props
}) => {
  const SportIcon = badge?.SportIcon;
  const TierIcon = badge?.TierIcon;

  if (!SportIcon || !TierIcon) {
    return null;
  }

  return (
    <span
      className={[styles.icon, className].filter(Boolean).join(" ")}
      data-size={size}
      data-tier={badge.tier}
      aria-hidden="true"
      {...props}
    >
      <SportIcon />

      <span className={styles.tierIcon}>
        <TierIcon />
      </span>
    </span>
  );
};

export default PredictionBadgeIcon;
