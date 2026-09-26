const STORAGE_KEY = "american-tile-trails.sound";

/** Whether sound is on. It is until the player turns it off. */
export function readSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    /* Storage is optional in private browsing. */
    return true;
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* Storage is optional in private browsing. */
  }
}
