export const CLOSED_MATCH_STATUSES = new Set(["cancelled", "postponed"]);
export const FINISHED_MATCH_STATUSES = new Set([
  "complete",
  "completed",
  "ended",
  "final",
  "finished",
]);
export const LIVE_MATCH_STATUSES = new Set([
  "live",
  "ongoing",
  "in_progress",
  "playing",
  "running",
]);
export const RESULT_PENDING_MATCH_STATUS = "result_pending";
const LIVE_WINDOW_HOURS_BY_SPORT = {
  baseball: 6,
  esports: 4,
  soccer: 3,
};
const FINISHED_PROTECTION_MINUTES_BY_SPORT = {
  baseball: 180,
  esports: 90,
  soccer: 110,
};
const DEFAULT_LIVE_WINDOW_HOURS = 4;
const DEFAULT_FINISHED_PROTECTION_MINUTES = 120;
const DEFAULT_MATCH_TIME = "23:59";

const normalizeStatus = (status) => String(status ?? "").trim().toLowerCase();
const normalizeSport = (sport) => String(sport ?? "").trim().toLowerCase();

export const isClosedMatchStatus = (status) =>
  CLOSED_MATCH_STATUSES.has(normalizeStatus(status));

export const isFinishedMatchStatus = (status) =>
  FINISHED_MATCH_STATUSES.has(normalizeStatus(status));

export const isLiveMatchStatus = (status) =>
  LIVE_MATCH_STATUSES.has(normalizeStatus(status));

export const isResultPendingMatchStatus = (status) =>
  normalizeStatus(status) === RESULT_PENDING_MATCH_STATUS;

const padNumber = (number) => String(number).padStart(2, "0");

const normalizeMatchTime = (timeValue) => {
  const [hourText, minuteText] = String(timeValue ?? DEFAULT_MATCH_TIME)
    .slice(0, 5)
    .split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return DEFAULT_MATCH_TIME;
  }

  return `${padNumber(hour)}:${padNumber(minute)}`;
};

export const createMatchDateTime = (dateKey, timeValue) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey ?? ""))) {
    return null;
  }

  const matchTime = normalizeMatchTime(timeValue);
  const timestamp = Date.parse(`${dateKey}T${matchTime}:00+09:00`);

  return Number.isFinite(timestamp) ? timestamp : null;
};

const getLiveWindowMs = (sport) => {
  const normalizedSport = normalizeSport(sport);
  const hours =
    LIVE_WINDOW_HOURS_BY_SPORT[normalizedSport] ?? DEFAULT_LIVE_WINDOW_HOURS;

  return hours * 60 * 60 * 1000;
};

const getFinishedProtectionMs = (sport) => {
  const normalizedSport = normalizeSport(sport);
  const minutes =
    FINISHED_PROTECTION_MINUTES_BY_SPORT[normalizedSport] ??
    DEFAULT_FINISHED_PROTECTION_MINUTES;

  return minutes * 60 * 1000;
};

export const parseMatchScore = (score) => {
  if (score === null || score === undefined || String(score).trim() === "") {
    return {
      awayScore: null,
      homeScore: null,
    };
  }

  const [awayScore, homeScore] = String(score).split(":").map(Number);

  return {
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
  };
};

const isLikelyUnsettledFinishedScore = ({ score, sport }) => {
  const { awayScore, homeScore } = parseMatchScore(score);

  if (awayScore === null || homeScore === null) {
    return true;
  }

  return (
    normalizeSport(sport) === "baseball" && awayScore === 0 && homeScore === 0
  );
};

export const isFutureMatch = ({ matchDate, matchTime }, now = Date.now()) => {
  const matchDateTime = createMatchDateTime(matchDate, matchTime);

  return matchDateTime !== null && matchDateTime > now;
};

export const normalizeMatchTimingStatus = (
  { matchDate, matchTime, score, sport, status },
  now = Date.now(),
) => {
  const normalizedStatus = normalizeStatus(status);

  if (isClosedMatchStatus(status)) {
    return {
      score,
      status: normalizedStatus,
    };
  }

  const matchDateTime = createMatchDateTime(matchDate, matchTime);

  if (matchDateTime !== null && matchDateTime > now) {
    return {
      score: null,
      status: "scheduled",
    };
  }

  const isInsideLiveWindow =
    matchDateTime !== null && now < matchDateTime + getLiveWindowMs(sport);
  const isInsideFinishedProtectionWindow =
    matchDateTime !== null &&
    now >= matchDateTime &&
    now < matchDateTime + getFinishedProtectionMs(sport);

  if (isFinishedMatchStatus(status)) {
    const shouldKeepFinishedMatchLive =
      isInsideFinishedProtectionWindow ||
      (isInsideLiveWindow &&
        isLikelyUnsettledFinishedScore({
          score,
          sport,
        }));

    return {
      score: shouldKeepFinishedMatchLive ? null : score,
      status: shouldKeepFinishedMatchLive
        ? RESULT_PENDING_MATCH_STATUS
        : "finished",
    };
  }

  const shouldInferLiveStatus =
    isInsideLiveWindow &&
    (isLiveMatchStatus(status) ||
      !normalizedStatus ||
      normalizedStatus === "pending" ||
      normalizedStatus === "scheduled");

  if (shouldInferLiveStatus) {
    return {
      score,
      status: "live",
    };
  }

  if (isLiveMatchStatus(status)) {
    return {
      score,
      status: "live",
    };
  }

  return {
    score,
    status: normalizedStatus || status,
  };
};
