const PREDICTION_CHANGE_LOCK_MINUTES = 30;

export const createMatchBeginAt = (dateKey, timeText) => {
  if (!dateKey) {
    return "";
  }

  const time = timeText?.slice(0, 5) || "00:00";

  return `${dateKey}T${time}:00+09:00`;
};

const getPredictionChangeLockTime = (beginAt) => {
  const beginTime = new Date(beginAt).getTime();

  if (!Number.isFinite(beginTime)) {
    return Number.NEGATIVE_INFINITY;
  }

  return beginTime - PREDICTION_CHANGE_LOCK_MINUTES * 60 * 1000;
};

export const canChangePredictionByBeginAt = (beginAt, now = Date.now()) =>
  now < getPredictionChangeLockTime(beginAt);
