import { supabase } from "../lib/supabase.js";
import { getTeamInfo } from "../constants/teamInfo.js";

const TEAM_RECORD_SELECT = `
  sport_id,
  league_id,
  league_name,
  season,
  record_key,
  team_id,
  team_code,
  team_name,
  team_short_name,
  rank,
  logo_url,
  stats,
  source,
  source_url,
  updated_at
`;

const PLAYER_RECORD_SELECT = `
  sport_id,
  league_id,
  league_name,
  season,
  record_key,
  player_id,
  player_name,
  player_full_name,
  team_id,
  team_code,
  team_name,
  team_short_name,
  position,
  rank,
  image_url,
  stats,
  source,
  source_url,
  updated_at
`;

const getLatestSeasonRows = (rows = []) => {
  const latestSeason = rows[0]?.season;

  return latestSeason
    ? rows.filter((row) => row.season === latestSeason)
    : [];
};

const getKLeagueTeamCode = (value) => {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  if (!normalizedValue) {
    return "";
  }

  if (/^K\d+$/.test(normalizedValue)) {
    return normalizedValue.replace(/^K(\d)$/, "K0$1");
  }

  if (/^\d+$/.test(normalizedValue)) {
    return `K${normalizedValue.padStart(2, "0")}`;
  }

  return "";
};

const getTeamCodeCandidates = (row) => {
  const candidates = [
    row.team_code,
    row.team_id,
    row.team_short_name,
    row.team_name,
  ].filter(Boolean);

  if (row.sport_id !== "soccer") {
    return candidates;
  }

  return [
    ...new Set(
      candidates.flatMap((candidate) => {
        const teamCode = getKLeagueTeamCode(candidate);

        return teamCode ? [teamCode, candidate] : [candidate];
      }),
    ),
  ];
};

const getTeamRecordLogoUrl = (row) => {
  const mappedLogoUrl = getTeamCodeCandidates(row)
    .map((teamCode) => getTeamInfo(teamCode, row.sport_id).logo)
    .find(Boolean);

  return mappedLogoUrl || row.logo_url;
};

const mapTeamRecord = (row) => ({
  ...(row.stats || {}),
  leagueId: row.league_id,
  leagueName: row.league_name,
  logoUrl: getTeamRecordLogoUrl(row),
  rank: row.rank,
  recordKey: row.record_key,
  season: row.season,
  source: row.source,
  sourceUrl: row.source_url,
  sportId: row.sport_id,
  teamCode: row.team_code,
  teamId: row.team_id,
  teamName: row.team_name,
  teamShortName: row.team_short_name,
  updatedAt: row.updated_at,
});

const mapPlayerRecord = (row) => ({
  ...(row.stats || {}),
  imageUrl: row.image_url,
  leagueId: row.league_id,
  leagueName: row.league_name,
  playerFullName: row.player_full_name,
  playerId: row.player_id,
  playerName: row.player_name,
  position: row.position,
  rank: row.rank,
  recordKey: row.record_key,
  season: row.season,
  source: row.source,
  sourceUrl: row.source_url,
  sportId: row.sport_id,
  teamCode: row.team_code,
  teamId: row.team_id,
  teamName: row.team_name,
  teamShortName: row.team_short_name,
  updatedAt: row.updated_at,
});

export const fetchTeamRecords = async ({ leagueId, sportId }) => {
  if (!leagueId || !sportId) {
    return [];
  }

  const { data, error } = await supabase
    .from("team_records")
    .select(TEAM_RECORD_SELECT)
    .eq("sport_id", sportId)
    .eq("league_id", leagueId)
    .order("season", { ascending: false })
    .order("rank", { ascending: true });

  if (error) {
    throw error;
  }

  return getLatestSeasonRows(data).map(mapTeamRecord);
};

export const fetchPlayerRecords = async ({ leagueId, sportId }) => {
  if (!leagueId || !sportId) {
    return [];
  }

  const { data, error } = await supabase
    .from("player_records")
    .select(PLAYER_RECORD_SELECT)
    .eq("sport_id", sportId)
    .eq("league_id", leagueId)
    .order("season", { ascending: false })
    .order("rank", { ascending: true });

  if (error) {
    throw error;
  }

  return getLatestSeasonRows(data).map(mapPlayerRecord);
};

export const subscribeTeamRecords = (onChange) => {
  const channel = supabase
    .channel("team-records-page")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "team_records",
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "player_records",
      },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
