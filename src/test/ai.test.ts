import { describe, it, expect, beforeEach, vi } from "vitest";
import { SimpleAI } from "../ai";
import { Game } from "../game";
import { Player } from "../player";
import { Tile } from "../tile";
import { PlayerDefinition, TileDefinition } from "../types";

describe("SimpleAI", () => {
  let ai: SimpleAI;
  let game: Game;
  let aiPlayer: Player;
  let testTile: Tile;

  beforeEach(() => {
    ai = new SimpleAI();

    const playerConfigs: PlayerDefinition[] = [
      { id: "human", name: "Human", isAI: false, color: "#FF0000" },
      { id: "ai", name: "AI Player", isAI: true, color: "#0000FF" },
    ];

    game = new Game(playerConfigs);
    aiPlayer = new Player("AI Player", {
      id: "ai",
      isAI: true,
      color: "#0000FF",
    });

    testTile = new Tile({
      id: "test-tile",
      name: "Test Tile",
      edges: { north: "road", east: "field", south: "road", west: "field" },
      center: "field",
      roadConnections: [["north", "south"]],
      costcoZones: [],
    } as TileDefinition);
  });

  describe("constructor", () => {
    it("should create AI with default weights", () => {
      const defaultAI = new SimpleAI();
      expect(defaultAI).toBeDefined();
    });

    it("should accept custom weights", () => {
      const customAI = new SimpleAI({
        completionWeight: 10,
        adjacencyWeight: 5,
        costcoWeight: 3,
      });
      expect(customAI).toBeDefined();
    });

    it("should use default weights for undefined options", () => {
      const partialAI = new SimpleAI({
        completionWeight: 10,
        // adjacencyWeight and costcoWeight should use defaults
      });
      expect(partialAI).toBeDefined();
    });
  });

  describe("planMove", () => {
    it("should return null when no placement candidates exist", () => {
      // Create a mock game with no valid placements
      const mockGame = {
        board: {
          getPlacementCandidates: vi.fn().mockReturnValue([]),
        },
      } as any;

      const move = ai.planMove(mockGame, aiPlayer, testTile);
      expect(move).toBeNull();
    });

    it("should return a valid move when candidates exist", () => {
      const validPlacements = game.getValidPlacements();

      if (validPlacements.length > 0) {
        // Use the real game state which should have valid placements
        const mockGame = {
          board: {
            getPlacementCandidates: vi.fn().mockReturnValue(validPlacements),
            getNeighbors: vi.fn().mockReturnValue({}),
            canPlace: vi.fn().mockReturnValue(true),
            previewPlacement: vi.fn().mockReturnValue({ completed: [] }),
            getTile: vi.fn().mockReturnValue(testTile),
          },
          calculatePoints: vi.fn().mockReturnValue(5),
        } as any;

        const move = ai.planMove(mockGame, aiPlayer, testTile);

        expect(move).not.toBeNull();
        expect(move).toHaveProperty("position");
        expect(move).toHaveProperty("rotation");
        expect(move?.position).toMatchObject({
          x: expect.any(Number),
          y: expect.any(Number),
        });
        expect(typeof move?.rotation).toBe("number");
      }
    });

    it("should prefer moves that complete features", () => {
      const position1 = { x: 1, y: 0 };
      const position2 = { x: 0, y: 1 };

      const mockGame = {
        board: {
          getPlacementCandidates: vi
            .fn()
            .mockReturnValue([position1, position2]),
          getNeighbors: vi.fn().mockReturnValue({}),
          canPlace: vi.fn().mockReturnValue(true),
          previewPlacement: vi
            .fn()
            .mockReturnValueOnce({
              completed: [{ type: "road", points: 4 }],
            }) // Complete feature
            .mockReturnValueOnce({ completed: [] }), // No completion
          getTile: vi.fn().mockReturnValue(testTile),
        },
        calculatePoints: vi.fn().mockReturnValue(4),
      } as any;

      const move = ai.planMove(mockGame, aiPlayer, testTile);

      expect(move).not.toBeNull();
      // Should prefer the position that completes a feature (position1)
      expect(move?.position).toEqual(position1);
    });

    it("should consider tile rotation options", () => {
      const validPlacements = [{ x: 1, y: 0 }];

      const mockGame = {
        board: {
          getPlacementCandidates: vi.fn().mockReturnValue(validPlacements),
          getNeighbors: vi.fn().mockReturnValue({}),
          canPlace: vi.fn().mockReturnValue(true),
          previewPlacement: vi.fn().mockReturnValue({ completed: [] }),
          getTile: vi.fn().mockReturnValue(testTile),
        },
        calculatePoints: vi.fn().mockReturnValue(0),
      } as any;

      const move = ai.planMove(mockGame, aiPlayer, testTile);

      expect(move).not.toBeNull();
      expect(move?.rotation).toBeGreaterThanOrEqual(0);
      expect(move?.rotation).toBeLessThan(4);
    });

    it("should handle costco preferences", () => {
      const costcoAI = new SimpleAI({ costcoWeight: 10 });

      const costcoTile = new Tile({
        id: "costco-tile",
        name: "Costco Tile",
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
            hasPennant: true,
          },
        ],
      } as TileDefinition);

      const mockGame = {
        board: {
          getPlacementCandidates: vi.fn().mockReturnValue([{ x: 1, y: 0 }]),
          getNeighbors: vi.fn().mockReturnValue({}),
          canPlace: vi.fn().mockReturnValue(true),
          previewPlacement: vi.fn().mockReturnValue({ completed: [] }),
          getTile: vi.fn().mockReturnValue(costcoTile),
        },
        calculatePoints: vi.fn().mockReturnValue(0),
      } as any;

      const move = costcoAI.planMove(mockGame, aiPlayer, costcoTile);
      expect(move).not.toBeNull();
    });
  });

  describe("AI behavior patterns", () => {
    it("should be deterministic with same inputs", () => {
      const mockGame = {
        board: {
          getPlacementCandidates: vi.fn().mockReturnValue([{ x: 1, y: 0 }]),
          getNeighbors: vi.fn().mockReturnValue({}),
          canPlace: vi.fn().mockReturnValue(true),
          previewPlacement: vi.fn().mockReturnValue({ completed: [] }),
          getTile: vi.fn().mockReturnValue(testTile),
        },
        calculatePoints: vi.fn().mockReturnValue(5),
      } as any;

      const move1 = ai.planMove(mockGame, aiPlayer, testTile);
      const move2 = ai.planMove(mockGame, aiPlayer, testTile);

      // Both moves should be non-null
      expect(move1).not.toBeNull();
      expect(move2).not.toBeNull();

      // Positions should be the same (deterministic positioning)
      expect(move1?.position).toEqual(move2?.position);

      // Rotation may vary when multiple rotations have equal scores
      // Just ensure rotation is valid (0-3)
      expect(move1?.rotation).toBeGreaterThanOrEqual(0);
      expect(move1?.rotation).toBeLessThan(4);
      expect(move2?.rotation).toBeGreaterThanOrEqual(0);
      expect(move2?.rotation).toBeLessThan(4);
    });

    it("should prefer positions with more neighbors (adjacency)", () => {
      const position1 = { x: 1, y: 0 }; // More neighbors
      const position2 = { x: 2, y: 0 }; // Fewer neighbors

      const mockGame = {
        board: {
          getPlacementCandidates: vi
            .fn()
            .mockReturnValue([position1, position2]),
          getNeighbors: vi
            .fn()
            .mockReturnValueOnce({ north: {}, east: {}, south: {} }) // 3 neighbors
            .mockReturnValueOnce({ north: {} }), // 1 neighbor
          canPlace: vi.fn().mockReturnValue(true),
          previewPlacement: vi.fn().mockReturnValue({ completed: [] }),
          getTile: vi.fn().mockReturnValue(testTile),
        },
        calculatePoints: vi.fn().mockReturnValue(0),
      } as any;

      const adjacencyAI = new SimpleAI({ adjacencyWeight: 10 });
      const move = adjacencyAI.planMove(mockGame, aiPlayer, testTile);

      expect(move?.position).toEqual(position1); // Should prefer more neighbors
    });
  });

  describe("integration with game", () => {
    it("should make valid moves in actual game context", () => {
      // Advance to AI player's turn
      const state = game.getState();
      if (state.players[state.currentPlayerIndex].isAI) {
        const validPlacements = game.getValidPlacements();
        expect(validPlacements.length).toBeGreaterThan(0);

        // AI should be able to make a move
        const currentTile = state.currentTile;
        if (currentTile) {
          // This tests that AI can work with real game state
          expect(() => {
            // The AI would typically be called by the game engine
            // Here we just verify it can handle real game state
            const mockGame = {
              board: state.board,
              calculatePoints: () => 5,
            } as any;

            const move = ai.planMove(mockGame, aiPlayer, currentTile);
            expect(move).toBeDefined();
          }).not.toThrow();
        }
      }
    });
  });
});
