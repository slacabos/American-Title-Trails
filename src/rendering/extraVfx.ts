const STORAGE_KEY = "american-tile-trails.extra-vfx";

/** Optional effects (animated water) cost GPU time every frame, so they start off. */
export function readExtraVfx(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function saveExtraVfx(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* Storage is optional in private browsing. */
  }
}
