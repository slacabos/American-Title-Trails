import { describe, expect, it } from "vitest";
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

describe("Tile rotation", () => {
  it("rotates edges and road connections without mutating the original tile", () => {
    const tile = createTile({
      id: "road",
      edges: {
        north: "road",
        east: "field",
        south: "road",
        west: "field",
      },
      roadConnections: [["north", "south"]],
    });

    const rotated = tile.rotate(1);

    expect(rotated).not.toBe(tile);
    expect(rotated.edgeAt("north")).toBe("field");
    expect(rotated.edgeAt("east")).toBe("road");
    expect(rotated.roadConnections[0]).toEqual(["east", "west"]);

    // Original tile remains unchanged
    expect(tile.edgeAt("north")).toBe("road");
    expect(tile.roadConnections[0]).toEqual(["north", "south"]);
  });

  it("returns to original orientation after four rotations", () => {
    const tile = createTile({
      id: "loop",
      edges: {
        north: "costco",
        east: "road",
        south: "field",
        west: "road",
      },
      roadConnections: [["east", "west"]],
      costcoZones: [
        {
          id: "plaza",
          edges: ["north", "center"],
          polygon: [
            { x: 0.2, y: 0.1 },
            { x: 0.8, y: 0.1 },
            { x: 0.6, y: 0.4 },
            { x: 0.3, y: 0.4 },
          ],
          pennants: 1,
        },
      ],
    });

    const rotated = tile.rotate(4);

    expect(rotated.edgeAt("north")).toBe(tile.edgeAt("north"));
    expect(rotated.costcoZones[0].polygon[0]).toEqual(tile.costcoZones[0].polygon[0]);
    expect(rotated.costcoZones[0].edges).toEqual(tile.costcoZones[0].edges);
  });
});

describe("Tile cloning", () => {
  it("deeply clones Costco zone polygons", () => {
    const tile = createTile({
      id: "clone",
      costcoZones: [
        {
          id: "zone",
          edges: ["center"],
          polygon: [
            { x: 0.1, y: 0.2 },
            { x: 0.4, y: 0.2 },
            { x: 0.3, y: 0.6 },
          ],
        },
      ],
    });

    const clone = tile.clone();
    clone.costcoZones[0].polygon[0].x = 0.9;

    expect(tile.costcoZones[0].polygon[0].x).toBeCloseTo(0.1, 5);
  });
});
