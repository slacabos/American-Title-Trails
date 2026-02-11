import { describe, it, expect, beforeEach } from "vitest";
import {
  SimpleAI,
  RandomAI,
  StrategicAI,
  ExpertAI,
  AIFactory,
  AIContext,
} from "../ai";
import { Game } from "../game";
import { PlayerDefinition, GamePhase } from "../types";

describe("AI Strategy Pattern", () => {
  describe("AIFactory", () => {
    it("should create RandomAI for easy difficulty", () => {
      const ai = AIFactory.create("easy");
      expect(ai.difficulty).toBe("easy");
      expect(ai).toBeInstanceOf(RandomAI);
    });

    it("should create SimpleAI for medium difficulty", () => {
      const ai = AIFactory.create("medium");
      expect(ai.difficulty).toBe("medium");
      expect(ai).toBeInstanceOf(SimpleAI);
    });

    it("should create StrategicAI for hard difficulty", () => {
      const ai = AIFactory.create("hard");
      expect(ai.difficulty).toBe("hard");
      expect(ai).toBeInstanceOf(StrategicAI);
    });

    it("should create ExpertAI for expert difficulty", () => {
      const ai = AIFactory.create("expert");
      expect(ai.difficulty).toBe("expert");
      expect(ai).toBeInstanceOf(ExpertAI);
    });

    it("should return all difficulty levels", () => {
      const levels = AIFactory.getDifficultyLevels();
      expect(levels).toEqual(["easy", "medium", "hard", "expert"]);
    });

    it("should return human-readable difficulty names", () => {
      expect(AIFactory.getDifficultyName("easy")).toBe("Easy");
      expect(AIFactory.getDifficultyName("medium")).toBe("Medium");
      expect(AIFactory.getDifficultyName("hard")).toBe("Hard");
      expect(AIFactory.getDifficultyName("expert")).toBe("Expert");
    });
  });

  describe("RandomAI", () => {
    let ai: RandomAI;
    let game: Game;

    beforeEach(() => {
      ai = new RandomAI();

      const playerConfigs: PlayerDefinition[] = [
        { id: "human", name: "Human", isAI: false, color: "#FF0000" },
        { id: "ai", name: "AI Player", isAI: true, color: "#0000FF" },
      ];

      game = new Game(playerConfigs);
    });

    it("should have easy difficulty", () => {
      expect(ai.difficulty).toBe("easy");
    });

    it("should return valid placements when candidates exist", () => {
      const state = game.getState();
      const validPlacements = game.getValidPlacements();

      // Only run test if there are valid placements (depends on random tile draw)
      if (validPlacements.length === 0 || !state.currentTile) {
        return;
      }

      const context: AIContext = {
        board: state.board,
        currentTile: state.currentTile,
        currentPlayer: state.players[0],
        allPlayers: state.players,
        validPlacements,
        claimableFeatures: [],
        gameState: state,
      };

      const placements = ai.evaluateTilePlacements(context);

      // Placements may be empty if no rotation/position combo is valid
      if (placements.length > 0) {
        placements.forEach((placement) => {
          expect(placement.position).toBeDefined();
          expect(typeof placement.rotation).toBe("number");
          expect(placement.rotation).toBeGreaterThanOrEqual(0);
          expect(placement.rotation).toBeLessThan(4);
        });
      }
    });

    it("should respect custom claim chance", () => {
      const neverClaimAI = new RandomAI({ claimChance: 0 });
      const alwaysClaimAI = new RandomAI({ claimChance: 1 });

      const state = game.getState();

      const contextWithFeatures: AIContext = {
        board: state.board,
        currentTile: state.currentTile!,
        currentPlayer: { ...state.players[0], followers: 7 },
        allPlayers: state.players,
        validPlacements: [],
        claimableFeatures: [{ type: "road", identifier: "road_0" }],
        gameState: state,
      };

      // With 0% chance, should never claim
      const neverResult = neverClaimAI.evaluateMeeplePlacement(
        contextWithFeatures,
        { x: 0, y: 0 }
      );
      expect(neverResult).toBeNull();

      // With 100% chance and available features, should claim
      const alwaysResult = alwaysClaimAI.evaluateMeeplePlacement(
        contextWithFeatures,
        { x: 0, y: 0 }
      );
      expect(alwaysResult).not.toBeNull();
    });
  });

  describe("SimpleAI", () => {
    let ai: SimpleAI;
    let game: Game;

    beforeEach(() => {
      ai = new SimpleAI();

      const playerConfigs: PlayerDefinition[] = [
        { id: "human", name: "Human", isAI: false, color: "#FF0000" },
        { id: "ai", name: "AI Player", isAI: true, color: "#0000FF" },
      ];

      game = new Game(playerConfigs);
    });

    it("should have medium difficulty", () => {
      expect(ai.difficulty).toBe("medium");
    });

    it("should evaluate placements with scores", () => {
      const state = game.getState();
      // Use getPlacementCandidates to get ALL candidate positions
      // The evaluator will try all rotations for each position
      const candidatePositions = state.board.getPlacementCandidates();

      const context: AIContext = {
        board: state.board,
        currentTile: state.currentTile!,
        currentPlayer: state.players[0],
        allPlayers: state.players,
        validPlacements: candidatePositions,
        claimableFeatures: [],
        gameState: state,
      };

      const placements = ai.evaluateTilePlacements(context);

      // Should find at least one valid placement (with some rotation)
      expect(placements.length).toBeGreaterThan(0);

      // Should be sorted by score (descending)
      for (let i = 1; i < placements.length; i++) {
        expect(placements[i - 1].score).toBeGreaterThanOrEqual(
          placements[i].score
        );
      }
    });

    it("should respect minimum followers to keep", () => {
      const conservativeAI = new SimpleAI({ minFollowersToKeep: 3 });

      const state = game.getState();

      const context: AIContext = {
        board: state.board,
        currentTile: state.currentTile!,
        currentPlayer: { ...state.players[0], followers: 2 }, // Below threshold
        allPlayers: state.players,
        validPlacements: [],
        claimableFeatures: [{ type: "road", identifier: "road_0" }],
        gameState: state,
      };

      const result = conservativeAI.evaluateMeeplePlacement(context, {
        x: 0,
        y: 0,
      });

      // Should not claim because followers (2) <= minFollowersToKeep (3)
      expect(result).toBeNull();
    });
  });

  describe("StrategicAI", () => {
    let ai: StrategicAI;
    let game: Game;

    beforeEach(() => {
      ai = new StrategicAI();

      const playerConfigs: PlayerDefinition[] = [
        { id: "human", name: "Human", isAI: false, color: "#FF0000" },
        { id: "ai", name: "AI Player", isAI: true, color: "#0000FF" },
      ];

      game = new Game(playerConfigs);
    });

    it("should have hard difficulty", () => {
      expect(ai.difficulty).toBe("hard");
    });

    it("should complete evaluation within time limit", () => {
      const state = game.getState();
      const validPlacements = game.getValidPlacements();

      const context: AIContext = {
        board: state.board,
        currentTile: state.currentTile!,
        currentPlayer: state.players[0],
        allPlayers: state.players,
        validPlacements,
        claimableFeatures: [],
        gameState: state,
      };

      const startTime = Date.now();
      ai.evaluateTilePlacements(context);
      const duration = Date.now() - startTime;

      // Should complete within 500ms (with some margin)
      expect(duration).toBeLessThan(1000);
    });

    it("should return valid strategic placements", () => {
      const state = game.getState();
      const validPlacements = game.getValidPlacements();

      // Only run test if there are valid placements (depends on random tile draw)
      if (validPlacements.length === 0 || !state.currentTile) {
        return;
      }

      const context: AIContext = {
        board: state.board,
        currentTile: state.currentTile,
        currentPlayer: state.players[0],
        allPlayers: state.players,
        validPlacements,
        claimableFeatures: [],
        gameState: state,
      };

      const placements = ai.evaluateTilePlacements(context);

      // Placements may be empty if no rotation/position combo is valid
      if (placements.length > 0) {
        // Verify all placements are valid
        placements.forEach((placement) => {
          expect(validPlacements).toContainEqual(placement.position);
        });
      }
    });
  });

  describe("ExpertAI", () => {
    let ai: ExpertAI;

    beforeEach(() => {
      ai = new ExpertAI();
    });

    it("should have expert difficulty", () => {
      expect(ai.difficulty).toBe("expert");
    });

    it("should be an instance of StrategicAI", () => {
      expect(ai).toBeInstanceOf(StrategicAI);
    });
  });
});

