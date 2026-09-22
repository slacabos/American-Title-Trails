import { buildRiverDeck, getRiverLake, getRiverSource } from "@/riverLibrary";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SceneryLibrary } from "@/rendering/scenery";
import { buildDeck, getStartTile } from "@/tileLibrary";

const tiles = [
  ...new Map(
    [getStartTile(), ...buildDeck(), getRiverSource(), ...buildRiverDeck(), getRiverLake()].map((tile) => [tile.id, tile]),
  ).values(),
];
beforeEach(() => {
  const ctx = document.createElement("canvas").getContext("2d")!;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    Object.assign(ctx, { setLineDash: () => {} }),
  );
});
afterEach(() => vi.restoreAllMocks());

describe("procedural scenery resources", () => {
  it.each(tiles.map((tile) => [tile.id, tile] as const))(
    "builds finite geometry within the %s tile footprint",
    (_, tile) => {
      const library = new SceneryLibrary();
      const model = library.getGhost(tile);
      expect(model.parts.length).toBeGreaterThan(1);
      for (const part of model.parts) {
        const vertices = part.geometry.getAttribute("position");
        expect([...vertices.array].every(Number.isFinite)).toBe(true);
        part.geometry.computeBoundingBox();
        const bounds = part.geometry.boundingBox!;
        expect(bounds.min.x).toBeGreaterThanOrEqual(-0.501);
        expect(bounds.max.x).toBeLessThanOrEqual(0.501);
        expect(bounds.min.z).toBeGreaterThanOrEqual(-0.501);
        expect(bounds.max.z).toBeLessThanOrEqual(0.501);
        expect(bounds.max.y).toBeLessThan(0.4);
      }
      library.dispose();
    },
  );

  it("reuses canonical geometry across rotations and releases GPU resources", () => {
    const library = new SceneryLibrary();
    const tile = getStartTile();
    const model = library.get(tile);
    for (let turn = 1; turn < 4; turn++)
      expect(library.get(tile.rotate(turn))).toBe(model);
    const disposed = vi.fn();
    model.parts.forEach((part) =>
      part.geometry.addEventListener("dispose", disposed),
    );
    library.dispose();
    expect(disposed).toHaveBeenCalledTimes(model.parts.length);
  });
});
