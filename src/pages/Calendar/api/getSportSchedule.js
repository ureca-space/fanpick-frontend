import { supabase } from "../../../lib/supabase";
import { getTeamInfo } from "../../../constants/teamInfo";

const SPORT_CONFIGS = {
  baseball: {
    dbSport: "baseball",
    appSport: "baseball",
    sportLabel: "BASEBALL",
    leagueLabel: "KBO",
  },
  soccer: {
    dbSport: "soccer",
    appSport: "soccer",
    sportLabel: "SOCCER",
    leagueLabel: "K League 1",
  },
  lol: {
    dbSport: "esports",
    appSport: "lol",
    sportLabel: "LOL",
    leagueLabel: "LCK",
  },
};

const formatScheduleTime = (time) => {
  const normalizedTime = String(time ?? "").trim();

  if (!normalizedTime || normalizedTime.toUpperCase() === "TBD") {
    return "TBD";
  }

  return normalizedTime;
};

const toSortTimestamp = (date, time) => {
  if (!date) {
    return 0;
  }

  const normalizedTime = !time || time === "TBD" ? "00:00:00" : `${time}:00`;
  const timestamp = new Date(`${date}T${normalizedTime}`);

  return Number.isNaN(timestamp.getTime()) ? 0 : timestamp.getTime();
};

const parseScore = (score, index) => {
  if (typeof score !== "string" || !score.includes(":")) {
    return null;
  }

  const values = score.split(":").map((item) => Number(item));

  return Number.isFinite(values[index]) ? values[index] : null;
};

const getSportConfigs = (sport) => {
  if (sport === "my" || sport === "all") {
    return Object.values(SPORT_CONFIGS);
  }

  const sportConfig = SPORT_CONFIGS[sport];

  return sportConfig ? [sportConfig] : [];
};

const normalizeCalendarTeam = (teamCode, match, side, sportConfig) => {
  const teamInfo = getTeamInfo(teamCode || "", sportConfig.dbSport);

  return {
    ...teamInfo,
    code: teamCode || "",
    name: match[`${side}_team_name`] || teamInfo.name,
    shortName: match[`${side}_team_short_name`] || teamInfo.shortName,
    logo: match[`${side}_team_logo`] || teamInfo.logo,
  };
};

const normalizeCalendarMatch = (match, sportConfig) => ({
  id:
    match.id ||
    match.external_id ||
    `${sportConfig.appSport}-${match.match_date}-${match.home_team_code}-${match.away_team_code}`,
  externalId: match.external_id || match.id || "",
  sport: sportConfig.appSport,
  sportLabel: sportConfig.sportLabel,
  league: match.league || sportConfig.leagueLabel,
  date: match.match_date || "",
  time: formatScheduleTime(match.match_time),
  venue: match.venue || "",
  homeTeam: normalizeCalendarTeam(
    match.home_team_code,
    match,
    "home",
    sportConfig,
  ),
  awayTeam: normalizeCalendarTeam(
    match.away_team_code,
    match,
    "away",
    sportConfig,
  ),
  homeScore: parseScore(match.score, 1),
  awayScore: parseScore(match.score, 0),
  statusCode: match.status || "scheduled",
  statusInfo: match.status || "scheduled",
  reversedHomeAway: false,
  broadcast: match.broadcast || "",
  note: match.note || "",
});

const sortMatches = (matches = []) =>
  [...matches].sort(
    (a, b) => toSortTimestamp(a.date, a.time) - toSortTimestamp(b.date, b.time),
  );

const queryCalendarMatches = async ({ sportConfig, fromDate, toDate }) => {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("sport", sportConfig.dbSport)
    .gte("match_date", fromDate)
    .lte("match_date", toDate)
    .order("match_date", { ascending: true })
    .order("match_time", { ascending: true });

  if (error) {
    return { data: [], error };
  }

  return { data: data || [], error: null };
};

export const fetchCalendarSchedule = async ({
  sport = "baseball",
  fromDate,
  toDate,
  signal,
}) => {
  const sportConfigs = getSportConfigs(sport);

  if (sportConfigs.length === 0) {
    return {
      meta: null,
      matches: [],
      matchByDate: {},
    };
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  try {
    const results = await Promise.all(
      sportConfigs.map(async (sportConfig) => {
        const { data, error } = await queryCalendarMatches({
          sportConfig,
          fromDate,
          toDate,
        });

        if (error) {
          throw error;
        }

        return data.map((match) => normalizeCalendarMatch(match, sportConfig));
      }),
    );

    const sortedMatches = sortMatches(results.flat());

    return {
      meta: {
        seasonYear: fromDate ? Number(fromDate.slice(0, 4)) : null,
        categoryId: sport,
        upperCategoryId: sport,
        month: fromDate ? Number(fromDate.slice(5, 7)) : null,
        today: null,
        selectedDate: fromDate || null,
        source: "supabase",
      },
      matches: sortedMatches,
    };
  } catch (fetchError) {
    if (fetchError?.name === "AbortError") {
      throw fetchError;
    }

    throw fetchError;
  }
};
