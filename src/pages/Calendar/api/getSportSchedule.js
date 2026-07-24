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
  homeTeam: {
    ...getTeamInfo(match.home_team_code || "", sportConfig.dbSport),
    code: match.home_team_code || "",
    name: match.home_team_name || getTeamInfo(match.home_team_code || "", sportConfig.dbSport).name,
    shortName:
      match.home_team_short_name ||
      getTeamInfo(match.home_team_code || "", sportConfig.dbSport).shortName,
    logo: match.home_team_logo || getTeamInfo(match.home_team_code || "", sportConfig.dbSport).logo,
  },
  awayTeam: {
    ...getTeamInfo(match.away_team_code || "", sportConfig.dbSport),
    code: match.away_team_code || "",
    name: match.away_team_name || getTeamInfo(match.away_team_code || "", sportConfig.dbSport).name,
    shortName:
      match.away_team_short_name ||
      getTeamInfo(match.away_team_code || "", sportConfig.dbSport).shortName,
    logo: match.away_team_logo || getTeamInfo(match.away_team_code || "", sportConfig.dbSport).logo,
  },
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

export const fetchKBOSchedule = async ({
  sport = "baseball",
  fromDate,
  toDate,
  signal,
}) => {
  const sportConfig = SPORT_CONFIGS[sport];

  if (!sportConfig) {
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
    const { data, error } = await queryCalendarMatches({
      sportConfig,
      fromDate,
      toDate,
    });

    if (error) {
      throw error;
    }

    const matches = data.map((match) =>
      normalizeCalendarMatch(match, sportConfig),
    );
    const sortedMatches = sortMatches(matches);

    return {
      meta: {
        seasonYear: fromDate ? Number(fromDate.slice(0, 4)) : null,
        categoryId: sportConfig.appSport,
        upperCategoryId: sportConfig.appSport,
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
