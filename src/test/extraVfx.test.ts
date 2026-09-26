import { afterEach, describe, expect, it } from "vitest";
import { readExtraVfx, saveExtraVfx } from "@/rendering/extraVfx";

afterEach(() => localStorage.clear());

describe("extra effects", () => {
  it("start off and remember the player's choice", () => {
    expect(readExtraVfx()).toBe(false);
    saveExtraVfx(true);
    expect(readExtraVfx()).toBe(true);
    saveExtraVfx(false);
    expect(readExtraVfx()).toBe(false);
  });
});
