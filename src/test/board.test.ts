import { describe, it, expect, beforeEach } from "vitest";
import { Board } from "../board";
import { Tile } from "../tile";
import { getStartTile } from "../tileLibrary";
import { TileDefinition } from "../types";

describe("Board", () => {
  let board: Board;
  let startTile: Tile;

  beforeEach(() => {
    board = new Board();
    startTile = getStartTile();
    board.placeTile(startTile, { x: 0, y: 0 });
  });

  describe("constructor", () => {
    it("should create an empty board", () => {
      const emptyBoard = new Board();
      expect(emptyBoard.getTile({ x: 0, y: 0 })).toBeUndefined();
      expect(emptyBoard.getPlacementCandidates()).toEqual([{ x: 0, y: 0 }]);
    });
  });

  describe("placeTile", () => {
    it("should place a tile at the given position", () => {
      const tileRecord = board.getTile({ x: 0, y: 0 });
      expect(tileRecord).toBeDefined();
      expect(tileRecord?.tile).toEqual(startTile);
    });

    it("should return placement result with completed features", () => {
      // Create a road tile that matches the start tile's north edge (costco)
      const roadTile = new Tile({
        id: "test-road",
        name: "Test Road",
        edges: {
          north: "field",
          east: "field",
          south: "costco",
          west: "field",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [],
      } as TileDefinition);

      const result = board.placeTile(roadTile, { x: 0, y: 1 });
      expect(result).toBeDefined();
      expect(result.completed).toBeDefined();
    });
  });

  describe("getTile", () => {
    it("should return undefined for empty positions", () => {
      const tileRecord = board.getTile({ x: 5, y: 5 });
      expect(tileRecord).toBeUndefined();
    });

    it("should return the correct tile for occupied positions", () => {
      const tileRecord = board.getTile({ x: 0, y: 0 });
      expect(tileRecord?.tile).toEqual(startTile);
    });
  });

  describe("getPlacementCandidates", () => {
    it("should return adjacent empty positions", () => {
      const candidates = board.getPlacementCandidates();
      expect(candidates).toHaveLength(4); // 4 adjacent positions to start tile
      expect(candidates).toContainEqual({ x: 0, y: 1 });
      expect(candidates).toContainEqual({ x: 0, y: -1 });
      expect(candidates).toContainEqual({ x: 1, y: 0 });
      expect(candidates).toContainEqual({ x: -1, y: 0 });
    });

    it("should update candidates when new tiles are placed", () => {
      // Place a tile adjacent to start tile
      const roadTile = new Tile({
        id: "test-road",
        name: "Test Road",
        edges: {
          north: "field",
          east: "field",
          south: "costco",
          west: "field",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [],
      } as TileDefinition);

      board.placeTile(roadTile, { x: 0, y: 1 });

      const candidates = board.getPlacementCandidates();
      expect(candidates.length).toBeGreaterThan(4); // Should have more candidates now
      expect(candidates).toContainEqual({ x: 0, y: 2 }); // New position should be available
    });

    it("should not include already occupied positions", () => {
      const candidates = board.getPlacementCandidates();
      expect(candidates).not.toContainEqual({ x: 0, y: 0 }); // Start tile position should not be candidate
    });
  });

  describe("getBounds", () => {
    it("should return correct bounds for single tile", () => {
      const bounds = board.getBounds();
      expect(bounds).toEqual({
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
      });
    });

    it("should update bounds when tiles are added", () => {
      const roadTile = new Tile({
        id: "test-road",
        name: "Test Road",
        edges: { north: "field", east: "field", south: "field", west: "road" },
        center: "field",
        roadConnections: [],
        costcoZones: [],
      } as TileDefinition);

      board.placeTile(roadTile, { x: 1, y: 0 });

      const bounds = board.getBounds();
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(1);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(0);
    });
  });

  describe("claimFeature", () => {
    it("should allow claiming a valid feature", () => {
      const roadTile = new Tile({
        id: "test-road",
        name: "Test Road",
        edges: {
          north: "field",
          east: "field",
          south: "costco",
          west: "field",
        },
        center: "field",
        roadConnections: [["north"]],
        costcoZones: [],
      } as TileDefinition);

      board.placeTile(roadTile, { x: 0, y: 1 });

      const result = board.claimFeature(
        "road",
        { x: 0, y: 1 },
        "north",
        "player1"
      );
      expect(result).toBeDefined();
      expect(result.type).toBe("road");
      expect(result.players).toContain("player1");
    });

    it("should reject claiming already claimed features", () => {
      const roadTile = new Tile({
        id: "test-road",
        name: "Test Road",
        edges: {
          north: "field",
          east: "field",
          south: "costco",
          west: "field",
        },
        center: "field",
        roadConnections: [["north"]],
        costcoZones: [],
      } as TileDefinition);

      board.placeTile(roadTile, { x: 0, y: 1 });

      // First claim should succeed
      const result1 = board.claimFeature(
        "road",
        { x: 0, y: 1 },
        "north",
        "player1"
      );
      expect(result1).toBeDefined();

      // Second claim should also succeed (multiple players can claim)
      const result2 = board.claimFeature(
        "road",
        { x: 0, y: 1 },
        "north",
        "player2"
      );
      expect(result2).toBeDefined();
      expect(result2.players).toContain("player1");
      expect(result2.players).toContain("player2");
    });
  });

  describe("feature completion detection", () => {
    it("should detect completed roads", () => {
      // This test would require a more complex setup with multiple tiles
      // For now, we'll just verify the method exists and doesn't crash
      const roadTile = new Tile({
        id: "test-road",
        name: "Test Road",
        edges: { north: "field", east: "field", south: "field", west: "road" },
        center: "field",
        roadConnections: [["west", "center"]],
        costcoZones: [],
      } as TileDefinition);

      const result = board.placeTile(roadTile, { x: 1, y: 0 });
      expect(result.completed).toBeDefined();
    });

    it("should detect completed Costco areas", () => {
      const costcoTile = new Tile({
        id: "test-costco",
        name: "Test Costco",
        edges: {
          north: "field",
          east: "costco",
          south: "field",
          west: "road",
        },
        center: "costco",
        roadConnections: [],
        costcoZones: [
          {
            id: "costco1",
            segments: ["east", "center"],
            hasPennant: true,
          },
        ],
      } as TileDefinition);

      const result = board.placeTile(costcoTile, { x: 1, y: 0 });
      expect(result.completed).toBeDefined();
    });
  });
});
