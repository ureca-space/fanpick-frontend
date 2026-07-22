import { supabase } from "../lib/supabase.js";

export const fetchTeamStandings = async (leagueId) => {
  if (!leagueId) {
    return [];
  }

  const { data, error } = await supabase
    .from("team_standings")
    .select(
      `
        league_id,
        league_name,
        season,
        team_id,
        team_code,
        team_name,
        rank,
        games,
        wins,
        draws,
        losses,
        points,
        win_rate,
        kda,
        kills,
        deaths,
        assists,
        score_for,
        score_against,
        score_diff,
        games_behind,
        streak,
        recent,
        source,
        source_url,
        updated_at
      `,
    )
    .eq("league_id", leagueId)
    .order("season", { ascending: false })
    .order("rank", { ascending: true });

  if (error) {
    throw error;
  }

  const latestSeason = data?.[0]?.season;

  return latestSeason
    ? data.filter((standing) => standing.season === latestSeason)
    : [];
};
