import { TEAM_BY_ID } from "../Teams/data/teams";

export const SPORT_FILTERS = [
  { id: "my", label: "MY" },
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "lol", label: "LOL" },
];

export const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const CALENDAR_SKELETON_DAYS = Array.from(
  { length: 42 },
  (_, index) => index,
);
export const SUPPORTED_SPORTS = new Set(["baseball", "soccer", "lol"]);

const EXCLUDED_BASEBALL_TEAM_CODES = new Set(["NANUM", "DREAM"]);

export const getMonthRange = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const fromDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0);
  const toDate = `${lastDay.getFullYear()}-${String(
    lastDay.getMonth() + 1,
  ).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

  return { fromDate, toDate };
};

export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const formatSelectedDateLabel = (dateKey) => {
  const [year, month, day] = String(dateKey ?? "").split("-");

  return year && month && day ? `${year}.${month}.${day}` : "날짜 미정";
};

const normalizeTeamValue = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const getTeamValueCandidates = (team) =>
  [team?.code, team?.shortName, team?.name, team?.alias]
    .filter(Boolean)
    .map(normalizeTeamValue);

export const getFeaturedTeamMatchValues = (team) =>
  [
    team?.id,
    team?.name,
    team?.shortName,
    ...(Array.isArray(team?.matchCodes) ? team.matchCodes : []),
  ]
    .filter(Boolean)
    .map(normalizeTeamValue);

export const isMatchForTeamValues = (match, teamValues) =>
  [match.homeTeam, match.awayTeam].some((team) =>
    getTeamValueCandidates(team).some((teamValue) => teamValues.has(teamValue)),
  );

export const getUniqueTeams = (matches) => {
  const teamMap = new Map();

  matches.forEach((match) => {
    [match.homeTeam, match.awayTeam].forEach((team) => {
      if (!team?.code || teamMap.has(team.code)) {
        return;
      }

      teamMap.set(team.code, team);
    });
  });

  return Array.from(teamMap.values());
};

export const isExcludedCalendarTeam = (team) => {
  return EXCLUDED_BASEBALL_TEAM_CODES.has(normalizeTeamValue(team?.code));
};

export const isMatchingTeam = (team, selectedTeamCode) => {
  if (!team || selectedTeamCode === "all") {
    return false;
  }

  const featuredTeam = TEAM_BY_ID.get(selectedTeamCode);
  const targetValues = new Set(
    featuredTeam
      ? getFeaturedTeamMatchValues(featuredTeam)
      : [normalizeTeamValue(selectedTeamCode)],
  );

  return getTeamValueCandidates(team).some((teamValue) =>
    targetValues.has(teamValue),
  );
};

export const groupMatchesByDate = (matches) =>
  matches.reduce((acc, match) => {
    if (!acc[match.date]) {
      acc[match.date] = [];
    }

    acc[match.date].push(match);
    return acc;
  }, {});

export const addTeamLogo = (team) => ({
  ...team,
  logo: team.logo || "",
});

export const isAlarmUnavailableMatch = (match) => {
  const status = String(match?.statusCode ?? match?.statusInfo ?? "")
    .trim()
    .toLowerCase();

  return [
    "finished",
    "ended",
    "final",
    "ft",
    "canceled",
    "cancelled",
    "postponed",
  ].includes(status);
};
