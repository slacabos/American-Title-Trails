import { describe, it, expect, beforeEach } from "vitest";
import { Tile } from "../tile";
import { TileDefinition } from "../types";

describe("Tile", () => {
  let basicTile: Tile;
  let roadTile: Tile;
  let costcoTile: Tile;

  beforeEach(() => {
    basicTile = new Tile({
      id: "basic",
      name: "Basic Field",
      edges: { north: "field", east: "field", south: "field", west: "field" },
      center: "field",
      roadConnections: [],
      costcoZones: [],
    } as TileDefinition);

    roadTile = new Tile({
      id: "road",
      name: "Straight Road",
      edges: { north: "road", east: "field", south: "road", west: "field" },
      center: "field",
      roadConnections: [["north", "south"]],
      costcoZones: [],
    } as TileDefinition);

    costcoTile = new Tile({
      id: "costco",
      name: "Costco Tile",
      edges: { north: "costco", east: "field", south: "field", west: "costco" },
      center: "field",
      roadConnections: [],
      costcoZones: [
        {
          id: "costco1",
          segments: ["north", "west"],
          hasPennant: true,
        },
      ],
    } as TileDefinition);
  });

  describe("constructor", () => {
    it("should create a tile with correct properties", () => {
      expect(basicTile.id).toBe("basic");
      expect(basicTile.name).toBe("Basic Field");
      expect(basicTile.center).toBe("field");
      expect(basicTile.orientation).toBe(0);
      expect(basicTile.isStart).toBe(false);
    });

    it("should handle optional properties", () => {
      const minimalTile = new Tile({
        id: "minimal",
        name: "Minimal",
        edges: { north: "field", east: "field", south: "field", west: "field" },
      } as TileDefinition);

      expect(minimalTile.center).toBe("field");
      expect(minimalTile.roadConnections).toEqual([]);
      expect(minimalTile.costcoZones).toEqual([]);
      expect(minimalTile.isStart).toBe(false);
    });
  });

  describe("getEdge", () => {
    it("should return correct edge terrain for each direction", () => {
      expect(roadTile.getEdge("north")).toBe("road");
      expect(roadTile.getEdge("east")).toBe("field");
      expect(roadTile.getEdge("south")).toBe("road");
      expect(roadTile.getEdge("west")).toBe("field");
    });
  });

  describe("rotate", () => {
    it("should return same tile when rotating 0 times", () => {
      const rotated = basicTile.rotate(0);
      expect(rotated).toEqual(basicTile);
      expect(rotated.orientation).toBe(0);
    });

    it("should rotate edges correctly 90 degrees clockwise", () => {
      const rotated = roadTile.rotate(1);

      expect(rotated.getEdge("north")).toBe("field"); // was west
      expect(rotated.getEdge("east")).toBe("road"); // was north
      expect(rotated.getEdge("south")).toBe("field"); // was east
      expect(rotated.getEdge("west")).toBe("road"); // was south
      expect(rotated.orientation).toBe(1);
    });

    it("should rotate edges correctly 180 degrees", () => {
      const rotated = roadTile.rotate(2);

      expect(rotated.getEdge("north")).toBe("road"); // was south
      expect(rotated.getEdge("east")).toBe("field"); // was west
      expect(rotated.getEdge("south")).toBe("road"); // was north
      expect(rotated.getEdge("west")).toBe("field"); // was east
      expect(rotated.orientation).toBe(2);
    });

    it("should rotate edges correctly 270 degrees clockwise", () => {
      const rotated = roadTile.rotate(3);

      expect(rotated.getEdge("north")).toBe("field"); // was east
      expect(rotated.getEdge("east")).toBe("road"); // was south
      expect(rotated.getEdge("south")).toBe("field"); // was west
      expect(rotated.getEdge("west")).toBe("road"); // was north
      expect(rotated.orientation).toBe(3);
    });

    it("should handle full rotation (4 times = 360 degrees)", () => {
      const rotated = roadTile.rotate(4);

      expect(rotated.getEdge("north")).toBe(roadTile.getEdge("north"));
      expect(rotated.getEdge("east")).toBe(roadTile.getEdge("east"));
      expect(rotated.getEdge("south")).toBe(roadTile.getEdge("south"));
      expect(rotated.getEdge("west")).toBe(roadTile.getEdge("west"));
      expect(rotated.orientation).toBe(0); // Should wrap around
    });

    it("should rotate road connections correctly", () => {
      const original = new Tile({
        id: "corner-road",
        name: "Corner Road",
        edges: { north: "road", east: "road", south: "field", west: "field" },
        center: "field",
        roadConnections: [["north", "east"]],
        costcoZones: [],
      } as TileDefinition);

      const rotated = original.rotate(1);

      // After 90-degree rotation, north->east, east->south
      expect(rotated.roadConnections).toContainEqual(["east", "south"]);
    });

    it("should rotate costco zones correctly", () => {
      const rotated = costcoTile.rotate(1);

      // north->east, west->north after 90-degree rotation
      const rotatedZone = rotated.costcoZones[0];
      expect(rotatedZone.segments).toContain("east"); // was north
      expect(rotatedZone.segments).toContain("north"); // was west
      expect(rotatedZone.hasPennant).toBe(true); // Should preserve other properties
    });

    it("should handle negative rotations", () => {
      const rotated = roadTile.rotate(-1); // Counter-clockwise

      expect(rotated.getEdge("north")).toBe("field"); // was east
      expect(rotated.getEdge("east")).toBe("road"); // was south
      expect(rotated.getEdge("south")).toBe("field"); // was west
      expect(rotated.getEdge("west")).toBe("road"); // was north
    });

    it("should not modify original tile when rotating", () => {
      const originalNorth = roadTile.getEdge("north");
      const originalOrientation = roadTile.orientation;

      roadTile.rotate(1);

      // Original tile should be unchanged
      expect(roadTile.getEdge("north")).toBe(originalNorth);
      expect(roadTile.orientation).toBe(originalOrientation);
    });
  });

  describe("clone", () => {
    it("should create an exact copy of the tile", () => {
      const cloned = roadTile.clone();

      expect(cloned).toEqual(roadTile);
      expect(cloned).not.toBe(roadTile); // Should be different objects
    });

    it("should clone all properties including complex ones", () => {
      const cloned = costcoTile.clone();

      expect(cloned.id).toBe(costcoTile.id);
      expect(cloned.name).toBe(costcoTile.name);
      expect(cloned.center).toBe(costcoTile.center);
      expect(cloned.roadConnections).toEqual(costcoTile.roadConnections);
      expect(cloned.costcoZones).toEqual(costcoTile.costcoZones);
      expect(cloned.orientation).toBe(costcoTile.orientation);
    });

    it("should not share references with original", () => {
      const tileWithArrays = new Tile({
        id: "complex",
        name: "Complex",
        edges: { north: "road", east: "field", south: "road", west: "field" },
        center: "field",
        roadConnections: [["north", "south"]],
        costcoZones: [
          {
            id: "zone1",
            segments: ["north"],
            hasPennant: false,
          },
        ],
      } as TileDefinition);

      const cloned = tileWithArrays.clone();

      // Modifying cloned arrays shouldn't affect original
      expect(cloned.roadConnections).not.toBe(tileWithArrays.roadConnections);
      expect(cloned.costcoZones).not.toBe(tileWithArrays.costcoZones);
    });
  });

  describe("toString", () => {
    it("should return a string representation of the tile", () => {
      const str = roadTile.toString();
      expect(str).toContain("road");
      expect(str).toContain("Straight Road");
    });
  });
});
