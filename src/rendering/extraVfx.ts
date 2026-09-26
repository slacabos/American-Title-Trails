import { prefersReducedMotion } from "./landingTiming";

const STORAGE_KEY = "american-tile-trails.extra-vfx";

/**
 * Optional effects (animated water) start on, except for players who prefer
 * reduced motion. A choice made in the settings always wins.
 */
export function readExtraVfx(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved === "on";
  } catch {
    /* Storage is optional in private browsing. */
  }
  return !prefersReducedMotion();
}

export function saveExtraVfx(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* Storage is optional in private browsing. */
  }
}
