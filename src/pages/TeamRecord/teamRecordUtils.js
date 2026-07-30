import { getTeamInfo } from "../../constants/teamInfo";

export const formatPercent = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "-";
};

export const formatDecimal = (value, digits = 2) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toFixed(digits).replace(/\.?0+$/, "")
    : "-";
};

export const normalizeText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "");

export const matchesQuery = (query, fields = []) => {
  if (!query) {
    return true;
  }

  const normalizedQuery = normalizeText(query);

  return fields.some((field) => normalizeText(field).includes(normalizedQuery));
};

export const FALLBACK_IMAGE_URL = "/fanpick_logo.svg";
export const EMPTY_IMAGE_SOURCES = [];

const KLEAGUE_PLAYER_IMAGE_BASE_URL =
  "https://d2tfp74nsbbrkr.cloudfront.net/v1/player";

const BROKEN_IMAGE_URLS = new Set([
  "https://sports-phinf.pstatic.net/player/kfootball/default/20190178.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20230255.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20210155.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20250166.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20260332.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20260282.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20260284.png",
  "hhttps://ssl.pstatic.net/sstatic/people/profileImg/t/7e68a7dd-43e8-4cca-9540-dda3e777f7d2.png",
]);

export const isValidImageUrl = (url) =>
  typeof url === "string" &&
  (/^https?:\/\//.test(url) || url.startsWith("/")) &&
  !BROKEN_IMAGE_URLS.has(url);

export const getImageUrl = (...urls) =>
  urls.find(isValidImageUrl) || FALLBACK_IMAGE_URL;

const getSoccerTeamCode = (value) => {
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

const getSoccerTeamInfo = (row) => {
  const candidates = [
    row.teamCode,
    row.teamId,
    row.teamShortName,
    row.teamName,
  ].filter(Boolean);

  return (
    candidates
      .flatMap((candidate) => {
        const teamCode = getSoccerTeamCode(candidate);

        return teamCode ? [teamCode, candidate] : [candidate];
      })
      .map((candidate) => getTeamInfo(candidate, "soccer"))
      .find((teamInfo) => teamInfo.logo) ?? {}
  );
};

export const getSoccerTeamLogoUrl = (row) => {
  const teamInfo = getSoccerTeamInfo(row);

  return getImageUrl(teamInfo.logo, row.logoUrl, row.teamImageUrl, row.imageUrl);
};

export const getSoccerPlayerOfficialImageUrl = (row) => {
  const teamCode = getSoccerTeamCode(row.teamCode ?? row.teamId);
  const playerId = String(row.playerId ?? "").trim();
  const season = String(row.season ?? "2026").trim() || "2026";

  if (!teamCode || !playerId) {
    return "";
  }

  return `${KLEAGUE_PLAYER_IMAGE_BASE_URL}/${season}/${teamCode}/player_${playerId}.png`;
};

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

export const getRankValue = (row) => row.rank ?? row.ranking ?? "-";

export const getRecordRowKey = (row, activeSport, activeView) => {
  const rank = row.rank ?? row.ranking ?? "";

  if (activeView === "player") {
    return [
      activeSport,
      row.teamId,
      row.playerId,
      row.playerName,
      row.playerFullName,
      rank,
    ]
      .filter(Boolean)
      .join(":");
  }

  return [activeSport, row.teamId, row.id, row.teamName, rank]
    .filter(Boolean)
    .join(":");
};

export const getSearchFields = (row, sport, view) => {
  if (view === "team") {
    return [row.teamName, row.teamShortName, row.teamId];
  }

  if (sport === "esports") {
    return [
      row.playerName,
      row.playerFullName,
      row.teamName,
      row.teamShortName,
      row.position,
    ];
  }

  if (sport === "baseball") {
    return [
      row.playerName,
      row.teamName,
      row.teamShortName,
      row.position,
      row.kind,
    ];
  }

  return [
    row.playerName,
    row.playerFullName,
    row.teamName,
    row.teamShortName,
    row.position,
    row.teamId,
  ];
};
