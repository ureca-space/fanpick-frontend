import { useState } from "react";
import { isLiveMatchStatus } from "../../utils/matchStatus";
import PredictionResultInsight from "../PredictionResultInsight/PredictionResultInsight";
import styles from "./PredictionResultMatchCard.module.css";

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

const normalizeTeamCode = (teamCode) => teamCode?.trim().toUpperCase() ?? "";

const parseScore = (score) => {
  if (!score) {
    return {
      awayScore: null,
      homeScore: null,
    };
  }

  const [awayScore, homeScore] = String(score).split(":").map(Number);

  return {
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
  };
};

const getTeamName = (team) => team?.name ?? team?.shortName ?? "-";

const getMatchTeamCode = (match, side) =>
  normalizeTeamCode(
    match[`${side}TeamCode`] ??
      match[`${side}_team_code`] ??
      match[`${side}Team`]?.code ??
      match[`${side}Team`]?.shortName,
  );

const getFocusTeamSide = (match, focusTeam) => {
  if (!focusTeam) {
    return "";
  }

  if (focusTeam.id && match.homeTeam?.id === focusTeam.id) {
    return "home";
  }

  if (focusTeam.id && match.awayTeam?.id === focusTeam.id) {
    return "away";
  }

  const focusTeamCodes = [
    focusTeam.code,
    focusTeam.shortName,
    ...(focusTeam.matchCodes ?? []),
  ].map(normalizeTeamCode);

  if (focusTeamCodes.includes(getMatchTeamCode(match, "home"))) {
    return "home";
  }

  if (focusTeamCodes.includes(getMatchTeamCode(match, "away"))) {
    return "away";
  }

  return "";
};

const getFocusTeamResult = ({ awayScore, focusTeam, hasScore, homeScore, match }) => {
  if (!focusTeam) {
    return "";
  }

  if (match.status === "cancelled" || match.status === "postponed") {
    return match.status;
  }

  if (isLiveMatchStatus(match.status)) {
    return "live";
  }

  if (!hasScore) {
    return "";
  }

  if (awayScore === homeScore) {
    return "draw";
  }

  const focusTeamSide = getFocusTeamSide(match, focusTeam);

  if (focusTeamSide === "home") {
    return homeScore > awayScore ? "win" : "loss";
  }

  if (focusTeamSide === "away") {
    return awayScore > homeScore ? "win" : "loss";
  }

  return "";
};

const FOCUS_RESULT_LABELS = {
  cancelled: "경기 취소",
  draw: "무승부",
  loss: "패배",
  live: "경기중",
  postponed: "경기 연기",
  win: "승리",
};

const getDisplayScore = (match, side) => {
  if (side === "away" && match.awayScore !== undefined) {
    return match.awayScore;
  }

  if (side === "home" && match.homeScore !== undefined) {
    return match.homeScore;
  }

  const scores = parseScore(match.score);

  return side === "away" ? scores.awayScore : scores.homeScore;
};

const getMatchDate = (match) => match.dateLabel ?? match.date ?? "--.--";

const getMatchLeague = (match) => match.leagueLabel ?? match.league ?? "";

const TeamLogo = ({ team }) => {
  const [hasError, setHasError] = useState(false);
  const teamName = getTeamName(team);

  return (
    <span className={styles.teamLogo}>
      {team?.logo && !hasError ? (
        <img
          src={team.logo}
          alt=""
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{team?.shortName?.slice(0, 2) ?? teamName.slice(0, 2)}</span>
      )}
    </span>
  );
};

const MatchTeam = ({ align = "left", score, team }) => (
  <div
    className={joinClassNames(
      styles.matchTeam,
      align === "right" && styles.rightTeam,
    )}
  >
    <span className={styles.teamVisual}>
      <TeamLogo team={team} />
    </span>
    <span className={styles.teamName}>{getTeamName(team)}</span>
    {score !== null && score !== undefined && (
      <b className={styles.teamScore}>{score}</b>
    )}
  </div>
);

const PredictionRateBar = ({ awayRate, awayTeam, homeRate, homeTeam }) => (
  <div className={styles.predictionRates}>
    <div className={styles.rateLabels}>
      <span>
        {getTeamName(awayTeam)} <b>{awayRate}%</b>
      </span>
      <span>
        <b>{homeRate}%</b> {getTeamName(homeTeam)}
      </span>
    </div>
    <div className={styles.rateTrack}>
      <span style={{ width: `${awayRate}%` }} />
    </div>
  </div>
);

const PredictionResultMatchCard = ({
  className = "",
  focusTeam = null,
  match,
  showPrediction = true,
}) => {
  const awayRate = Number(match.awayVotes ?? 50);
  const homeRate = Number(match.homeVotes ?? 50);
  const awayScore = getDisplayScore(match, "away");
  const homeScore = getDisplayScore(match, "home");
  const hasScore =
    awayScore !== null &&
    awayScore !== undefined &&
    homeScore !== null &&
    homeScore !== undefined;
  const displayAwayScore = hasScore ? awayScore : "-";
  const displayHomeScore = hasScore ? homeScore : "-";
  const focusResult = getFocusTeamResult({
    awayScore,
    focusTeam,
    hasScore,
    homeScore,
    match,
  });

  return (
    <article
      className={joinClassNames(styles.matchCard, className)}
      data-focus-result={focusResult || undefined}
    >
      <div className={styles.matchTop}>
        <span>
          {match.sportLabel} · {getMatchLeague(match)}
        </span>
        <b className={styles.matchDate}>
          {getMatchDate(match)} · {match.time}
        </b>
      </div>

      <div className={styles.matchScore}>
        <MatchTeam team={match.awayTeam} score={displayAwayScore} />
        <strong>VS</strong>
        <MatchTeam
          align="right"
          team={match.homeTeam}
          score={displayHomeScore}
        />
      </div>

      <div className={styles.mobileScoreRow} aria-hidden="true">
        <b>{displayAwayScore}</b>
        <span>:</span>
        <b>{displayHomeScore}</b>
      </div>

      {showPrediction && (
        <>
          <PredictionRateBar
            awayRate={Number.isFinite(awayRate) ? awayRate : 50}
            awayTeam={match.awayTeam}
            homeRate={Number.isFinite(homeRate) ? homeRate : 50}
            homeTeam={match.homeTeam}
          />

          <PredictionResultInsight match={match} />

          <p className={styles.participants}>
            {(match.participants ?? 0).toLocaleString()}명 참여
          </p>
        </>
      )}

      {focusResult && (
        <div className={styles.focusResultArea}>
          <b className={styles.focusResultBadge} data-result={focusResult}>
            {FOCUS_RESULT_LABELS[focusResult]}
          </b>
        </div>
      )}
    </article>
  );
};

export default PredictionResultMatchCard;
