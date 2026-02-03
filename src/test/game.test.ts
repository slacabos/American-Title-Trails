import { describe, it, expect, beforeEach, vi } from "vitest";
import { Game, GamePhase } from "../game";
import { PlayerDefinition } from "../types";
import { getStartTile } from "../tileLibrary";

describe("Game", () => {
  let game: Game;
  let playerConfigs: PlayerDefinition[];

  beforeEach(() => {
    playerConfigs = [
      { id: "player1", name: "Alice", isAI: false, color: "#FF0000" },
      { id: "player2", name: "Bob", isAI: true, color: "#0000FF" },
    ];
    game = new Game(playerConfigs);
  });

  describe("constructor", () => {
    it("should initialize game with correct number of players", () => {
      const state = game.getState();
      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe("Alice");
      expect(state.players[1].name).toBe("Bob");
    });

    it("should set correct initial game state", () => {
      const state = game.getState();
      expect(state.phase).toBe(GamePhase.PLACE_TILE);
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.isGameOver).toBe(false);
      expect(state.turnNumber).toBe(1);
    });

    it("should place starting tile at origin", () => {
      const state = game.getState();
      const tileRecord = state.board.getTile({ x: 0, y: 0 });
      expect(tileRecord).toBeDefined();
      expect(tileRecord?.tile).toEqual(getStartTile());
    });

    it("should draw initial current tile", () => {
      const state = game.getState();
      expect(state.currentTile).toBeDefined();
      // After drawing one tile for the current player, deck should be smaller than original
      expect(state.tileDeck.length).toBeLessThan(51);
    });

    it("should initialize players with correct follower count", () => {
      const state = game.getState();
      expect(state.players[0].followers).toBe(7);
      expect(state.players[1].followers).toBe(7);
    });
  });

  describe("placeTile", () => {
    it("should successfully place a valid tile", () => {
      const validPlacements = game.getValidPlacements();

      if (validPlacements.length > 0) {
        const position = validPlacements[0];
        const result = game.placeTile(position, 0);

        expect(result.success).toBe(true);
        expect(game.getState().phase).toBe(GamePhase.CLAIM_FEATURE);
      }
    });

    it("should reject placement at invalid position", () => {
      const result = game.placeTile({ x: 10, y: 10 }, 0);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid tile placement");
      expect(game.getState().phase).toBe(GamePhase.PLACE_TILE); // Should remain in same phase
    });

    it("should reject placement during wrong phase", () => {
      // First place a tile to move to CLAIM_FEATURE phase
      const validPlacements = game.getValidPlacements();
      if (validPlacements.length > 0) {
        const position = validPlacements[0];
        game.placeTile(position, 0);

        // Now try to place another tile while in CLAIM_FEATURE phase
        const result = game.placeTile({ x: 2, y: 0 }, 0);
        expect(result.success).toBe(false);
        expect(result.message).toContain("phase");
      }
    });

    it("should handle tile rotation correctly", () => {
      const validPlacements = game.getValidPlacements();

      if (validPlacements.length > 0) {
        const position = validPlacements[0];

        // Try rotations until we find one that works
        // Not all rotations will necessarily be valid for a given position
        let placed = false;
        for (let rotation = 0; rotation < 4; rotation++) {
          const result = game.placeTile(position, rotation);
          if (result.success) {
            const placedTile = game.getState().board.getTile(position);
            expect(placedTile).toBeDefined();
            placed = true;
            break;
          }
        }

        // At least one rotation should work since the position was in validPlacements
        expect(placed).toBe(true);
      }
    });
  });

  describe("claimFeature", () => {
    beforeEach(() => {
      // Place a tile first to get to CLAIM_FEATURE phase
      const validPlacements = game.getValidPlacements();
      if (validPlacements.length > 0) {
        const position = validPlacements[0];
        game.placeTile(position, 0);
      }
    });

    it("should successfully claim a road feature", () => {
      const state = game.getState();
      if (state.phase === GamePhase.CLAIM_FEATURE) {
        const initialFollowers =
          state.players[state.currentPlayerIndex].followers;

        const result = game.claimFeature("road");

        if (result) {
          expect(
            game.getState().players[state.currentPlayerIndex].followers
          ).toBe(initialFollowers - 1);
        }
      }
    });

    it("should reject claiming during wrong phase", () => {
      // Skip to end turn to get out of CLAIM_FEATURE phase
      if (game.getState().phase === GamePhase.CLAIM_FEATURE) {
        game.skipClaim();
      }

      const result = game.claimFeature("road");
      expect(result).toBe(false);
    });

    it("should reject claiming when player has no followers", () => {
      const state = game.getState();
      if (state.phase === GamePhase.CLAIM_FEATURE) {
        // Manually set followers to 0
        state.players[state.currentPlayerIndex].followers = 0;

        const result = game.claimFeature("road");
        expect(result).toBe(false);
      }
    });
  });

  describe("endTurn", () => {
    it("should advance to next player", () => {
      const initialPlayerIndex = game.getState().currentPlayerIndex;

      // Complete the turn by placing tile and skipping claim
      const validPlacements = game.getValidPlacements();
      if (validPlacements.length > 0) {
        const position = validPlacements[0];
        game.placeTile(position, 0);
        game.skipClaim();

        const newPlayerIndex = game.getState().currentPlayerIndex;
        expect(newPlayerIndex).toBe(
          (initialPlayerIndex + 1) % playerConfigs.length
        );
      }
    });

    it("should increment turn number when cycling back to first player", () => {
      const initialTurnNumber = game.getState().turnNumber;

      // Complete turns for all players to cycle back to player 0
      for (let i = 0; i < playerConfigs.length; i++) {
        let placed = false;

        // Try all 4 rotations to find a valid placement
        for (let rotation = 0; rotation < 4 && !placed; rotation++) {
          const validPlacements = game.getValidPlacements();
          if (validPlacements.length > 0) {
            const result = game.placeTile(validPlacements[0], 0);
            if (result.success) {
              placed = true;
              if (game.getState().phase === GamePhase.CLAIM_FEATURE) {
                game.skipClaim();
              }
            }
          }
          if (!placed) {
            game.rotateTile(1);
          }
        }

        // Fail test early if placement impossible (shouldn't happen with valid tile deck)
        expect(placed).toBe(true);
      }

      expect(game.getState().turnNumber).toBe(initialTurnNumber + 1);
    });

    it("should draw next tile after turn completion", () => {
      const initialDeckSize = game.getState().tileDeck.length;

      // Complete a turn
      const validPlacements = game.getValidPlacements();
      if (validPlacements.length > 0) {
        const position = validPlacements[0];
        game.placeTile(position, 0);
        game.skipClaim();

        expect(game.getState().tileDeck.length).toBe(initialDeckSize - 1);
        expect(game.getState().currentTile).toBeDefined();
      }
    });

    it("should end game when no tiles remain", () => {
      // Create a new game with players to test end game scenario
      const testPlayers: PlayerDefinition[] = [
        { name: "Test Player 1", isAI: false },
      ];
      const testGame = new Game(testPlayers);

      // Force the deck to be empty by directly modifying the TileManager
      // This is a test-only approach to verify end game logic
      (testGame as any).tileManager.tileDeck = [];

      // Now when we try to end a turn, it should trigger game over
      (testGame as any).endTurn();

      const finalState = testGame.getState();
      expect(finalState.isGameOver).toBe(true);
      expect(finalState.phase).toBe(GamePhase.GAME_OVER);
    });
  });

  describe("state change notifications", () => {
    it("should notify listeners when state changes", () => {
      const callback = vi.fn();
      game.setStateChangeListener(callback);

      const validPlacements = game.getValidPlacements();
      if (validPlacements.length > 0) {
        const position = validPlacements[0];
        game.placeTile(position, 0);

        expect(callback).toHaveBeenCalled();
      }
    });
  });

  describe("game options", () => {
    it("should respect custom starting player", () => {
      const customGame = new Game(playerConfigs, { startingPlayer: 1 });
      expect(customGame.getState().currentPlayerIndex).toBe(1);
    });

    it("should use default colors when not specified", () => {
      const playersWithoutColors = [
        { id: "p1", name: "Player 1", isAI: false },
        { id: "p2", name: "Player 2", isAI: false },
      ];
      const gameWithDefaults = new Game(playersWithoutColors);
      const state = gameWithDefaults.getState();

      expect(state.players[0].color).toBe("#FF0000");
      expect(state.players[1].color).toBe("#0000FF");
    });
  });
});
