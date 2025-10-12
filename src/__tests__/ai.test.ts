import { afterEach, describe, expect, it, vi } from "vitest";
import { SimpleAI } from "../ai";
import { Player } from "../player";
import { Tile } from "../tile";
import { TileDefinition } from "../types";

const createTile = (definition: Partial<TileDefinition>): Tile =>
  new Tile({
    id: definition.id ?? "tile",
    name: definition.name ?? "Tile",
    edges: definition.edges ?? {
      north: "field",
      east: "field",
      south: "field",
      west: "field",
    },
    center: definition.center ?? "field",
    roadConnections: definition.roadConnections ?? [],
    costcoZones: definition.costcoZones ?? [],
    isStart: definition.isStart ?? false,
  });

describe("SimpleAI planning", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("selects the move with the highest completion score", () => {
    const ai = new SimpleAI({ completionWeight: 5, adjacencyWeight: 0, costcoWeight: 0 });
    const player = new Player("AI", { isAI: true });

    const tile = createTile({ id: "costco", center: "costco" });

    vi.spyOn(Math, "random").mockReturnValue(0);

    const candidates = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];

    const board = {
      getPlacementCandidates: vi.fn(() => candidates),
      getNeighbors: vi.fn(() => ({})),
      canPlace: vi.fn(() => true),
      previewPlacement: vi.fn((_tile: Tile, position: { x: number; y: number }) =>
        position.x === 0
          ? { completed: [{ points: 3 }] }
          : { completed: [{ points: 0 }] }
      ),
    };

    const game = {
      board,
      calculatePoints: (feature: { points: number }) => feature.points,
    };

    const move = ai.planMove(game as any, player, tile);

    expect(move).not.toBeNull();
    expect(move?.position).toEqual({ x: 0, y: 0 });
    expect(move?.rotation).toBe(0);
  });

  it("returns follower placement for McDonalds when available", () => {
    const ai = new SimpleAI({ completionWeight: 0, adjacencyWeight: 0, costcoWeight: 0 });
    const player = new Player("AI", { followers: 2 });

    const tile = createTile({ id: "mcd", center: "mcdonalds" });

    const board = {
      getPlacementCandidates: vi.fn(() => [{ x: 0, y: 0 }]),
      getNeighbors: vi.fn(() => ({})),
      canPlace: vi.fn(() => true),
      previewPlacement: vi.fn(() => ({ completed: [] })),
    };

    const game = {
      board,
      calculatePoints: () => 0,
    };

    const move = ai.planMove(game as any, player, tile);
    expect(move).not.toBeNull();
    expect(move?.follower).toEqual({ type: "mcdonalds" });
  });

  it("returns null when there are no valid placements", () => {
    const ai = new SimpleAI();
    const player = new Player("AI");
    const tile = createTile({ id: "basic" });

    const board = {
      getPlacementCandidates: vi.fn(() => []),
      getNeighbors: vi.fn(() => ({})),
      canPlace: vi.fn(() => false),
      previewPlacement: vi.fn(() => null),
    };

    const game = {
      board,
      calculatePoints: () => 0,
    };

    expect(ai.planMove(game as any, player, tile)).toBeNull();
  });
});
