export type RenderMode = "3d" | "2d";
const STORAGE_KEY = "american-tile-trails.renderer";

export function readRenderMode(): RenderMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "2d" ? "2d" : "3d";
  } catch {
    return "3d";
  }
}
export function saveRenderMode(mode: RenderMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* Storage is optional in private browsing. */
  }
}
