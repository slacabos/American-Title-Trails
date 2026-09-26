import { afterEach, describe, expect, it, vi } from "vitest";
import { readExtraVfx, saveExtraVfx } from "@/rendering/extraVfx";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

function preferReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce && query.includes("reduce") }));
}

describe("extra effects", () => {
  it("start on and remember the player's choice", () => {
    expect(readExtraVfx()).toBe(true);
    saveExtraVfx(false);
    expect(readExtraVfx()).toBe(false);
    saveExtraVfx(true);
    expect(readExtraVfx()).toBe(true);
  });

  it("start off for players who prefer reduced motion, unless they turn them on", () => {
    preferReducedMotion(true);
    expect(readExtraVfx()).toBe(false);
    saveExtraVfx(true);
    expect(readExtraVfx()).toBe(true);
  });
});