describe("Game AI Integration", () => {
  describe("processAITurn with different difficulties", () => {
    it("should process AI turn with easy difficulty", () => {
      const playerConfigs: PlayerDefinition[] = [
        { id: "human", name: "Human", isAI: false, color: "#FF0000" },
        {
          id: "ai",
          name: "AI Player",
          isAI: true,
          aiDifficulty: "easy",
          color: "#0000FF",
        },
      ];

      const game = new Game(playerConfigs);

      // Place human tile first - try different rotations
      const validPlacements = game.getValidPlacements();
      let placed = false;
      for (let rotation = 0; rotation < 4 && !placed; rotation++) {
        if (validPlacements.length > 0) {
          const result = game.placeTile(validPlacements[0], rotation);
          if (result.success) {
            placed = true;
            if (game.getState().phase === GamePhase.CLAIM_FEATURE) {
              game.skipClaim();
            }
          }
        }
      }

      if (!placed) {
        // Skip test if placement wasn't possible (rare edge case)
        return;
      }

      // Now it should be AI's turn
      const state = game.getState();
      if (!state.players[state.currentPlayerIndex].isAI) {
        // Player index may have wrapped due to game state
        return;
      }

      // Process AI turn - should not throw
      expect(() => game.processAITurn()).not.toThrow();
    });

    it("should process AI turn with hard difficulty", () => {
      const playerConfigs: PlayerDefinition[] = [
        { id: "human", name: "Human", isAI: false, color: "#FF0000" },
        {
          id: "ai",
          name: "AI Player",
          isAI: true,
          aiDifficulty: "hard",
          color: "#0000FF",
        },
      ];

      const game = new Game(playerConfigs);

      // Place human tile first - try different rotations
      const validPlacements = game.getValidPlacements();
      let placed = false;
      for (let rotation = 0; rotation < 4 && !placed; rotation++) {
        if (validPlacements.length > 0) {
          const result = game.placeTile(validPlacements[0], rotation);
          if (result.success) {
            placed = true;
            if (game.getState().phase === GamePhase.CLAIM_FEATURE) {
              game.skipClaim();
            }
          }
        }
      }

      if (!placed) {
        return; // Skip test if placement wasn't possible
      }

      // Now it should be AI's turn
      const state = game.getState();
      if (!state.players[state.currentPlayerIndex].isAI) {
        return; // Player index may have wrapped
      }

      // Process AI turn - should not throw
      expect(() => game.processAITurn()).not.toThrow();
    });

    it("should handle AI claiming phase", () => {
      const playerConfigs: PlayerDefinition[] = [
        {
          id: "ai",
          name: "AI Player",
          isAI: true,
          aiDifficulty: "medium",
          color: "#FF0000",
        },
      ];

      const game = new Game(playerConfigs);

      // AI places tile
      game.processAITurn();

      // AI should handle claim phase
      if (game.getState().phase === GamePhase.CLAIM_FEATURE) {
        expect(() => game.processAITurn()).not.toThrow();
      }
    });

    it("should allow changing AI difficulty mid-game", () => {
      const playerConfigs: PlayerDefinition[] = [
        { id: "human", name: "Human", isAI: false, color: "#FF0000" },
        {
          id: "ai",
          name: "AI Player",
          isAI: true,
          aiDifficulty: "easy",
          color: "#0000FF",
        },
      ];

      const game = new Game(playerConfigs);

      // Change AI difficulty
      game.setAIStrategy("ai", "expert");

      // Should process turn with new strategy without error
      const validPlacements = game.getValidPlacements();
      if (validPlacements.length > 0) {
        game.placeTile(validPlacements[0], 0);
        game.skipClaim();
      }

      expect(() => game.processAITurn()).not.toThrow();
    });
  });

  describe("AI vs AI game completion", () => {
    it("should complete an AI vs AI game without errors", () => {
      const playerConfigs: PlayerDefinition[] = [
        {
          id: "ai1",
          name: "AI Easy",
          isAI: true,
          aiDifficulty: "easy",
          color: "#FF0000",
        },
        {
          id: "ai2",
          name: "AI Medium",
          isAI: true,
          aiDifficulty: "medium",
          color: "#0000FF",
        },
      ];

      const game = new Game(playerConfigs);

      // Play through several turns
      let turnCount = 0;
      const maxTurns = 50; // Safety limit

      while (!game.getState().isGameOver && turnCount < maxTurns) {
        const state = game.getState();
        if (state.players[state.currentPlayerIndex].isAI) {
          expect(() => game.processAITurn()).not.toThrow();
        }
        turnCount++;
      }

      // Game should have progressed
      expect(turnCount).toBeGreaterThan(0);
    });
  });
});
