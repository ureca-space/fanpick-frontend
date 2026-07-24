const TEAM_META_KEYS = new Set([
  "imageUrl",
  "logoUrl",
  "rank",
  "ranking",
  "teamCode",
  "teamId",
  "teamImageUrl",
  "teamName",
  "teamShortName",
]);

const PLAYER_META_KEYS = new Set([
  "image",
  "imageUrl",
  "playerFullName",
  "playerId",
  "playerImageUrl",
  "playerName",
  "position",
  "rank",
  "ranking",
  "teamCode",
  "teamId",
  "teamName",
  "teamShortName",
]);

const getLatestSeason = (rows = []) =>
  rows.reduce((latestSeason, row) => {
    const season = Number(row?.season);

    return Number.isFinite(season) && season > latestSeason
      ? season
      : latestSeason;
  }, 0);

export const getKoreaYear = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());

  return Number(parts.find((part) => part.type === "year")?.value);
};

const createStats = (row, metaKeys) =>
  Object.fromEntries(
    Object.entries(row).filter(([key, value]) => {
      if (metaKeys.has(key)) {
        return false;
      }

      return value !== undefined;
    }),
  );

const createRecordKey = (...values) =>
  values
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map((value) => String(value).trim())
    .join(":");

export const uniqueBy = (rows = [], getKey) => {
  const seen = new Set();

  return rows.filter((row) => {
    const key = getKey(row);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const fetchLatestStandingsRows = async ({ leagueId, season, supabase }) => {
  if (!leagueId) {
    return [];
  }

  let query = supabase
    .from("team_standings")
    .select(
      `
        assists,
        deaths,
        draws,
        games,
        games_behind,
        kda,
        kills,
        league_id,
        league_name,
        losses,
        points,
        rank,
        recent,
        score_against,
        score_diff,
        score_for,
        season,
        source,
        source_url,
        streak,
        team_code,
        team_id,
        team_name,
        updated_at,
        win_rate,
        wins
      `,
    )
    .eq("league_id", leagueId)
    .order("season", { ascending: false })
    .order("rank", { ascending: true });

  if (season) {
    query = query.eq("season", season);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`최신 순위 조회 실패(${leagueId}): ${error.message}`);
  }

  const latestSeason = season || getLatestSeason(data);

  return latestSeason
    ? data.filter((row) => Number(row.season) === Number(latestSeason))
    : [];
};

export const normalizeTeamRecords = ({
  leagueId,
  leagueName,
  rows,
  season,
  source,
  sourceUrl = "",
  sportId,
}) =>
  rows.map((row, index) => {
    const rank = row.rank ?? row.ranking ?? index + 1;
    const teamId = String(row.teamId ?? row.teamCode ?? row.teamName ?? rank);

    return {
      league_id: leagueId,
      league_name: leagueName,
      logo_url: row.logoUrl || row.imageUrl || row.teamImageUrl || null,
      rank,
      record_key: createRecordKey(teamId),
      season,
      source,
      source_url: sourceUrl,
      sport_id: sportId,
      stats: createStats(row, TEAM_META_KEYS),
      team_code: row.teamCode || row.teamId || null,
      team_id: row.teamId || null,
      team_name: row.teamName || row.teamShortName || teamId,
      team_short_name: row.teamShortName || row.teamName || teamId,
    };
  });

export const normalizePlayerRecords = ({
  leagueId,
  leagueName,
  rows,
  season,
  source,
  sourceUrl = "",
  sportId,
}) =>
  rows.map((row, index) => {
    const rank = row.rank ?? row.ranking ?? index + 1;
    const playerId = String(row.playerId ?? row.playerName ?? rank);
    const teamId = String(row.teamId ?? row.teamName ?? "");

    return {
      image_url: row.imageUrl || row.playerImageUrl || row.image || null,
      league_id: leagueId,
      league_name: leagueName,
      player_full_name: row.playerFullName || null,
      player_id: row.playerId || null,
      player_name: row.playerName || row.playerFullName || playerId,
      position: row.position || null,
      rank,
      record_key: createRecordKey(teamId, playerId, rank),
      season,
      source,
      source_url: sourceUrl,
      sport_id: sportId,
      stats: createStats(row, PLAYER_META_KEYS),
      team_code: row.teamCode || row.teamId || null,
      team_id: row.teamId || null,
      team_name: row.teamName || row.teamShortName || null,
      team_short_name: row.teamShortName || row.teamName || null,
    };
  });

export const syncRecordRowsToSupabase = async ({
  leagueId,
  rows,
  season,
  supabase,
  table,
}) => {
  if (rows.length === 0) {
    return 0;
  }

  const sportIds = new Set(rows.map((row) => row.sport_id));

  for (const sportId of sportIds) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("sport_id", sportId)
      .eq("league_id", leagueId)
      .eq("season", season);

    if (error) {
      throw new Error(`기존 레코드 삭제 실패(${table}): ${error.message}`);
    }
  }

  const updatedAt = new Date().toISOString();
  const payload = rows.map((row) => ({
    ...row,
    updated_at: updatedAt,
  }));

  const { error } = await supabase.from(table).upsert(payload, {
    onConflict: "sport_id,league_id,season,record_key",
  });

  if (error) {
    throw new Error(`레코드 저장 실패(${table}): ${error.message}`);
  }

  return payload.length;
};
