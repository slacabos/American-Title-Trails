export type CameraView = "tabletop" | "drone";
export const CAMERA_VIEWS: CameraView[] = ["tabletop", "drone"];

const STORAGE_KEY = "american-tile-trails.view";
/** Before the drone view, players chose between 3D and a flat 2D map. */
const LEGACY_KEY = "american-tile-trails.renderer";

export function readCameraView(): CameraView {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "tabletop" || saved === "drone") return saved;
    // Players who preferred the flat 2D map get its closest successor.
    if (localStorage.getItem(LEGACY_KEY) === "2d") return "drone";
  } catch {
    /* Storage is optional in private browsing. */
  }
  return "tabletop";
}

export function saveCameraView(view: CameraView): void {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    /* Storage is optional in private browsing. */
  }
}
