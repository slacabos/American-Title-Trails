import { describe, expect, it } from "vitest";
import { cornerWeights, dominantRegion, REGIONS, regionWeights, sampleRegion } from "@/rendering/regions";

describe("regional landscapes", () => {
  it("weights are deterministic, non-negative and sum to 1", () => {
    for (let x = -8; x <= 8; x += 0.7) {
      for (let z = -8; z <= 8; z += 0.9) {
        const weights = regionWeights(x, z, 42);
        expect(regionWeights(x, z, 42)).toEqual(weights);
        const total = REGIONS.reduce((sum, region) => sum + weights[region], 0);
        expect(total).toBeCloseTo(1, 10);
        for (const region of REGIONS) expect(weights[region]).toBeGreaterThanOrEqual(-1e-12);
      }
    }
  });

  it("keeps the river opening in meadow", () => {
    for (const seed of [1, 17, 42, 99])
      for (const [x, z] of [
        [0, 0],
        [1, 1],
        [-1.5, 0.5],
        [0, 2],
      ])
        expect(regionWeights(x, z, seed).meadow).toBe(1);
  });

  it("gives neighbouring tiles identical weights where they meet", () => {
    for (let orientation = 0; orientation < 4; orientation++) {
      const [nw, ne, sw, se] = cornerWeights({ x: 4, y: -3 }, 0, 7);
      const east = cornerWeights({ x: 5, y: -3 }, 0, 7);
      const south = cornerWeights({ x: 4, y: -2 }, 0, 7);
      expect(east[0]).toEqual(ne);
      expect(east[2]).toEqual(se);
      expect(south[0]).toEqual(sw);
      expect(south[1]).toEqual(se);
      // Rotating a tile only reorders which corner lands where.
      const turned = cornerWeights({ x: 4, y: -3 }, orientation, 7);
      expect(new Set(turned.map((w) => JSON.stringify(w)))).toEqual(
        new Set([nw, ne, sw, se].map((w) => JSON.stringify(w))),
      );
    }
  });

  it("a typical board shows several landscapes, varying by seed", () => {
    const maps = [1, 17, 42].map((seed) => {
      const seen = new Set<string>();
      let map = "";
      for (let x = -6; x <= 6; x++)
        for (let z = -6; z <= 6; z++) {
          const region = dominantRegion(regionWeights(x, z, seed));
          seen.add(region);
          map += region[0];
        }
      expect(seen.size).toBeGreaterThanOrEqual(3);
      return map;
    });
    expect(new Set(maps).size).toBe(3);
  });

  it("samples regions in proportion to weight", () => {
    const weights = { meadow: 0.25, farmland: 0.25, forest: 0.25, desert: 0.25 };
    expect([0.1, 0.3, 0.6, 0.9].map((roll) => sampleRegion(weights, roll))).toEqual(REGIONS);
  });
});
