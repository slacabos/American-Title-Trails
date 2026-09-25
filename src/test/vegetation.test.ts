import { describe, expect, it } from "vitest";
import { buildDeck } from "@/tileLibrary";
import { plantInstances, vegetationSpots } from "@/rendering/vegetation";

const road = buildDeck().find((tile) => tile.id === "straight-road")!;
const board = Array.from({ length: 13 * 13 }, (_, i) => ({
  tile: road,
  position: { x: (i % 13) - 6, y: Math.floor(i / 13) - 6 },
}));

describe("regional vegetation", () => {
  it("places every plant spot on the board exactly once", () => {
    const perTile = vegetationSpots(road).length;
    const total = plantInstances(board, 42).reduce((sum, group) => sum + group.matrices.length, 0);
    expect(total).toBe(perTile * board.length);
  });

  it("grows region-specific species across a large board", () => {
    const species = new Set(plantInstances(board, 42).map((group) => group.species));
    expect(species.size).toBeGreaterThanOrEqual(4);
  });

  it("keeps the opening tiles in meadow plants", () => {
    const home = board.filter(({ position }) => Math.abs(position.x) + Math.abs(position.y) <= 1);
    const species = new Set(plantInstances(home, 42).map((group) => group.species));
    expect([...species].every((kind) => kind === "round" || kind === "bush")).toBe(true);
  });
});

describe("plant owners", () => {
  it("records which tile each plant grows on", () => {
    const groups = plantInstances(board.slice(0, 3), 42);
    const owners = groups.flatMap((group) => group.owners);
    expect(new Set(owners)).toEqual(new Set(board.slice(0, 3).map(({ position }) => `${position.x},${position.y}`)));
    for (const group of groups) expect(group.owners).toHaveLength(group.matrices.length);
  });
});
