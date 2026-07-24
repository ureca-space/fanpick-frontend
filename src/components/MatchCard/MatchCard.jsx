import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../contexts/useAuth";
import {
  createPredictionLocation,
  createPredictionPath,
} from "../../utils/predictionPath";
import Button from "../Button/Button";
import FanPickDialog from "../FanPickDialog/FanPickDialog";
import styles from "./MatchCard.module.css";

const MATCH_STATUS_LABELS = {
  live: "LIVE",
  finished: "종료",
  cancelled: "취소",
  postponed: "연기",
};

const SCORE_VISIBLE_STATUSES = new Set(["live", "finished"]);

const TeamLogo = ({ src, name, shortName }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={styles.logoFallback} aria-hidden="true">
        {shortName}
      </div>
    );
  }

  return (
    <img
      className={styles.teamLogo}
      src={src}
      alt={`${name} 로고`}
      onError={() => setHasError(true)}
    />
  );
};

const MatchCard = ({ match }) => {
  const navigate = useNavigate();
  const { isLoggedIn, isAuthLoading } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalVotes = match.homeVotes + match.awayVotes;

  const homeVoteRate =
    totalVotes === 0 ? 50 : Math.round((match.homeVotes / totalVotes) * 100);

  const awayVoteRate = 100 - homeVoteRate;

  const predictionMatchId = match.databaseId ?? match.id;
  const predictionPath = createPredictionPath({ matchId: predictionMatchId });
  const isPredicted = Boolean(match.isPredicted);
  const statusLabel = MATCH_STATUS_LABELS[match.status];
  const hasScore =
    SCORE_VISIBLE_STATUSES.has(match.status) && Boolean(match.score);
  const scoreText = hasScore ? match.score.replace(":", " : ") : "VS";

  const handleVoteClick = () => {
    if (isAuthLoading || isPredicted) return;

    if (!isLoggedIn) {
      setIsDialogOpen(true);
      return;
    }

    navigate(predictionPath);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleMoveToLogin = () => {
    setIsDialogOpen(false);

    navigate("/login", {
      state: {
        from: createPredictionLocation({ matchId: predictionMatchId }),
      },
    });
  };

  return (
    <>
      <article className={styles.matchCard}>
        <div className={styles.cardHeader}>
          <span className={styles.sportBadge}>{match.sportLabel}</span>

          <div className={styles.headerMeta}>
            {statusLabel && (
              <span
                className={`${styles.statusBadge} ${
                  match.status === "live" ? styles.statusBadgeLive : ""
                }`}
              >
                {statusLabel}
              </span>
            )}

            <span className={styles.league}>{match.league}</span>
          </div>
        </div>

        <div className={styles.matchInfo}>
          <strong className={styles.matchDate}>
            {match.date} <span>[{match.day}]</span>
          </strong>

          <p className={styles.matchTime}>
            {match.time} | {match.venue}
          </p>
        </div>

        <div className={styles.teams}>
          <div className={styles.team}>
            <TeamLogo
              src={match.homeTeam.logo}
              name={match.homeTeam.name}
              shortName={match.homeTeam.shortName}
            />

            <span className={styles.teamName}>{match.homeTeam.name}</span>
          </div>

          <span className={`${styles.vs} ${hasScore ? styles.score : ""}`}>
            {scoreText}
          </span>

          <div className={styles.team}>
            <TeamLogo
              src={match.awayTeam.logo}
              name={match.awayTeam.name}
              shortName={match.awayTeam.shortName}
            />

            <span className={styles.teamName}>{match.awayTeam.name}</span>
          </div>
        </div>

        <div className={styles.voteArea}>
          <div className={styles.voteLabels}>
            <span>
              {match.homeTeam.name}
              <strong>{homeVoteRate}%</strong>
            </span>

            <span>
              <strong>{awayVoteRate}%</strong>
              {match.awayTeam.name}
            </span>
          </div>

          <div className={styles.voteBar}>
            <span
              className={styles.homeVoteBar}
              style={{ width: `${homeVoteRate}%` }}
            />

            <span
              className={styles.awayVoteBar}
              style={{ width: `${awayVoteRate}%` }}
            />
          </div>
        </div>

        <Button
          disabled={isAuthLoading || isPredicted}
          fullWidth
          onClick={handleVoteClick}
          size="sm"
          variant="outline"
        >
          {isPredicted ? "투표완료" : "투표하기"}
        </Button>
      </article>

      <FanPickDialog
        isOpen={isDialogOpen}
        title="로그인이 필요합니다"
        description="경기 승부 예측에 참여하려면 먼저 로그인해 주세요."
        confirmText="로그인하기"
        cancelText="취소"
        onClose={handleCloseDialog}
        onConfirm={handleMoveToLogin}
      />
    </>
  );
};

export default MatchCard;
