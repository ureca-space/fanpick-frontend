import { useState } from "react";
import styles from "../MyPage.module.css";

const FavoriteTeamLogo = ({ team }) => {
  const [hasError, setHasError] = useState(false);

  if (!team.logo || hasError) {
    return (
      <div className={styles.favoriteTeamLogoFallback} aria-hidden="true">
        {team.shortName}
      </div>
    );
  }

  return (
    <img
      className={styles.favoriteTeamLogo}
      src={team.logo}
      alt={`${team.name} 로고`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

export default FavoriteTeamLogo;
