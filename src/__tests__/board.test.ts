import { describe, expect, it } from "vitest";
import { Board } from "../board";
import { Tile } from "../tile";
import { TileDefinition } from "../types";

const createTestTile = (definition: Partial<TileDefinition>): Tile =>
  new Tile({
    id: definition.id ?? "test-tile",
    name: definition.name ?? "Test Tile",
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

describe("Board placement rules", () => {
  it("rejects placements with mismatched edges", () => {
    const board = new Board();
    const base = createTestTile({
      id: "base-road",
      edges: {
        north: "road",
        east: "field",
        south: "road",
        west: "field",
      },
      roadConnections: [["north", "south"]],
    });

    const mismatch = createTestTile({
      id: "mismatch",
      edges: {
        north: "field",
        east: "field",
        south: "field",
        west: "field",
      },
    });

    board.placeTile(base, { x: 0, y: 0 });

    expect(board.canPlace(mismatch, { x: 0, y: 1 })).toBe(false);

    const match = createTestTile({
      id: "match",
      edges: {
        north: "road",
        east: "field",
        south: "field",
        west: "field",
      },
      roadConnections: [["north", "center"]],
    });

    expect(board.canPlace(match, { x: 0, y: 1 })).toBe(true);
  });
});

describe("Board feature completion", () => {
  const baseRoad = () =>
    createTestTile({
      id: "road-end",
      edges: {
        north: "road",
        east: "field",
        south: "field",
        west: "field",
      },
      roadConnections: [["north", "center"]],
    });

  it("identifies completed roads and awards points", () => {
    const board = new Board();
    const start = baseRoad();
    const facing = start.rotate(2);

    board.placeTile(start, { x: 0, y: 0 });
    board.claimFeature("road", { x: 0, y: 0 }, "north", "player-1");

    const result = board.placeTile(facing, { x: 0, y: -1 });

    expect(result.completed).toHaveLength(1);
    const roadFeature = result.completed[0];
    expect(roadFeature.type).toBe("road");
    expect(roadFeature.points).toBe(2);
    expect(roadFeature.claimedBy).toContain("player-1");

    board.returnFollowersFromCompletedFeatures(result.completed);
    expect(board.getFeatureClaims()).toHaveLength(0);
  });

  it("provides previews for valid placements without mutating the board", () => {
    const board = new Board();
    const start = baseRoad();
    const facing = start.rotate(2);

    board.placeTile(start, { x: 0, y: 0 });

    const preview = board.previewPlacement(facing, { x: 0, y: -1 });
    expect(preview).not.toBeNull();
    expect(preview?.completed).toHaveLength(1);

    const storedTile = board.getTile({ x: 0, y: -1 });
    expect(storedTile).toBeUndefined();
  });

  it("returns null previews when placement is invalid", () => {
    const board = new Board();
    const start = baseRoad();
    const invalid = createTestTile({
      id: "invalid",
      edges: {
        north: "field",
        east: "field",
        south: "field",
        west: "field",
      },
    });

    board.placeTile(start, { x: 0, y: 0 });

    const preview = board.previewPlacement(invalid, { x: 0, y: -1 });
    expect(preview).toBeNull();
  });
});
