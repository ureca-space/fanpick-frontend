import { useState } from "react";
import { useNavigate } from "react-router";
import Button from "../../../../components/Button/Button";
import FanPickDialog from "../../../../components/FanPickDialog/FanPickDialog";
import MatchFilter from "../../../../components/MatchFilter/MatchFilter";
import useAuth from "../../../../contexts/useAuth";
import {
  WORLD_CUP_FILTERS,
  WORLD_CUPS,
} from "../../../WorldCup/data/worldCupData";
import WorldCupMedia from "../../../WorldCup/components/WorldCupMedia/WorldCupMedia";
import styles from "./WorldCupSection.module.css";

const FILTERS = WORLD_CUP_FILTERS.filter((filter) => filter.id !== "all");

const getPreviewWorldCup = (filterId) =>
  WORLD_CUPS.find((worldCup) => worldCup.playId === filterId) ?? WORLD_CUPS[0];

const PlayerPreview = ({ candidate }) => {
  return (
    <div className={styles.playerCard}>
      <div className={styles.playerImageArea}>
        <WorldCupMedia
          src={candidate.image}
          alt={`${candidate.title} 후보`}
          className={styles.playerImage}
          fallbackClassName={styles.imagePlaceholder}
          fallbackLabel={candidate.title}
          loading="lazy"
          draggable="false"
        />

        <div className={styles.imageGradient} aria-hidden="true" />

        <div className={styles.playerInfo}>
          <span className={styles.playerTeam}>{candidate.description}</span>

          <strong className={styles.playerName}>{candidate.title}</strong>
        </div>
      </div>
    </div>
  );
};

const WorldCupSection = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isAuthLoading } = useAuth();

  const [activeFilter, setActiveFilter] = useState("baseball");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingWorldCupPath, setPendingWorldCupPath] = useState("");

  const currentWorldCup = getPreviewWorldCup(activeFilter);
  const previewCandidates = currentWorldCup.candidates.slice(0, 2);

  const handleStartWorldCup = () => {
    if (isAuthLoading) return;

    const worldCupPath = "/worldcup";

    if (!isLoggedIn) {
      setPendingWorldCupPath(worldCupPath);
      setIsDialogOpen(true);
      return;
    }

    navigate(worldCupPath);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setPendingWorldCupPath("");
  };

  const handleMoveToLogin = () => {
    if (!pendingWorldCupPath) return;

    setIsDialogOpen(false);

    navigate("/login", {
      state: {
        from: {
          pathname: pendingWorldCupPath,
          search: "",
          hash: "",
        },
      },
    });

    setPendingWorldCupPath("");
  };

  return (
    <>
      <section className={styles.worldCupSection}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>PICK BATTLE</h2>

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
              {previewCandidates[0] && (
                <PlayerPreview
                  key={previewCandidates[0].id}
                  candidate={previewCandidates[0]}
                />
              )}

              <div className={styles.vsArea} aria-hidden="true">
                <span className={styles.vsBadge}>VS</span>
              </div>

              {previewCandidates[1] && (
                <PlayerPreview
                  key={previewCandidates[1].id}
                  candidate={previewCandidates[1]}
                />
              )}
            </div>

            <div className={styles.cardBottom}>
              <p className={styles.previewText}>{currentWorldCup.title}</p>

              <Button
                className={styles.startButton}
                variant="outline"
                onClick={handleStartWorldCup}
                disabled={isAuthLoading}
              >
                시작하기
              </Button>
            </div>
          </div>
        </div>
      </section>

      <FanPickDialog
        isOpen={isDialogOpen}
        title="로그인이 필요합니다"
        description="선수 월드컵에 참여하려면 먼저 로그인해 주세요."
        confirmText="로그인하기"
        cancelText="취소"
        onClose={handleCloseDialog}
        onConfirm={handleMoveToLogin}
      />
    </>
  );
};

export default WorldCupSection;
