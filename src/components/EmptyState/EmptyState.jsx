import styles from "./EmptyState.module.css";

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

const EmptyState = ({
  action,
  className = "",
  description,
  icon: Icon,
  title,
}) => (
  <div className={joinClassNames(styles.emptyState, className)}>
    {Icon && <Icon className={styles.icon} aria-hidden="true" />}

    <strong>{title}</strong>
    {description && <p>{description}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
);

export default EmptyState;
