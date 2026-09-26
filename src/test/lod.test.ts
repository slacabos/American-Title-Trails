import * as THREE from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isFine, Lod, LodTracker } from "@/rendering/lod";
import { buildSpecies, type Species } from "@/rendering/vegetation";
import { SceneryLibrary } from "@/rendering/scenery";
import { buildDeck } from "@/tileLibrary";

describe("zoom tiers", () => {
  it("drops detail as the camera zooms out and restores it zooming in", () => {
    const lod = new LodTracker();
    expect(lod.update(120)).toBe(Lod.Full);
    expect(lod.update(40)).toBe(Lod.Medium);
    expect(lod.update(10)).toBe(Lod.Far);
    expect(lod.update(120)).toBe(Lod.Full);
  });

  it("holds its tier while a pinch hovers around a threshold", () => {
    const lod = new LodTracker();
    lod.update(40);
    for (const zoom of [63, 66, 62, 68, 64]) expect(lod.update(zoom)).toBe(Lod.Medium);
    expect(lod.update(72)).toBe(Lod.Full);
    for (const zoom of [62, 58, 63]) expect(lod.update(zoom)).toBe(Lod.Full);
  });

  it("treats posts and rails as fine, but not walls or signs", () => {
    expect(isFine(new THREE.BoxGeometry(0.008, 0.14, 0.008))).toBe(true);
    expect(isFine(new THREE.BoxGeometry(0.2, 0.019, 0.105))).toBe(false);
    expect(isFine(new THREE.BoxGeometry(0.19, 0.075, 0.01))).toBe(false);
  });

  it.each(["round", "pine", "hay", "cactus"] as Species[])("coarse %s plants use fewer triangles", (species) => {
    const vertices = (coarse: boolean) => buildSpecies(species, coarse).getAttribute("position").count;
    expect(vertices(true)).toBeLessThan(vertices(false) * 0.7);
  });
});

describe("fine scenery parts", () => {
  beforeEach(() => {
    const ctx = document.createElement("canvas").getContext("2d")!;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(Object.assign(ctx, { setLineDash: () => {} }));
  });
  afterEach(() => vi.restoreAllMocks());

  it("splits thin props from the solid ones they sit on", () => {
    const library = new SceneryLibrary();
    const mcdonalds = buildDeck().find((tile) => tile.id === "mcdonalds-abbey")!;
    const parts = library.get(mcdonalds).parts;
    expect(parts.filter((part) => part.fine).length).toBeGreaterThan(0);
    expect(parts.filter((part) => !part.fine).length).toBeGreaterThan(1);
    library.dispose();
  });
});
