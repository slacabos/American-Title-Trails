import { describe, it, expect } from "vitest";
import { ScoreManager } from "../managers/ScoreManager";
import {
  PlayerState,
  CompletedFeature,
  TerrainType,
  ScoreBreakdown,
} from "../types";
import { GAME_RULES } from "../constants/gameRules";

// Test helpers
const createPlayer = (id: string, name: string, score = 0): PlayerState => ({
  id,
  name,
  isAI: false,
  score,
  followers: 7,
  color: "#FF0000",
});

const createCompletedFeature = (
  type: TerrainType,
  points: number,
  claimedBy: string[] = []
): CompletedFeature => ({
  type,
  tiles: new Set(["0,0"]),
  edges: new Set(["0,0:north"]),
  isComplete: true,
  points,
  claimedBy,
});

const createScoreBreakdown = (playerIds: string[]): ScoreBreakdown => {
  const breakdown: ScoreBreakdown = {};
  playerIds.forEach((id) => {
    breakdown[id] = {
      completed_road: 0,
      completed_costco: 0,
      completed_mcdonalds: 0,
      incomplete_costco: 0,
      incomplete_road: 0,
      incomplete_mcdonalds: 0,
      farmers: 0,
    };
  });
  return breakdown;
};

describe("ScoreManager", () => {
  describe("scoreCompletedFeatures", () => {
    describe("single claimant", () => {
      it("should award all points to the only claimant", () => {
        const scoreManager = new ScoreManager();
        const players = [createPlayer("p1", "Alice"), createPlayer("p2", "Bob")];
        const features = [createCompletedFeature("costco", 10, ["p1"])];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(10);
        expect(players[1].score).toBe(0);
      });

      it("should award points once for multiple followers from same player", () => {
        const scoreManager = new ScoreManager();
        const players = [createPlayer("p1", "Alice"), createPlayer("p2", "Bob")];
        // Same player has 2 followers on the feature
        const features = [createCompletedFeature("costco", 10, ["p1", "p1"])];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(10);
        expect(players[1].score).toBe(0);
      });
    });

    describe("majority rule", () => {
      it("should award points only to player with most followers", () => {
        const scoreManager = new ScoreManager();
        const players = [createPlayer("p1", "Alice"), createPlayer("p2", "Bob")];
        // p1 has 2 followers, p2 has 1 follower
        const features = [createCompletedFeature("costco", 12, ["p1", "p1", "p2"])];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(12);
        expect(players[1].score).toBe(0);
      });

      it("should not award points to minority holders", () => {
        const scoreManager = new ScoreManager();
        const players = [
          createPlayer("p1", "Alice"),
          createPlayer("p2", "Bob"),
          createPlayer("p3", "Charlie"),
        ];
        // p1 has 3 followers, p2 has 1, p3 has 1
        const features = [
          createCompletedFeature("costco", 15, ["p1", "p1", "p1", "p2", "p3"]),
        ];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(15);
        expect(players[1].score).toBe(0);
        expect(players[2].score).toBe(0);
      });
    });

    describe("tie handling", () => {
      it("should award full points to all tied players (2-way tie)", () => {
        const scoreManager = new ScoreManager();
        const players = [createPlayer("p1", "Alice"), createPlayer("p2", "Bob")];
        // Both players have 1 follower each
        const features = [createCompletedFeature("costco", 10, ["p1", "p2"])];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(10);
        expect(players[1].score).toBe(10);
      });

      it("should award full points to all tied players (3-way tie)", () => {
        const scoreManager = new ScoreManager();
        const players = [
          createPlayer("p1", "Alice"),
          createPlayer("p2", "Bob"),
          createPlayer("p3", "Charlie"),
        ];
        // All players have 1 follower each
        const features = [createCompletedFeature("costco", 8, ["p1", "p2", "p3"])];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(8);
        expect(players[1].score).toBe(8);
        expect(players[2].score).toBe(8);
      });

      it("should award full points to tied majority holders only", () => {
        const scoreManager = new ScoreManager();
        const players = [
          createPlayer("p1", "Alice"),
          createPlayer("p2", "Bob"),
          createPlayer("p3", "Charlie"),
        ];
        // p1 and p2 have 2 followers each, p3 has 1
        const features = [
          createCompletedFeature("costco", 10, ["p1", "p1", "p2", "p2", "p3"]),
        ];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(10);
        expect(players[1].score).toBe(10);
        expect(players[2].score).toBe(0);
      });
    });

    describe("no claimants", () => {
      it("should not award points when claimedBy is empty", () => {
        const scoreManager = new ScoreManager();
        const players = [createPlayer("p1", "Alice"), createPlayer("p2", "Bob")];
        const features = [createCompletedFeature("costco", 10, [])];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(0);
        expect(players[1].score).toBe(0);
      });

      it("should not award points when claimedBy is undefined", () => {
        const scoreManager = new ScoreManager();
        const players = [createPlayer("p1", "Alice"), createPlayer("p2", "Bob")];
        const features: CompletedFeature[] = [
          {
            type: "costco",
            tiles: new Set(["0,0"]),
            edges: new Set(["0,0:north"]),
            isComplete: true,
            points: 10,
            claimedBy: undefined,
          },
        ];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(0);
        expect(players[1].score).toBe(0);
      });
    });

    describe("edge cases", () => {
      it("should handle unknown player ID gracefully", () => {
        const scoreManager = new ScoreManager();
        const players = [createPlayer("p1", "Alice")];
        // "unknown" is not a valid player ID
        const features = [createCompletedFeature("costco", 10, ["unknown"])];

        // Should not throw
        expect(() => {
          scoreManager.scoreCompletedFeatures(features, players);
        }).not.toThrow();

        expect(players[0].score).toBe(0);
      });

      it("should preserve existing player scores", () => {
        const scoreManager = new ScoreManager();
        const players = [
          createPlayer("p1", "Alice", 25),
          createPlayer("p2", "Bob", 15),
        ];
        const features = [createCompletedFeature("costco", 10, ["p1"])];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(35);
        expect(players[1].score).toBe(15);
      });

      it("should score multiple features correctly", () => {
        const scoreManager = new ScoreManager();
        const players = [createPlayer("p1", "Alice"), createPlayer("p2", "Bob")];
        const features = [
          createCompletedFeature("costco", 10, ["p1"]),
          createCompletedFeature("road", 5, ["p2"]),
          createCompletedFeature("costco", 8, ["p1", "p2"]), // Tie - both get 8
        ];

        scoreManager.scoreCompletedFeatures(features, players);

        expect(players[0].score).toBe(10 + 8); // First feature + tie
        expect(players[1].score).toBe(5 + 8); // Second feature + tie
      });
    });
  });

  describe("score breakdown tracking", () => {
    it("should track completed feature categories", () => {
      const scoreManager = new ScoreManager();
      const players = [createPlayer("p1", "Alice"), createPlayer("p2", "Bob")];
      const breakdown = createScoreBreakdown(["p1", "p2"]);
      const features = [
        createCompletedFeature("costco", 10, ["p1"]),
        createCompletedFeature("road", 5, ["p2"]),
        createCompletedFeature("mcdonalds", 9, ["p1"]),
      ];

      scoreManager.scoreCompletedFeatures(features, players, breakdown);

      expect(breakdown.p1.completed_costco).toBe(10);
      expect(breakdown.p1.completed_mcdonalds).toBe(9);
      expect(breakdown.p2.completed_road).toBe(5);
    });

    it("should track final scoring categories", () => {
      const scoreManager = new ScoreManager();
      const players = [createPlayer("p1", "Alice"), createPlayer("p2", "Bob")];
      const breakdown = createScoreBreakdown(["p1", "p2"]);

      const board = {
        getFeatureClaims: () => [
          { edge: "0,0:north", type: "road", players: ["p1"] },
          { edge: "1,1", type: "mcdonalds", players: ["p2"] },
          { edge: "0,0:nw", type: "field", players: ["p1"], followerType: "farmer" },
        ],
        getAllTiles: () => new Map(),
        getTile: () => ({
          tile: {
            fieldSegments: [{ corners: ["nw"] }],
          },
        }),
        traceFieldFeature: () => ({
          type: "field",
          tiles: new Set(["0,0"]),
          edges: new Set(["0,0:nw"]),
          isComplete: false,
        }),
        findAdjacentCostcos: () => new Set(["c1", "c2"]),
        getFeatureClaimants: () => ["p1"],
      } as unknown as any;

      scoreManager.calculateFinalScores(players, board, breakdown);

      expect(breakdown.p1.incomplete_road).toBe(
        GAME_RULES.COSTCO_POINTS_PER_TILE_INCOMPLETE
      );
      expect(breakdown.p2.incomplete_mcdonalds).toBe(
        GAME_RULES.COSTCO_POINTS_PER_TILE_INCOMPLETE
      );
      expect(breakdown.p1.farmers).toBe(
        2 * GAME_RULES.FARMER_POINTS_PER_COSTCO
      );
    });
  });
});
