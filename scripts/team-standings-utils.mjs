import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const getJwtPayload = (token) => {
  const [, payload] = String(token).split(".");

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

export const createSupabaseAdminClient = () => {
  const { SUPABASE_URL, SUPABASE_SERVER_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVER_KEY) {
    throw new Error(
      ".env.sync의 SUPABASE_URL과 SUPABASE_SERVER_KEY를 확인해 주세요.",
    );
  }

  const keyRole = getJwtPayload(SUPABASE_SERVER_KEY)?.role;

  if (keyRole && keyRole !== "service_role") {
    throw new Error(
      ".env.sync의 SUPABASE_SERVER_KEY에는 anon key가 아니라 service_role key를 넣어야 합니다.",
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVER_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
};

const sleep = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const decodeHtmlEntity = (entity) => {
  const namedEntities = {
    amp: "&",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  const namedEntity = namedEntities[entity.toLowerCase()];

  if (namedEntity) {
    return namedEntity;
  }

  if (entity.startsWith("#x")) {
    return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
  }

  if (entity.startsWith("#")) {
    return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
  }

  return `&${entity};`;
};

export const cleanText = (value) =>
  String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<img\b[^>]*\balt=(["'])(.*?)\1[^>]*>/gi, " $2 ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&([^;]+);/g, (_, entity) => decodeHtmlEntity(entity))
    .replace(/\s+/g, " ")
    .trim();

export const normalizeKey = (value) =>
  cleanText(value)
    .replace(/\s+/g, "")
    .toLowerCase();

export const toNumber = (value, fallback = 0) => {
  const normalizedValue = cleanText(value).replace(/,/g, "");

  if (!normalizedValue || /^[-–]$/.test(normalizedValue)) {
    return fallback;
  }

  const number = Number(normalizedValue);

  return Number.isFinite(number) ? number : fallback;
};

export const toNullableNumber = (value) => {
  const normalizedValue = cleanText(value).replace(/,/g, "");

  if (!normalizedValue || /^[-–]$/.test(normalizedValue)) {
    return null;
  }

  const number = Number(normalizedValue);

  return Number.isFinite(number) ? number : null;
};

export const fetchTextWithRetry = async (url, options = {}, retryCount = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return response.text();
    } catch (error) {
      lastError = error;

      if (attempt < retryCount) {
        console.warn(`순위 요청 ${attempt}회 실패, 재시도합니다.`);
        await sleep(attempt * 1_000);
      }
    }
  }

  throw lastError;
};

export const extractHtmlTables = (html) => {
  const tableMatches = [...String(html).matchAll(/<table\b[\s\S]*?<\/table>/gi)];

  return tableMatches.map(([tableHtml]) => {
    const rowMatches = [...tableHtml.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)];

    return rowMatches
      .map(([rowHtml]) => {
        const cellMatches = [
          ...rowHtml.matchAll(/<(?:th|td)\b[\s\S]*?<\/(?:th|td)>/gi),
        ];

        return cellMatches.map(([cellHtml]) => cleanText(cellHtml));
      })
      .filter((cells) => cells.some(Boolean));
  });
};

export const saveStandingsToJson = async (fileName, standings) => {
  const dataDirectory = path.resolve("public", "data");
  const outputPath = path.join(dataDirectory, fileName);

  await mkdir(dataDirectory, {
    recursive: true,
  });

  await writeFile(outputPath, JSON.stringify(standings, null, 2), "utf8");

  return outputPath;
};

export const syncStandingsToSupabase = async (supabase, standings) => {
  if (standings.length === 0) {
    return 0;
  }

  const leagueSeasonKeys = new Set(
    standings.map((standing) => `${standing.leagueId}:${standing.season}`),
  );

  for (const leagueSeasonKey of leagueSeasonKeys) {
    const [leagueId, season] = leagueSeasonKey.split(":");
    const { error } = await supabase
      .from("team_standings")
      .delete()
      .eq("league_id", leagueId)
      .eq("season", Number(season));

    if (error) {
      throw new Error(`기존 순위 삭제 실패: ${error.message}`);
    }
  }

  const updatedAt = new Date().toISOString();
  const rows = standings.map((standing) => ({
    assists: standing.assists ?? null,
    deaths: standing.deaths ?? null,
    draws: standing.draws,
    games: standing.games,
    games_behind: standing.gamesBehind || null,
    kda: standing.kda ?? null,
    kills: standing.kills ?? null,
    league_id: standing.leagueId,
    league_name: standing.leagueName,
    losses: standing.losses,
    points: standing.points,
    rank: standing.rank,
    recent: standing.recent || null,
    score_against: standing.scoreAgainst,
    score_diff: standing.scoreDiff,
    score_for: standing.scoreFor,
    season: standing.season,
    source: standing.source,
    source_url: standing.sourceUrl,
    streak: standing.streak || null,
    team_code: standing.teamCode,
    team_id: standing.teamId,
    team_name: standing.teamName,
    updated_at: updatedAt,
    win_rate: standing.winRate,
    wins: standing.wins,
  }));

  const { error } = await supabase.from("team_standings").upsert(rows, {
    onConflict: "league_id,season,team_code",
  });

  if (error) {
    throw new Error(`Supabase 순위 저장 실패: ${error.message}`);
  }

  return rows.length;
};
