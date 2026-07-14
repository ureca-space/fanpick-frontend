import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MatchFilter from "../../../../components/MatchFilter/MatchFilter";
import styles from "./WorldCupSection.module.css";

const FILTERS = [
  { id: "soccer", label: "SOCCER" },
  { id: "baseball", label: "BASEBALL" },
  { id: "basketball", label: "BASKETBALL" },
  { id: "esports", label: "LOL" },
];

const WORLD_CUPS = {
  soccer: {
    leftPlayer: {
      name: "손흥민",
      team: "KOREA",
      image: "/images/worldcup/soccer/son.jpg",
    },
    rightPlayer: {
      name: "킬리안 음바페",
      team: "FRANCE",
      image: "/images/worldcup/soccer/mbappe.jpg",
    },
  },

  baseball: {
    leftPlayer: {
      name: "이정후",
      team: "SAN FRANCISCO",
      image: "/images/worldcup/baseball/lee-jung-hoo.jpg",
    },
    rightPlayer: {
      name: "오타니 쇼헤이",
      team: "LOS ANGELES",
      image: "/images/worldcup/baseball/ohtani.jpg",
    },
  },

  basketball: {
    leftPlayer: {
      name: "Stephen Curry",
      team: "GOLDEN STATE",
      image: "/images/worldcup/basketball/curry.jpg",
    },
    rightPlayer: {
      name: "LeBron James",
      team: "LOS ANGELES",
      image: "/images/worldcup/basketball/lebron.jpg",
    },
  },

  esports: {
    leftPlayer: {
      name: "Chovy",
      team: "GEN.G",
      image: "/images/worldcup/lol/chovy.jpg",
    },
    rightPlayer: {
      name: "Faker",
      team: "T1",
      image: "/images/worldcup/lol/faker.jpg",
    },
  },
};

const PlayerPreview = ({ player }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={styles.playerCard}>
      <div className={styles.playerImageArea}>
        {!imageError ? (
          <img
            className={styles.playerImage}
            src={player.image}
            alt={`${player.name} 선수`}
            loading="lazy"
            draggable="false"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true">
            <span className={styles.placeholderText}>PLAYER</span>
          </div>
        )}

        <div className={styles.imageGradient} aria-hidden="true" />

        <div className={styles.playerInfo}>
          <span className={styles.playerTeam}>{player.team}</span>
          <strong className={styles.playerName}>{player.name}</strong>
        </div>
      </div>
    </div>
  );
};

const WorldCupSection = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("soccer");

  const currentWorldCup = WORLD_CUPS[activeFilter];

  const handleStartWorldCup = () => {
    navigate(`/worldcup/${activeFilter}`);
  };

  return (
    <section className={styles.worldCupSection}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>PLAYER PICK</h2>

          <p className={styles.sectionDescription}>
            인기 선수 중 당신의 최애 선수를 선택해 보세요.
          </p>
        </div>

        <div className={styles.filterArea}>
          <MatchFilter
            filters={FILTERS}
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        <div className={styles.worldCupCard}>
          <div className={styles.matchup}>
            <PlayerPreview
              key={currentWorldCup.leftPlayer.image}
              player={currentWorldCup.leftPlayer}
            />

            <div className={styles.vsArea} aria-hidden="true">
              <span className={styles.vsBadge}>VS</span>
            </div>

            <PlayerPreview
              key={currentWorldCup.rightPlayer.image}
              player={currentWorldCup.rightPlayer}
            />
          </div>

          <div className={styles.cardBottom}>
            <p className={styles.previewText}>대표 선수 미리보기입니다.</p>

            <button
              type="button"
              className={styles.startButton}
              onClick={handleStartWorldCup}
            >
              시작하기
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorldCupSection;
