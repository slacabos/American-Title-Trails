import { useCallback, useEffect, useState } from "react";
import { readTimeOfDay, saveTimeOfDay, type TimeOfDay } from "@/rendering/timeOfDay";

const CHANGE_EVENT = "american-tile-trails:time";

/** Day or night for the whole app; every caller stays in sync. */
export function useTimeOfDay() {
  const [time, setTime] = useState<TimeOfDay>(readTimeOfDay);

  useEffect(() => {
    document.documentElement.dataset.time = time;
  }, [time]);

  useEffect(() => {
    const sync = (event: Event) => setTime((event as CustomEvent<TimeOfDay>).detail);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  const toggle = useCallback(() => {
    const next: TimeOfDay = time === "night" ? "day" : "night";
    saveTimeOfDay(next);
    setTime(next);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, [time]);

  return { time, night: time === "night", toggle };
}

export default useTimeOfDay;
