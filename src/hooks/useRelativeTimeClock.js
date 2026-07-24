import { useEffect, useState } from "react";

const DEFAULT_TICK_MS = 15000;

const useRelativeTimeClock = (tickMs = DEFAULT_TICK_MS) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, tickMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [tickMs]);

  return currentTime;
};

export default useRelativeTimeClock;
