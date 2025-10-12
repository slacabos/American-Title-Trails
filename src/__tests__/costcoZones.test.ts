import { describe, expect, it } from "vitest";
import { Board } from "../board";
import { Tile } from "../tile";
import { Direction, TileDefinition } from "../types";

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

describe("Costco zone geometry", () => {
  it("rotates zone edges and polygons with the tile", () => {
    const tile = createTestTile({
      id: "zone-rotation",
      costcoZones: [
        {
          id: "atrium",
          edges: ["north", "east"],
          polygon: [
            { x: 0.25, y: 0.1 },
            { x: 0.75, y: 0.1 },
            { x: 0.9, y: 0.45 },
            { x: 0.6, y: 0.6 },
            { x: 0.2, y: 0.55 },
          ],
          pennants: 1,
        },
      ],
      edges: {
        north: "costco",
        east: "costco",
        south: "field",
        west: "field",
      },
      center: "costco",
    });

    const rotated = tile.rotate(1);

    const rotatedZone = rotated.costcoZones[0];
    expect(rotatedZone.edges).toEqual<[Direction, Direction]>([
      "east",
      "south",
    ]);

    const firstPoint = rotatedZone.polygon[0];
    expect(firstPoint.x).toBeCloseTo(0.9, 2);
    expect(firstPoint.y).toBeCloseTo(0.25, 2);
  });
});

describe("Costco completion scoring", () => {
  it("awards pennant bonuses for completed Costcos", () => {
    const board = new Board();

    const plaza = createTestTile({
      id: "plaza",
      edges: {
        north: "costco",
        east: "field",
        south: "field",
        west: "field",
      },
      center: "costco",
      costcoZones: [
        {
          id: "plaza-zone",
          edges: ["north"],
          polygon: [
            { x: 0.2, y: 0.1 },
            { x: 0.8, y: 0.1 },
            { x: 0.7, y: 0.3 },
            { x: 0.3, y: 0.3 },
          ],
          pennants: 1,
        },
      ],
    });

    const gate = createTestTile({
      id: "gate",
      edges: {
        north: "field",
        east: "field",
        south: "costco",
        west: "field",
      },
      center: "costco",
      costcoZones: [
        {
          id: "gate-zone",
          edges: ["south"],
          polygon: [
            { x: 0.25, y: 0.7 },
            { x: 0.75, y: 0.7 },
            { x: 0.7, y: 0.9 },
            { x: 0.3, y: 0.9 },
          ],
        },
      ],
    });

    const firstPlacement = board.placeTile(plaza, { x: 0, y: 0 });
    expect(firstPlacement.completed).toHaveLength(0);

    const result = board.placeTile(gate, { x: 0, y: -1 });
    expect(result.completed).toHaveLength(1);

    const costcoFeature = result.completed[0];
    expect(costcoFeature.type).toBe("costco");
    expect(costcoFeature.pennants).toBe(1);
    expect(costcoFeature.tiles.size).toBe(2);
    expect(costcoFeature.points).toBe(6);
    expect(costcoFeature.edges.has("0,-1:gate-zone")).toBe(true);
  });

  it("treats center-connected zones as a single Costco feature", () => {
    const board = new Board();

    const splitHall = createTestTile({
      id: "split-hall",
      edges: {
        north: "costco",
        east: "field",
        south: "costco",
        west: "field",
      },
      center: "costco",
      costcoZones: [
        {
          id: "north-wing",
          edges: ["north", "center"],
          polygon: [
            { x: 0.2, y: 0.1 },
            { x: 0.8, y: 0.1 },
            { x: 0.7, y: 0.4 },
            { x: 0.3, y: 0.4 },
          ],
          pennants: 1,
        },
        {
          id: "south-wing",
          edges: ["south", "center"],
          polygon: [
            { x: 0.3, y: 0.6 },
            { x: 0.7, y: 0.6 },
            { x: 0.8, y: 0.9 },
            { x: 0.2, y: 0.9 },
          ],
        },
      ],
    });

    const northCap = createTestTile({
      id: "north-cap",
      edges: {
        north: "field",
        east: "field",
        south: "costco",
        west: "field",
      },
      center: "costco",
      costcoZones: [
        {
          id: "north-cap-zone",
          edges: ["south"],
          polygon: [
            { x: 0.2, y: 0.7 },
            { x: 0.8, y: 0.7 },
            { x: 0.7, y: 0.9 },
            { x: 0.3, y: 0.9 },
          ],
        },
      ],
    });

    const southCap = createTestTile({
      id: "south-cap",
      edges: {
        north: "costco",
        east: "field",
        south: "field",
        west: "field",
      },
      center: "costco",
      costcoZones: [
        {
          id: "south-cap-zone",
          edges: ["north"],
          polygon: [
            { x: 0.2, y: 0.1 },
            { x: 0.8, y: 0.1 },
            { x: 0.7, y: 0.3 },
            { x: 0.3, y: 0.3 },
          ],
        },
      ],
    });

    board.placeTile(splitHall, { x: 0, y: 0 });

    const northResult = board.placeTile(northCap, { x: 0, y: -1 });
    expect(northResult.completed).toHaveLength(0);

    const southResult = board.placeTile(southCap, { x: 0, y: 1 });

    expect(southResult.completed).toHaveLength(1);
    const combinedFeature = southResult.completed[0];
    expect(combinedFeature.tiles.size).toBe(3);
    expect(combinedFeature.pennants).toBe(1);
    expect(combinedFeature.points).toBe(8);
  });
});
