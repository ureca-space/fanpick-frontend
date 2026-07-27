import { useState } from "react";
import css from "./CalendarItemCard/CalendarItemCard.module.css";

const TeamBadge = ({ team }) => {
  const [hasError, setHasError] = useState(false);

  if (!team?.logo || hasError) {
    return <span className={css.teamFallback}>{team?.shortName}</span>;
  }

  return (
    <img
      className={css.teamLogo}
      src={team.logo}
      alt={team.name}
      onError={(event) => {
        event.currentTarget.style.display = "none";
        setHasError(true);
      }}
    />
  );
};

const STATUS_LABELS = {
  scheduled: "경기 예정",
  live: "경기 중",
  finished: "경기 종료",
  postponed: "경기 연기",
  canceled: "경기 취소",
  cancelled: "경기 취소",
};

const formatTooltipDate = (date) => {
  const [, month, day] = String(date ?? "").split("-");

  return month && day ? `${month}.${day}` : "날짜 미정";
};

const getScoreText = (match) => {
  const hasScore =
    Number.isFinite(match.homeScore) && Number.isFinite(match.awayScore);

  return hasScore ? `${match.homeScore} : ${match.awayScore}` : "VS";
};

const CalendarItemCard = ({
  match,
  onClick,
  variant = "cell",
  isAlarmSet = false,
}) => {
  const homeName = match.homeTeam?.shortName || match.homeTeam?.name || "-";
  const awayName = match.awayTeam?.shortName || match.awayTeam?.name || "-";
  const homeFullName = match.homeTeam?.name || homeName;
  const awayFullName = match.awayTeam?.name || awayName;
  const matchLabel = `${homeFullName} vs ${awayFullName}`;
  const leagueLabel = [match.sportLabel, match.league].filter(Boolean).join(" · ");
  const scheduleLabel = [
    formatTooltipDate(match.date),
    match.time || "시간 미정",
  ].join(" · ");
  const statusLabel =
    STATUS_LABELS[String(match.statusCode ?? "").toLowerCase()] ||
    STATUS_LABELS[String(match.statusInfo ?? "").toLowerCase()] ||
    "";
  const venueLabel = match.venue ? `장소 ${match.venue}` : "장소 미정";
  const tooltipTitle = [
    matchLabel,
    leagueLabel,
    `${scheduleLabel}${statusLabel ? ` · ${statusLabel}` : ""}`,
    venueLabel,
  ]
    .filter(Boolean)
    .join("\n");
  const isAgenda = variant === "agenda";
  const isInteractive = Boolean(onClick);
  const RootElement = isInteractive ? "button" : "article";

  const rootProps = isInteractive
    ? {
        type: "button",
        onClick: (event) => {
          event.stopPropagation();
          onClick?.(match);
        },
        "aria-label": `${matchLabel} 경기`,
        title: tooltipTitle,
      }
    : {
        "aria-label": `${matchLabel} 경기`,
        title: tooltipTitle,
      };

  return (
    <RootElement
      className={[
        isAgenda ? css.agendaItemCard : css.calendarItemCard,
        isAlarmSet ? css.calendarItemCardAlarmSet : "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rootProps}
    >
      {isAgenda ? (
        <>
          <div className={css.agendaHeader}>
            <span className={css.agendaMeta}>{leagueLabel}</span>
            {statusLabel ? (
              <span className={css.agendaStatus}>{statusLabel}</span>
            ) : null}
          </div>

          <div className={css.agendaBody}>
            <div className={css.agendaTeam}>
              <TeamBadge team={match.homeTeam} />
              <strong className={css.agendaTeamName}>{homeName}</strong>
            </div>

            <div className={css.agendaCenter}>
              <span className={css.agendaTime}>{match.time || "시간 미정"}</span>
              <strong className={css.agendaScore}>{getScoreText(match)}</strong>
            </div>

            <div className={`${css.agendaTeam} ${css.agendaTeamAway}`}>
              <strong className={css.agendaTeamName}>{awayName}</strong>
              <TeamBadge team={match.awayTeam} />
            </div>
          </div>

          <p className={css.agendaVenue}>{match.venue || "장소 미정"}</p>
        </>
      ) : (
        <>
          <span className={css.matchTooltip} role="tooltip">
            <strong className={css.tooltipTitle}>{matchLabel}</strong>
            <span>{leagueLabel}</span>
            <span>
              {scheduleLabel}
              {statusLabel ? ` · ${statusLabel}` : ""}
            </span>
            <span>{venueLabel}</span>
          </span>

          <div className={css.itemTeams}>
            <div className={css.teamGroup}>
              <TeamBadge team={match.homeTeam} />
              <span className={css.teamName}>{homeName}</span>
            </div>

            <span className={css.vs}>VS</span>

            <div className={css.teamGroup}>
              <span className={css.teamName}>{awayName}</span>
              <TeamBadge team={match.awayTeam} />
            </div>
          </div>
        </>
      )}
    </RootElement>
  );
};

export default CalendarItemCard;
