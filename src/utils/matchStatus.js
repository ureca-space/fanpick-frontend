const CLOSED_MATCH_STATUSES = new Set(["cancelled", "postponed"]);
const DEFAULT_MATCH_TIME = "23:59";

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

export const isFutureMatch = ({ matchDate, matchTime }, now = Date.now()) => {
  const matchDateTime = createMatchDateTime(matchDate, matchTime);

  return matchDateTime !== null && matchDateTime > now;
};

export const normalizeMatchTimingStatus = (
  { matchDate, matchTime, score, status },
  now = Date.now(),
) => {
  if (CLOSED_MATCH_STATUSES.has(status)) {
    return {
      score,
      status,
    };
  }

  if (isFutureMatch({ matchDate, matchTime }, now)) {
    return {
      score: null,
      status: "scheduled",
    };
  }

  return {
    score,
    status,
  };
};
