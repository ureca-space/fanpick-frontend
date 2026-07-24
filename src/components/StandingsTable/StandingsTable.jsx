import { useState } from "react";
import { getTeamInfo } from "../../constants/teamInfo";
import styles from "./StandingsTable.module.css";

const STANDING_COLUMNS = {
  kbo: [
    { key: "games", label: "경기" },
    { key: "wins", label: "승" },
    { key: "draws", label: "무", optional: true },
    { key: "losses", label: "패" },
    { key: "gamesBehind", label: "게임차", optional: true },
    { key: "winRate", label: "승률" },
  ],
  kleague: [
    { key: "games", label: "경기" },
    { key: "points", label: "승점" },
    { key: "wins", label: "승" },
    { key: "draws", label: "무", optional: true },
    { key: "losses", label: "패" },
    { key: "scoreDiff", label: "득실", optional: true },
  ],
  lck: [
    { key: "games", label: "경기" },
    { key: "wins", label: "승" },
    { key: "losses", label: "패" },
    { key: "scoreDiff", label: "득실", optional: true },
    { key: "winRate", label: "승률" },
    { key: "kda", label: "KDA", optional: true },
  ],
};

const FIELD_ALIASES = {
  assists: "assists",
  deaths: "deaths",
  draws: "draws",
  games: "games",
  gamesBehind: "games_behind",
  kda: "kda",
  kills: "kills",
  losses: "losses",
  points: "points",
  scoreAgainst: "score_against",
  scoreDiff: "score_diff",
  scoreFor: "score_for",
  winRate: "win_rate",
  wins: "wins",
};

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

const normalizeTeamCode = (teamCode) => teamCode?.trim().toUpperCase() ?? "";

const formatValue = (value) =>
  value === null || value === undefined || value === "" ? "-" : value;

function formatWinRate(value) {
  const rate = Number(value);

  if (!Number.isFinite(rate)) {
    return "-";
  }

  return rate.toFixed(3);
}

const getStandingValue = (standing, key) => {
  const alias = FIELD_ALIASES[key];

  return standing[key] ?? standing[alias] ?? "";
};

const renderStandingValue = (standing, key) => {
  const value = getStandingValue(standing, key);

  return key === "winRate" ? formatWinRate(value) : formatValue(value);
};

const getStandingTeam = (standing, league) => {
  const standingTeam = standing.team ?? {};
  const code = normalizeTeamCode(
    standing.team_code ?? standingTeam.code ?? standingTeam.shortName,
  );
  const officialTeam = code ? getTeamInfo(code, league.sport) : {};

  return {
    code,
    id: standing.team_id ?? standingTeam.id ?? officialTeam.id ?? code,
    logo: standingTeam.logo ?? officialTeam.logo ?? "",
    name:
      standingTeam.name ??
      officialTeam.name ??
      standing.team_name ??
      standingTeam.shortName ??
      code,
    shortName: standingTeam.shortName ?? officialTeam.shortName ?? code,
  };
};

const isActiveStanding = (standing, activeTeam, standingTeam) => {
  if (!activeTeam) {
    return false;
  }

  const standingCodes = [
    standingTeam.code,
    standingTeam.shortName,
    standing.team_code,
  ].map(normalizeTeamCode);

  return (
    standingTeam.id === activeTeam.id ||
    standing.team_id === activeTeam.id ||
    activeTeam.matchCodes?.some((teamCode) =>
      standingCodes.includes(normalizeTeamCode(teamCode)),
    )
  );
};

const TeamLogo = ({ team }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <span className={styles.teamLogo}>
      {team.logo && !hasError ? (
        <img
          src={team.logo}
          alt=""
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{team.shortName?.slice(0, 2) ?? "-"}</span>
      )}
    </span>
  );
};

const StandingsTable = ({ activeTeam = null, className = "", league, standings }) => {
  const columns = STANDING_COLUMNS[league.id] ?? STANDING_COLUMNS.kbo;

  return (
    <div className={joinClassNames(styles.tableWrap, className)}>
      <table className={styles.standingsTable}>
        <thead>
          <tr>
            <th>순위</th>
            <th>팀</th>
            {columns.map((column) => (
              <th
                className={column.optional ? styles.optionalColumn : ""}
                key={column.key}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((standing) => {
            const standingTeam = getStandingTeam(standing, league);

            return (
              <tr
                data-active={isActiveStanding(standing, activeTeam, standingTeam)}
                key={`${league.id}-${standing.id ?? standingTeam.id}`}
              >
                <td>{standing.rank}</td>
                <td>
                  <span className={styles.standingTeam}>
                    <TeamLogo team={standingTeam} />
                    <b>{standingTeam.name}</b>
                  </span>
                </td>
                {columns.map((column) => (
                  <td
                    className={column.optional ? styles.optionalColumn : ""}
                    key={column.key}
                  >
                    {renderStandingValue(standing, column.key)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsTable;
