import { afterEach, describe, expect, it, vi } from "vitest";
import { readTimeOfDay, saveTimeOfDay } from "@/rendering/timeOfDay";

const prefersDark = (dark: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) => ({ matches: dark && query.includes("dark"), media: query }) as MediaQueryList,
  );

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("time of day", () => {
  it("follows the system preference until the player chooses", () => {
    if (!window.matchMedia) window.matchMedia = () => ({ matches: false }) as MediaQueryList;
    prefersDark(true);
    expect(readTimeOfDay()).toBe("night");
    prefersDark(false);
    expect(readTimeOfDay()).toBe("day");
  });

  it("remembers the player's choice over the system preference", () => {
    if (!window.matchMedia) window.matchMedia = () => ({ matches: false }) as MediaQueryList;
    prefersDark(false);
    saveTimeOfDay("night");
    expect(readTimeOfDay()).toBe("night");
  });
});
