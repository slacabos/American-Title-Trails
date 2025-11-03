import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreManager } from '../managers/ScoreManager';
import { PlayerState } from '../types';
import { Board } from '../board';

describe('ScoreManager', () => {
  let scoreManager: ScoreManager;
  let players: PlayerState[];

  beforeEach(() => {
    scoreManager = new ScoreManager();
    players = [
      {
        id: 'player-1',
        name: 'Alice',
        isAI: false,
        score: 0,
        followers: 7,
        color: '#ff0000',
      },
      {
        id: 'player-2',
        name: 'Bob',
        isAI: true,
        score: 0,
        followers: 7,
        color: '#0000ff',
      },
    ];
  });

  describe('scoreCompletedFeatures', () => {
    it('should award points to claiming players', () => {
      const completedFeatures = [
        { claimedBy: ['player-1'], points: 5 },
        { claimedBy: ['player-2'], points: 3 },
      ];

      scoreManager.scoreCompletedFeatures(completedFeatures, players);

      expect(players[0].score).toBe(5);
      expect(players[1].score).toBe(3);
    });

    it('should handle multiple features for same player', () => {
      const completedFeatures = [
        { claimedBy: ['player-1'], points: 5 },
        { claimedBy: ['player-1'], points: 3 },
        { claimedBy: ['player-1'], points: 2 },
      ];

      scoreManager.scoreCompletedFeatures(completedFeatures, players);

      expect(players[0].score).toBe(10);
    });

    it('should handle features with no claimants', () => {
      const completedFeatures = [
        { claimedBy: [], points: 5 },
        { claimedBy: undefined, points: 3 },
      ];

      scoreManager.scoreCompletedFeatures(completedFeatures, players);

      expect(players[0].score).toBe(0);
      expect(players[1].score).toBe(0);
    });

    it('should handle empty completed features array', () => {
      scoreManager.scoreCompletedFeatures([], players);

      expect(players[0].score).toBe(0);
      expect(players[1].score).toBe(0);
    });

    it('should handle features claimed by non-existent players gracefully', () => {
      const completedFeatures = [
        { claimedBy: ['non-existent-player'], points: 5 },
      ];

      scoreManager.scoreCompletedFeatures(completedFeatures, players);

      // Scores should remain unchanged
      expect(players[0].score).toBe(0);
      expect(players[1].score).toBe(0);
    });

    it('should add to existing scores', () => {
      players[0].score = 10;
      players[1].score = 5;

      const completedFeatures = [
        { claimedBy: ['player-1'], points: 3 },
        { claimedBy: ['player-2'], points: 7 },
      ];

      scoreManager.scoreCompletedFeatures(completedFeatures, players);

      expect(players[0].score).toBe(13);
      expect(players[1].score).toBe(12);
    });
  });

  describe('determineWinner', () => {
    it('should return single winner with highest score', () => {
      players[0].score = 25;
      players[1].score = 15;

      const winner = scoreManager.determineWinner(players);

      expect(winner).toBe('Alice');
    });

    it('should handle tie with multiple winners', () => {
      players[0].score = 20;
      players[1].score = 20;

      const winner = scoreManager.determineWinner(players);

      expect(winner).toBe('Alice, Bob (tie)');
    });

    it('should handle all players with zero score', () => {
      const winner = scoreManager.determineWinner(players);

      expect(winner).toBe('Alice, Bob (tie)');
    });

    it('should work with more than 2 players', () => {
      const threePlayers: PlayerState[] = [
        ...players,
        {
          id: 'player-3',
          name: 'Charlie',
          isAI: false,
          score: 30,
          followers: 7,
          color: '#00ff00',
        },
      ];

      threePlayers[0].score = 20;
      threePlayers[1].score = 15;
      threePlayers[2].score = 30;

      const winner = scoreManager.determineWinner(threePlayers);

      expect(winner).toBe('Charlie');
    });

    it('should handle three-way tie', () => {
      const threePlayers: PlayerState[] = [
        ...players,
        {
          id: 'player-3',
          name: 'Charlie',
          isAI: false,
          score: 25,
          followers: 7,
          color: '#00ff00',
        },
      ];

      threePlayers[0].score = 25;
      threePlayers[1].score = 25;
      threePlayers[2].score = 25;

      const winner = scoreManager.determineWinner(threePlayers);

      expect(winner).toBe('Alice, Bob, Charlie (tie)');
    });
  });

  describe('calculateFeaturePoints', () => {
    it('should calculate completed road points', () => {
      const points = scoreManager.calculateFeaturePoints('road', 3, false, true);

      expect(points).toBe(3); // 1 point per tile
    });

    it('should calculate incomplete road points', () => {
      const points = scoreManager.calculateFeaturePoints('road', 4, false, false);

      expect(points).toBe(2); // Half points when incomplete
    });

    it('should calculate completed Costco without pennant', () => {
      const points = scoreManager.calculateFeaturePoints('costco', 3, false, true);

      expect(points).toBe(6); // 2 points per tile when complete
    });

    it('should calculate completed Costco with pennant', () => {
      const points = scoreManager.calculateFeaturePoints('costco', 3, true, true);

      expect(points).toBe(8); // 2 per tile + 2 for pennant
    });

    it('should calculate incomplete Costco without pennant', () => {
      const points = scoreManager.calculateFeaturePoints('costco', 3, false, false);

      expect(points).toBe(3); // 1 point per tile when incomplete
    });

    it('should calculate incomplete Costco with pennant', () => {
      const points = scoreManager.calculateFeaturePoints('costco', 3, true, false);

      expect(points).toBe(4); // 1 per tile + 1 for pennant
    });

    it('should calculate completed McDonalds', () => {
      const points = scoreManager.calculateFeaturePoints('mcdonalds', 1, false, true);

      expect(points).toBe(9); // Fixed 9 points when complete
    });

    it('should give zero points for incomplete McDonalds', () => {
      const points = scoreManager.calculateFeaturePoints('mcdonalds', 1, false, false);

      expect(points).toBe(0); // No points unless complete
    });

    it('should give zero points for fields', () => {
      const points = scoreManager.calculateFeaturePoints('field', 5, false, true);

      expect(points).toBe(0); // Fields scored separately
    });

    it('should give zero points for unknown feature types', () => {
      const points = scoreManager.calculateFeaturePoints('unknown', 5, false, true);

      expect(points).toBe(0);
    });
  });

  describe('calculateFinalScores', () => {
    it('should calculate final scores for incomplete features', () => {
      const board = new Board();

      // Mock getFeatureClaims to return some incomplete features
      board.getFeatureClaims = () => [
        { edge: 'north', type: 'costco', players: ['player-1'] },
        { edge: 'south', type: 'road', players: ['player-2'] },
      ];

      scoreManager.calculateFinalScores(board, players);

      // Simplified scoring: costco gets 2, road gets 1
      expect(players[0].score).toBe(2);
      expect(players[1].score).toBe(1);
    });

    it('should handle board with no claims', () => {
      const board = new Board();

      board.getFeatureClaims = () => [];

      scoreManager.calculateFinalScores(board, players);

      expect(players[0].score).toBe(0);
      expect(players[1].score).toBe(0);
    });

    it('should not affect players not in claims', () => {
      const board = new Board();

      board.getFeatureClaims = () => [
        { edge: 'north', type: 'costco', players: ['player-1'] },
      ];

      scoreManager.calculateFinalScores(board, players);

      expect(players[0].score).toBe(2);
      expect(players[1].score).toBe(0); // No change
    });
  });
});
