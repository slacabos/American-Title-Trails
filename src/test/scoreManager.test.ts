import { describe, it, expect } from "vitest";
import { ScoreManager } from "../managers/ScoreManager";
import { PlayerState, CompletedFeature, TerrainType } from "../types";

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
});
