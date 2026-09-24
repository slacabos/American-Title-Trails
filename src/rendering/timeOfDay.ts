export type TimeOfDay = "day" | "night";
const STORAGE_KEY = "american-tile-trails.time";

/** The saved choice, or the system's dark-mode preference on a first visit. */
export function readTimeOfDay(): TimeOfDay {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "day" || saved === "night") return saved;
  } catch {
    /* Storage is optional in private browsing. */
  }
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
  } catch {
    return "day";
  }
}

export function saveTimeOfDay(time: TimeOfDay): void {
  try {
    localStorage.setItem(STORAGE_KEY, time);
  } catch {
    /* Storage is optional in private browsing. */
  }
}

/** Tabletop colours that live outside the tile models. */
export const SCENE_PALETTE: Record<TimeOfDay, { background: string; table: string; grid: string }> = {
  day: { background: "#c8cfbb", table: "#c8cfbb", grid: "#75816b" },
  night: { background: "#1e2a25", table: "#3a4b41", grid: "#5a6b60" },
};
