import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../player';

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player('Test Player');
  });

  describe('Constructor', () => {
    it('should create a player with default values', () => {
      expect(player.name).toBe('Test Player');
      expect(player.followers).toBe(7);
      expect(player.score).toBe(0);
      expect(player.isAI).toBe(false);
      expect(player.color).toBe(null);
    });

    it('should generate ID from name by default', () => {
      const player1 = new Player('John Doe');
      expect(player1.id).toBe('john-doe');

      const player2 = new Player('Alice  Smith');
      expect(player2.id).toBe('alice-smith');
    });

    it('should accept custom ID in options', () => {
      const customPlayer = new Player('Test', { id: 'custom-id' });
      expect(customPlayer.id).toBe('custom-id');
    });

    it('should accept custom follower count', () => {
      const customPlayer = new Player('Test', { followers: 5 });
      expect(customPlayer.followers).toBe(5);
    });

    it('should mark player as AI when specified', () => {
      const aiPlayer = new Player('AI Bot', { isAI: true });
      expect(aiPlayer.isAI).toBe(true);
    });

    it('should accept custom color', () => {
      const coloredPlayer = new Player('Test', { color: '#FF0000' });
      expect(coloredPlayer.color).toBe('#FF0000');
    });

    it('should handle all options together', () => {
      const fullPlayer = new Player('Full Player', {
        id: 'full-id',
        followers: 10,
        isAI: true,
        color: '#00FF00',
      });
      expect(fullPlayer.id).toBe('full-id');
      expect(fullPlayer.followers).toBe(10);
      expect(fullPlayer.isAI).toBe(true);
      expect(fullPlayer.color).toBe('#00FF00');
    });
  });

  describe('canPlaceFollower', () => {
    it('should return true when player has followers', () => {
      expect(player.canPlaceFollower()).toBe(true);
    });

    it('should return false when player has no followers', () => {
      player.followers = 0;
      expect(player.canPlaceFollower()).toBe(false);
    });

    it('should return true when player has exactly 1 follower', () => {
      player.followers = 1;
      expect(player.canPlaceFollower()).toBe(true);
    });
  });

  describe('useFollower', () => {
    it('should decrease follower count by 1', () => {
      const initialCount = player.followers;
      player.useFollower();
      expect(player.followers).toBe(initialCount - 1);
    });

    it('should work multiple times', () => {
      player.useFollower();
      player.useFollower();
      expect(player.followers).toBe(5);
    });

    it('should throw error when no followers available', () => {
      player.followers = 0;
      expect(() => player.useFollower()).toThrow(
        'Test Player has no followers left to place.'
      );
    });

    it('should not decrease followers if error is thrown', () => {
      player.followers = 0;
      try {
        player.useFollower();
      } catch (e) {
        // Expected error
      }
      expect(player.followers).toBe(0);
    });
  });

  describe('returnFollower', () => {
    it('should increase follower count by 1 by default', () => {
      player.followers = 3;
      player.returnFollower();
      expect(player.followers).toBe(4);
    });

    it('should return multiple followers when count is specified', () => {
      player.followers = 2;
      player.returnFollower(3);
      expect(player.followers).toBe(5);
    });

    it('should handle returning all used followers', () => {
      player.useFollower();
      player.useFollower();
      player.returnFollower(2);
      expect(player.followers).toBe(7);
    });

    it('should allow followers to exceed initial count', () => {
      // This could happen in special game situations
      player.returnFollower(5);
      expect(player.followers).toBe(12);
    });
  });

  describe('addScore', () => {
    it('should increase score by given points', () => {
      player.addScore(10);
      expect(player.score).toBe(10);
    });

    it('should accumulate multiple scores', () => {
      player.addScore(5);
      player.addScore(3);
      player.addScore(7);
      expect(player.score).toBe(15);
    });

    it('should handle zero points', () => {
      player.addScore(0);
      expect(player.score).toBe(0);
    });

    it('should handle negative points (penalties)', () => {
      player.addScore(10);
      player.addScore(-3);
      expect(player.score).toBe(7);
    });

    it('should handle large point values', () => {
      player.addScore(1000);
      expect(player.score).toBe(1000);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical game turn', () => {
      // Place a follower
      expect(player.canPlaceFollower()).toBe(true);
      player.useFollower();
      expect(player.followers).toBe(6);

      // Score some points
      player.addScore(5);
      expect(player.score).toBe(5);

      // Get follower back
      player.returnFollower();
      expect(player.followers).toBe(7);
    });

    it('should handle running out of followers', () => {
      // Use all followers
      for (let i = 0; i < 7; i++) {
        player.useFollower();
      }
      expect(player.followers).toBe(0);
      expect(player.canPlaceFollower()).toBe(false);

      // Try to use another
      expect(() => player.useFollower()).toThrow();

      // Return one and try again
      player.returnFollower();
      expect(player.canPlaceFollower()).toBe(true);
    });

    it('should maintain state across multiple actions', () => {
      player.useFollower(); // 6 left
      player.addScore(2); // 2 points
      player.useFollower(); // 5 left
      player.addScore(3); // 5 points
      player.returnFollower(1); // 6 left
      player.addScore(10); // 15 points

      expect(player.followers).toBe(6);
      expect(player.score).toBe(15);
    });
  });
});
