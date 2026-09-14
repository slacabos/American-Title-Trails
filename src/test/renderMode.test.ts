import { afterEach, describe, expect, it, vi } from "vitest";
import { readRenderMode, saveRenderMode } from "@/rendering/renderMode";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
describe("renderer preference", () => {
  it("defaults to 3D and persists an explicit classic selection", () => {
    expect(readRenderMode()).toBe("3d");
    saveRenderMode("2d");
    expect(readRenderMode()).toBe("2d");
    saveRenderMode("3d");
    expect(readRenderMode()).toBe("3d");
  });
  it("tolerates unavailable browser storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readRenderMode()).toBe("3d");
    expect(() => saveRenderMode("2d")).not.toThrow();
  });
});
