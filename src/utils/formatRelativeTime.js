export const formatRelativeTime = (date, currentTime = Date.now()) => {
  const value = new Date(date);
  const elapsedTime = Math.max(0, currentTime - value.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (elapsedTime < minute) return "방금 전";
  if (elapsedTime < hour) return `${Math.floor(elapsedTime / minute)}분 전`;
  if (elapsedTime < day) return `${Math.floor(elapsedTime / hour)}시간 전`;

  const month = String(value.getMonth() + 1).padStart(2, "0");
  const dateDay = String(value.getDate()).padStart(2, "0");
  return `${month}.${dateDay}`;
};
