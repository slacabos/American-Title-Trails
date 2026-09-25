import { afterEach, describe, expect, it, vi } from "vitest";
import { readCameraView, saveCameraView } from "@/rendering/cameraView";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
describe("camera view preference", () => {
  it("defaults to the tabletop and persists an explicit drone selection", () => {
    expect(readCameraView()).toBe("tabletop");
    saveCameraView("drone");
    expect(readCameraView()).toBe("drone");
    saveCameraView("tabletop");
    expect(readCameraView()).toBe("tabletop");
  });
  it("moves players who preferred the old 2D map to the drone view", () => {
    localStorage.setItem("american-tile-trails.renderer", "2d");
    expect(readCameraView()).toBe("drone");
    localStorage.setItem("american-tile-trails.renderer", "3d");
    expect(readCameraView()).toBe("tabletop");
  });
  it("prefers a saved view over the old renderer choice", () => {
    localStorage.setItem("american-tile-trails.renderer", "2d");
    saveCameraView("tabletop");
    expect(readCameraView()).toBe("tabletop");
  });
  it("tolerates unavailable browser storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readCameraView()).toBe("tabletop");
    expect(() => saveCameraView("drone")).not.toThrow();
  });
});
