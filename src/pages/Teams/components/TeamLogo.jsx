import { useState } from "react";
import styles from "../TeamDetailPage.module.css";

const TeamLogo = ({ team, className = "" }) => {
  const [hasError, setHasError] = useState(false);

  if (!team.logo || hasError) {
    return (
      <div className={`${styles.logoFallback} ${className}`} aria-hidden="true">
        {team.shortName}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={team.logo}
      alt={`${team.name} 로고`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

export const TeamBadgeLogo = ({ team }) => {
  const [hasError, setHasError] = useState(false);

  if (!team.logo || hasError) {
    return (
      <span className={styles.matchLogoFallback} aria-hidden="true">
        {team.shortName}
      </span>
    );
  }

  return (
    <img
      className={styles.matchLogo}
      src={team.logo}
      alt={`${team.name} 로고`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

export default TeamLogo;
