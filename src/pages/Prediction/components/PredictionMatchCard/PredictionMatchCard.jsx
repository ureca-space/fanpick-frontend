import { forwardRef } from "react";
import Skeleton from "../../../../components/Skeleton/Skeleton";
import { SPORT_ICONS } from "../../predictionUtils";
import TeamMark from "../TeamMark/TeamMark";
import styles from "./PredictionMatchCard.module.css";

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

const PredictionTeamCell = ({
  disabled = false,
  homeAwaySide,
  isClosed = false,
  onSelect,
  rate,
  selected = false,
  team,
  value,
}) => {
  const isAway = homeAwaySide === "away";
  const isInteractive = Boolean(onSelect);
  const CellTag = isInteractive ? "button" : "div";
  const cellProps = isInteractive
    ? {
        "aria-pressed": selected,
        disabled,
        onClick: onSelect,
        type: "button",
      }
    : {};

  return (
    <CellTag
      className={joinClassNames(styles.teamCell, isAway && styles.awayTeam)}
      data-selected={selected ? "true" : undefined}
      {...cellProps}
    >
      {isAway ? <b>{value}</b> : null}

      <span className={styles.teamIdentity}>
        {!isAway ? <TeamMark team={team} /> : null}

        <span className={styles.teamText}>
          <strong>{team.name}</strong>
          {selected ? <small className={styles.myPickBadge}>내 선택</small> : null}
          {isClosed ? <small>{rate}%</small> : null}
        </span>

        {isAway ? <TeamMark team={team} /> : null}
      </span>

      {!isAway ? <b>{value}</b> : null}
    </CellTag>
  );
};

const PredictionMatchCard = forwardRef(function PredictionMatchCard(
  {
    awayDisabled = false,
    awayValue,
    boardTone = "waiting",
    className = "",
    headingStatusLabel,
    homeDisabled = false,
    homeValue,
    isCancelled = false,
    isClosed = false,
    isTarget = false,
    match,
    onAwaySelect,
    onHomeSelect,
    selection,
    statusLabel,
    statusTone = "waiting",
    variant = "default",
  },
  ref,
) {
  const SportIcon = SPORT_ICONS[match.sport];
  const homeRate = match.homeRate ?? 50;
  const awayRate = match.awayRate ?? 50;

  return (
    <article
      className={joinClassNames(styles.matchCard, className)}
      data-target={isTarget ? "true" : undefined}
      data-variant={variant}
      ref={ref}
      tabIndex={isTarget ? -1 : undefined}
    >
      <div className={styles.matchMeta}>
        <span>{match.sportLabel}</span>
        {SportIcon ? (
          <span className={styles.sportIcon} aria-hidden="true">
            <SportIcon />
          </span>
        ) : null}
        <strong>{match.league}</strong>
      </div>

      <div className={styles.matchHeading}>
        <p>
          <strong>{match.time}</strong> {headingStatusLabel}
        </p>
        <span className={styles.statusBadge} data-tone={statusTone}>
          {statusLabel}
        </span>
      </div>

      <div
        className={styles.teamBoard}
        data-cancelled={isCancelled ? "true" : undefined}
        data-closed={isClosed ? "true" : undefined}
        data-tone={boardTone}
      >
        <PredictionTeamCell
          disabled={homeDisabled}
          homeAwaySide="home"
          isClosed={isClosed}
          onSelect={onHomeSelect}
          rate={homeRate}
          selected={selection === "home"}
          team={match.homeTeam}
          value={homeValue}
        />

        <PredictionTeamCell
          disabled={awayDisabled}
          homeAwaySide="away"
          isClosed={isClosed}
          onSelect={onAwaySelect}
          rate={awayRate}
          selected={selection === "away"}
          team={match.awayTeam}
          value={awayValue}
        />
      </div>

      <small className={styles.participants}>
        {(match.participants ?? 0).toLocaleString()}명 참여
      </small>
    </article>
  );
});

export const PredictionMatchCardSkeleton = ({
  ariaLabel = "예측 경기 로딩 중",
  variant = "default",
}) => (
  <article
    className={joinClassNames(styles.matchCard, styles.skeletonCard)}
    data-variant={variant}
    aria-label={ariaLabel}
  >
    <div className={styles.matchMeta}>
      <Skeleton.Line className={styles.skeletonMetaShort} />
      <Skeleton.Circle className={styles.skeletonSportIcon} />
      <Skeleton.Line className={styles.skeletonMetaLong} />
    </div>

    <div className={styles.matchHeading}>
      <Skeleton.Line className={styles.skeletonHeading} />
      <Skeleton.Line className={styles.skeletonStatus} />
    </div>

    <div className={styles.teamBoard}>
      <div className={styles.teamCell}>
        <span className={styles.teamIdentity}>
          <Skeleton.Circle className={styles.skeletonTeamMark} />

          <span className={styles.teamText}>
            <Skeleton.Line className={styles.skeletonTeamName} />
            <Skeleton.Line className={styles.skeletonTeamSubtext} />
          </span>
        </span>

        <Skeleton.Line className={styles.skeletonScore} />
      </div>

      <div className={joinClassNames(styles.teamCell, styles.awayTeam)}>
        <Skeleton.Line className={styles.skeletonScore} />

        <span className={styles.teamIdentity}>
          <span className={styles.teamText}>
            <Skeleton.Line className={styles.skeletonTeamName} />
            <Skeleton.Line className={styles.skeletonTeamSubtext} />
          </span>

          <Skeleton.Circle className={styles.skeletonTeamMark} />
        </span>
      </div>
    </div>

    <Skeleton.Line className={styles.skeletonParticipants} />
  </article>
);

export default PredictionMatchCard;
