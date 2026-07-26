import { supabase } from "../lib/supabase.js";

const normalizeLeagueName = (leagueName) => {
  return String(leagueName ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "");
};

const getLeagueMatchScore = (recordLeague, matchLeague) => {
  const normalizedRecordLeague = normalizeLeagueName(recordLeague);
  const normalizedMatchLeague = normalizeLeagueName(matchLeague);

  if (!normalizedRecordLeague || !normalizedMatchLeague) {
    return 0;
  }

  if (normalizedRecordLeague === normalizedMatchLeague) {
    return 3;
  }

  if (
    normalizedRecordLeague.includes(normalizedMatchLeague) ||
    normalizedMatchLeague.includes(normalizedRecordLeague)
  ) {
    return 2;
  }

  return 0;
};

const findBestTeamRecord = (records, match, teamCode) => {
  const candidates = records.filter((record) => {
    if (record.team_code !== teamCode) {
      return false;
    }

    if (record.sport_id && record.sport_id !== match.sport) {
      return false;
    }

    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((firstRecord, secondRecord) => {
    const firstLeagueScore = getLeagueMatchScore(
      firstRecord.league_name,
      match.league,
    );

    const secondLeagueScore = getLeagueMatchScore(
      secondRecord.league_name,
      match.league,
    );

    if (firstLeagueScore !== secondLeagueScore) {
      return secondLeagueScore - firstLeagueScore;
    }

    const firstSeason = firstRecord.season ?? 0;
    const secondSeason = secondRecord.season ?? 0;

    if (firstSeason !== secondSeason) {
      return secondSeason - firstSeason;
    }

    const firstUpdatedAt = new Date(firstRecord.updated_at ?? 0).getTime();

    const secondUpdatedAt = new Date(secondRecord.updated_at ?? 0).getTime();

    return secondUpdatedAt - firstUpdatedAt;
  })[0];
};

export const fetchMatchAiReports = async () => {
  const { data, error } = await supabase
    .from("match_ai_reports")
    .select(
      `
      id,
      match_id,
      title,
      summary,
      key_points,
      model,
      created_at,
      matches!inner (
        sport,
        league,
        match_date,
        match_time,
        away_team_code,
        home_team_code,
        score,
        status,
        venue
      )
    `,
    )
    .eq("matches.status", "finished")
    .order("created_at", {
      ascending: false,
    })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const reports = data ?? [];

  const teamCodes = [
    ...new Set(
      reports.flatMap(({ matches }) => [
        matches?.away_team_code,
        matches?.home_team_code,
      ]),
    ),
  ].filter(Boolean);

  let teamRecords = [];

  if (teamCodes.length > 0) {
    const { data: teamRecordData, error: teamRecordError } = await supabase
      .from("team_records")
      .select(
        `
          team_code,
          team_name,
          team_short_name,
          sport_id,
          league_name,
          season,
          updated_at
        `,
      )
      .in("team_code", teamCodes)
      .order("season", {
        ascending: false,
      })
      .order("updated_at", {
        ascending: false,
      });

    if (teamRecordError) {
      throw new Error(teamRecordError.message);
    }

    teamRecords = teamRecordData ?? [];
  }

  return reports.map(({ matches, ...report }) => {
    if (!matches) {
      return {
        ...report,
        match: null,
      };
    }

    const awayTeamRecord = findBestTeamRecord(
      teamRecords,
      matches,
      matches.away_team_code,
    );

    const homeTeamRecord = findBestTeamRecord(
      teamRecords,
      matches,
      matches.home_team_code,
    );

    return {
      ...report,

      match: {
        ...matches,

        away_team_name: awayTeamRecord?.team_name ?? matches.away_team_code,

        away_team_short_name:
          awayTeamRecord?.team_short_name ??
          awayTeamRecord?.team_name ??
          matches.away_team_code,

        home_team_name: homeTeamRecord?.team_name ?? matches.home_team_code,

        home_team_short_name:
          homeTeamRecord?.team_short_name ??
          homeTeamRecord?.team_name ??
          matches.home_team_code,
      },
    };
  });
};
