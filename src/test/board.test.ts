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
        "road_0",
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
        "road_0",
        "player1"
      );
      expect(result1).toBeDefined();

      // Second claim should throw an error
      expect(() => {
        board.claimFeature("road", { x: 0, y: 1 }, "road_0", "player2");
      }).toThrow("Cannot claim feature: already has a follower");
    });
  });

  describe("canClaimFeature", () => {
    it("should return true for unclaimed features", () => {
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

      const canClaim = board.canClaimFeature("road", { x: 0, y: 1 }, "road_0");
      expect(canClaim).toBe(true);
    });

    it("should return false for claimed features", () => {
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
      board.claimFeature("road", { x: 0, y: 1 }, "road_0", "player1");

      const canClaim = board.canClaimFeature("road", { x: 0, y: 1 }, "road_0");
      expect(canClaim).toBe(false);
    });

    it("should return false for connected features when any part is claimed", () => {
      // Create tiles that form a connected road feature
      // Start tile has road on east edge
      // Place a tile to the east that also has a road, forming a connected feature

      const roadTile1 = new Tile({
        id: "road-tile-1",
        name: "Road Tile 1",
        edges: {
          north: "costco",
          east: "road",
          south: "field",
          west: "road",
        },
        center: "road",
        roadConnections: [["west", "east"]],
        costcoZones: [],
      } as TileDefinition);

      const roadTile2 = new Tile({
        id: "road-tile-2",
        name: "Road Tile 2",
        edges: {
          north: "field",
          east: "field",
          south: "field",
          west: "road",
        },
        center: "field",
        roadConnections: [["west", "center"]],
        costcoZones: [],
      } as TileDefinition);

      board.placeTile(roadTile1, { x: 1, y: 0 });
      board.placeTile(roadTile2, { x: 2, y: 0 });

      // Claim the road on the first tile
      board.claimFeature("road", { x: 1, y: 0 }, "road_0", "player1");

      // The connected road on the second tile should not be claimable
      const canClaim = board.canClaimFeature("road", { x: 2, y: 0 }, "road_0");
      expect(canClaim).toBe(false);
    });

    it("should allow claiming different features on the same tile independently", () => {
      // Create a tile with both a road and a Costco zone
      const mixedTile = new Tile({
        id: "mixed-tile",
        name: "Mixed Tile",
        edges: {
          north: "costco",
          east: "road",
          south: "costco",
          west: "road",
        },
        center: "road",
        roadConnections: [["east", "west"]],
        costcoZones: [
          {
            id: "costco1",
            segments: ["north"],
            hasPennant: false,
          },
        ],
      } as TileDefinition);

      board.placeTile(mixedTile, { x: 1, y: 0 });

      // Claim the road
      board.claimFeature("road", { x: 1, y: 0 }, "road_0", "player1");

      // Costco should still be claimable
      const canClaimCostco = board.canClaimFeature(
        "costco",
        { x: 1, y: 0 },
        "costco_0"
      );
      expect(canClaimCostco).toBe(true);
    });

    it("should handle McDonalds claims correctly", () => {
      const mcdonaldsTile = new Tile({
        id: "mcdonalds-tile",
        name: "McDonalds Tile",
        edges: {
          north: "field",
          east: "road",
          south: "field",
          west: "road",
        },
        center: "mcdonalds",
        roadConnections: [["east", "west"]],
        costcoZones: [],
      } as TileDefinition);

      board.placeTile(mcdonaldsTile, { x: 1, y: 0 });

      // Should be claimable initially
      expect(board.canClaimFeature("mcdonalds", { x: 1, y: 0 }, undefined)).toBe(
        true
      );

      // Claim it
      board.claimFeature("mcdonalds", { x: 1, y: 0 }, undefined, "player1");

      // Should not be claimable after
      expect(board.canClaimFeature("mcdonalds", { x: 1, y: 0 }, undefined)).toBe(
        false
      );
    });
  });

  describe("feature completion detection", () => {
    it("should detect a completed road loop", () => {
      // Place 4 curve-road tiles in a 2×2 grid to form a closed road loop.
      // Base curve-road: edges N=road, E=road, S=field, W=field
      const curveDef = {
        id: "curve-road",
        name: "Scenic Byway Curve",
        edges: { north: "road", east: "road", south: "field", west: "field" },
        center: "field",
        roadConnections: [["north", "east"]],
        costcoZones: [],
        fieldSegments: [
          { id: "field-0", corners: ["ne"] },
          { id: "field-1", corners: ["nw", "sw", "se"] },
        ],
      } as TileDefinition;

      const freshBoard = new Board();

      // (0,0) rot 1 → roads on E+S
      freshBoard.placeTile(new Tile(curveDef).rotate(1), { x: 0, y: 0 });
      // (1,0) rot 2 → roads on S+W  (west matches (0,0) east)
      freshBoard.placeTile(new Tile(curveDef).rotate(2), { x: 1, y: 0 });
      // (0,1) rot 0 → roads on N+E  (north matches (0,0) south)
      freshBoard.placeTile(new Tile(curveDef).rotate(0), { x: 0, y: 1 });
      // (1,1) rot 3 → roads on W+N  (closes the loop)
      const result = freshBoard.placeTile(
        new Tile(curveDef).rotate(3),
        { x: 1, y: 1 }
      );

      const completedRoads = result.completed.filter(
        (f) => f.type === "road" && f.isComplete
      );
      expect(completedRoads).toHaveLength(1);
      expect(completedRoads[0].tiles.size).toBe(4);
      expect(completedRoads[0].points).toBe(4);
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

  describe("single-tile Costco completion", () => {
    it("should complete an enclosed Costco (multi-tile)", () => {
      // Create a fresh board for this test
      // Coordinate system: north = y-1, south = y+1, east = x+1, west = x-1
      const testBoard = new Board();

      // Start with a center tile that has all costco edges
      const centerTile = new Tile({
        id: "center",
        name: "Center",
        edges: {
          north: "costco",
          east: "costco",
          south: "costco",
          west: "costco",
        },
        center: "costco",
        roadConnections: [],
        costcoZones: [
          {
            id: "costco1",
            segments: ["north", "east", "south", "west", "center"],
            hasPennant: false,
          },
        ],
      } as TileDefinition);

      testBoard.placeTile(centerTile, { x: 0, y: 0 });

      // North tile at (0, -1) - has costco on south to connect to center's north
      // Also has costco on east/west to connect to corner tiles
      const northTile = new Tile({
        id: "north",
        name: "North",
        edges: {
          north: "field",
          east: "costco",
          south: "costco", // connects to center
          west: "costco",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          { id: "c1", segments: ["south", "east", "west"], hasPennant: false },
        ],
      } as TileDefinition);

      // South tile at (0, 1) - has costco on north to connect to center's south
      const southTile = new Tile({
        id: "south",
        name: "South",
        edges: {
          north: "costco", // connects to center
          east: "costco",
          south: "field",
          west: "costco",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          { id: "c1", segments: ["north", "east", "west"], hasPennant: false },
        ],
      } as TileDefinition);

      // East tile at (1, 0) - has costco on west to connect to center's east
      const eastTile = new Tile({
        id: "east",
        name: "East",
        edges: {
          north: "costco",
          east: "field",
          south: "costco",
          west: "costco", // connects to center
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          { id: "c1", segments: ["west", "north", "south"], hasPennant: false },
        ],
      } as TileDefinition);

      // West tile at (-1, 0) - has costco on east to connect to center's west
      const westTile = new Tile({
        id: "west",
        name: "West",
        edges: {
          north: "costco",
          east: "costco", // connects to center
          south: "costco",
          west: "field",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          { id: "c1", segments: ["east", "north", "south"], hasPennant: false },
        ],
      } as TileDefinition);

      // Corner tiles to close the costco completely
      // NW corner at (-1, -1)
      const nwCorner = new Tile({
        id: "nw",
        name: "NW Corner",
        edges: {
          north: "field",
          east: "costco", // connects to north tile's west
          south: "costco", // connects to west tile's north
          west: "field",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          { id: "c1", segments: ["east", "south"], hasPennant: false },
        ],
      } as TileDefinition);

      // NE corner at (1, -1)
      const neCorner = new Tile({
        id: "ne",
        name: "NE Corner",
        edges: {
          north: "field",
          east: "field",
          south: "costco", // connects to east tile's north
          west: "costco", // connects to north tile's east
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          { id: "c1", segments: ["west", "south"], hasPennant: false },
        ],
      } as TileDefinition);

      // SW corner at (-1, 1)
      const swCorner = new Tile({
        id: "sw",
        name: "SW Corner",
        edges: {
          north: "costco", // connects to west tile's south
          east: "costco", // connects to south tile's west
          south: "field",
          west: "field",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          { id: "c1", segments: ["north", "east"], hasPennant: false },
        ],
      } as TileDefinition);

      // SE corner at (1, 1)
      const seCorner = new Tile({
        id: "se",
        name: "SE Corner",
        edges: {
          north: "costco", // connects to east tile's south
          east: "field",
          south: "field",
          west: "costco", // connects to south tile's east
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          { id: "c1", segments: ["north", "west"], hasPennant: false },
        ],
      } as TileDefinition);

      // Place tiles in order, need to be careful about placement validation
      testBoard.placeTile(northTile, { x: 0, y: -1 });
      testBoard.placeTile(southTile, { x: 0, y: 1 });
      testBoard.placeTile(eastTile, { x: 1, y: 0 });
      testBoard.placeTile(westTile, { x: -1, y: 0 });
      testBoard.placeTile(nwCorner, { x: -1, y: -1 });
      testBoard.placeTile(neCorner, { x: 1, y: -1 });
      testBoard.placeTile(swCorner, { x: -1, y: 1 });

      // The last tile should complete the Costco
      const result = testBoard.placeTile(seCorner, { x: 1, y: 1 });

      // The Costco should be complete
      const costcoCompleted = result.completed.filter(
        (f) => f.type === "costco"
      );
      expect(costcoCompleted.length).toBe(1);
      // The feature spans 9 tiles now (center + 4 sides + 4 corners)
      expect(costcoCompleted[0].tiles.size).toBe(9);
    });

    it("should not complete a single-tile Costco with open edges", () => {
      const testBoard = new Board();

      // Start with a tile that has Costco on all edges
      const costcoTile = new Tile({
        id: "costco-center",
        name: "Costco Center",
        edges: {
          north: "costco",
          east: "costco",
          south: "costco",
          west: "costco",
        },
        center: "costco",
        roadConnections: [],
        costcoZones: [
          {
            id: "costco1",
            segments: ["north", "east", "south", "west", "center"],
            hasPennant: false,
          },
        ],
      } as TileDefinition);

      const result = testBoard.placeTile(costcoTile, { x: 0, y: 0 });

      // Should not be complete since it has open edges
      const costcoCompleted = result.completed.filter(
        (f) => f.type === "costco"
      );
      expect(costcoCompleted.length).toBe(0);
    });

    it("should complete a two-tile Costco that shares one edge", () => {
      const testBoard = new Board();

      // Create a tile with Costco only on the south edge
      // Note: north is y-1, south is y+1 in this coordinate system
      const bottomTile = new Tile({
        id: "bottom-tile",
        name: "Bottom Tile",
        edges: {
          north: "costco", // connects to north neighbor
          east: "field",
          south: "field",
          west: "field",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          {
            id: "costco1",
            segments: ["north"],
            hasPennant: false,
          },
        ],
      } as TileDefinition);

      testBoard.placeTile(bottomTile, { x: 0, y: 0 });

      // Place a tile to the north (y - 1 = -1) that closes the Costco
      const topTile = new Tile({
        id: "top-tile",
        name: "Top Tile",
        edges: {
          north: "field",
          east: "field",
          south: "costco", // connects to south neighbor
          west: "field",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          {
            id: "costco1",
            segments: ["south"],
            hasPennant: false,
          },
        ],
      } as TileDefinition);

      const result = testBoard.placeTile(topTile, { x: 0, y: -1 });

      // The Costco should now be complete (2 tiles)
      const costcoCompleted = result.completed.filter(
        (f) => f.type === "costco"
      );
      expect(costcoCompleted.length).toBe(1);
      expect(costcoCompleted[0].tiles.size).toBe(2);
    });

    it("should verify isCostcoComplete directly", () => {
      const testBoard = new Board();

      // Create a tile with Costco only on the north edge
      const bottomTile = new Tile({
        id: "bottom-tile",
        name: "Bottom Tile",
        edges: {
          north: "costco",
          east: "field",
          south: "field",
          west: "field",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          {
            id: "costco1",
            segments: ["north"],
            hasPennant: false,
          },
        ],
      } as TileDefinition);

      testBoard.placeTile(bottomTile, { x: 0, y: 0 });

      // Place a tile to the north (y-1) that closes the Costco
      const topTile = new Tile({
        id: "top-tile",
        name: "Top Tile",
        edges: {
          north: "field",
          east: "field",
          south: "costco",
          west: "field",
        },
        center: "field",
        roadConnections: [],
        costcoZones: [
          {
            id: "costco1",
            segments: ["south"],
            hasPennant: false,
          },
        ],
      } as TileDefinition);

      testBoard.placeTile(topTile, { x: 0, y: -1 });

      // Manually trace and check from the top tile
      const tileRecord = testBoard.getTile({ x: 0, y: -1 });
      expect(tileRecord).toBeDefined();

      const feature = testBoard.traceCostcoFeature(
        { x: 0, y: -1 },
        tileRecord!.tile.costcoZones[0],
        new Set()
      );

      expect(feature.tiles.size).toBe(2);
      expect(feature.edges.has("0,-1:south")).toBe(true);
      expect(feature.edges.has("0,0:north")).toBe(true);

      const isComplete = testBoard.isCostcoComplete(feature);
      expect(isComplete).toBe(true);
    });
  });
});
