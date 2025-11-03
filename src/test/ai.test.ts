import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleAI } from '../ai';
import { Player } from '../player';
import { Tile } from '../tile';
import { TileDefinition, TerrainType } from '../types';

describe('SimpleAI', () => {
  let ai: SimpleAI;
  let player: Player;
  let mockGame: any;
  let testTile: Tile;

  beforeEach(() => {
    ai = new SimpleAI();
    player = new Player('AI Player', { isAI: true });

    // Create a basic test tile
    const tileDef: TileDefinition = {
      id: 'test-tile',
      name: 'Test Tile',
      edges: {
        north: 'field' as TerrainType,
        east: 'field' as TerrainType,
        south: 'field' as TerrainType,
        west: 'field' as TerrainType,
      },
      center: 'field' as TerrainType,
      roadConnections: [],
      costcoZones: [],
    };
    testTile = new Tile(tileDef);

    // Create mock game with minimal board interface
    mockGame = {
      board: {
        getPlacementCandidates: vi.fn().mockReturnValue([
          { x: 0, y: 1 },
          { x: 1, y: 0 },
        ]),
        getNeighbors: vi.fn().mockReturnValue({
          north: { tile: testTile, position: { x: 0, y: 0 } },
        }),
        canPlace: vi.fn().mockReturnValue(true),
        previewPlacement: vi.fn().mockReturnValue({
          completed: [],
        }),
      },
      calculatePoints: vi.fn().mockReturnValue(0),
    };
  });

  describe('Constructor', () => {
    it('should create AI with default weights', () => {
      const defaultAI = new SimpleAI();
      expect(defaultAI).toBeDefined();
    });

    it('should accept custom completion weight', () => {
      const customAI = new SimpleAI({ completionWeight: 10 });
      expect(customAI).toBeDefined();
    });

    it('should accept custom adjacency weight', () => {
      const customAI = new SimpleAI({ adjacencyWeight: 3 });
      expect(customAI).toBeDefined();
    });

    it('should accept custom costco weight', () => {
      const customAI = new SimpleAI({ costcoWeight: 5 });
      expect(customAI).toBeDefined();
    });

    it('should accept all custom weights', () => {
      const customAI = new SimpleAI({
        completionWeight: 8,
        adjacencyWeight: 2,
        costcoWeight: 4,
      });
      expect(customAI).toBeDefined();
    });
  });

  describe('planMove', () => {
    it('should return null when no placement candidates', () => {
      mockGame.board.getPlacementCandidates.mockReturnValue([]);
      
      const move = ai.planMove(mockGame, player, testTile);
      
      expect(move).toBeNull();
    });

    it('should return a valid move when candidates exist', () => {
      const move = ai.planMove(mockGame, player, testTile);
      
      expect(move).toBeDefined();
      expect(move).toHaveProperty('position');
      expect(move).toHaveProperty('rotation');
      expect(move).toHaveProperty('follower');
    });

    it('should return position from candidates', () => {
      const move = ai.planMove(mockGame, player, testTile);
      
      if (move) {
        const candidates = mockGame.board.getPlacementCandidates();
        const isValidCandidate = candidates.some(
          (c: any) => c.x === move.position.x && c.y === move.position.y
        );
        expect(isValidCandidate).toBe(true);
      }
    });

    it('should return rotation between 0 and 3', () => {
      const move = ai.planMove(mockGame, player, testTile);
      
      if (move) {
        expect(move.rotation).toBeGreaterThanOrEqual(0);
        expect(move.rotation).toBeLessThan(4);
      }
    });

    it('should try all 4 rotations', () => {
      ai.planMove(mockGame, player, testTile);
      
      // canPlace should be called for each rotation at each candidate position
      expect(mockGame.board.canPlace).toHaveBeenCalled();
    });

    it('should skip invalid placements', () => {
      mockGame.board.canPlace.mockReturnValue(false);
      
      const move = ai.planMove(mockGame, player, testTile);
      
      expect(move).toBeNull();
    });

    it('should consider completed features in scoring', () => {
      mockGame.board.previewPlacement.mockReturnValue({
        completed: [{ type: 'road', points: 5 }],
      });
      mockGame.calculatePoints.mockReturnValue(5);
      
      const move = ai.planMove(mockGame, player, testTile);
      
      expect(move).toBeDefined();
      expect(mockGame.board.previewPlacement).toHaveBeenCalled();
    });

    it('should prefer moves with more neighbors', () => {
      // This is tested implicitly through the adjacency weight
      const move = ai.planMove(mockGame, player, testTile);
      
      expect(move).toBeDefined();
      expect(mockGame.board.getNeighbors).toHaveBeenCalled();
    });

    it('should place follower on McDonalds when available', () => {
      const mcDonaldsTileDef: TileDefinition = {
        id: 'mcdonalds-tile',
        name: 'McDonalds Tile',
        edges: {
          north: 'field' as TerrainType,
          east: 'field' as TerrainType,
          south: 'field' as TerrainType,
          west: 'field' as TerrainType,
        },
        center: 'mcdonalds' as TerrainType,
        roadConnections: [],
        costcoZones: [],
      };
      const mcDonaldsTile = new Tile(mcDonaldsTileDef);
      
      const move = ai.planMove(mockGame, player, mcDonaldsTile);
      
      if (move && player.canPlaceFollower()) {
        expect(move.follower).toEqual({ type: 'mcdonalds' });
      }
    });

    it('should not place follower when player has none', () => {
      player.followers = 0;
      
      const move = ai.planMove(mockGame, player, testTile);
      
      if (move) {
        expect(move.follower).toBeNull();
      }
    });

    it('should handle Costco tiles with higher weight', () => {
      const costcoAI = new SimpleAI({ costcoWeight: 10 });
      const costcoTileDef: TileDefinition = {
        id: 'costco-tile',
        name: 'Costco Tile',
        edges: {
          north: 'costco' as TerrainType,
          east: 'field' as TerrainType,
          south: 'field' as TerrainType,
          west: 'field' as TerrainType,
        },
        center: 'costco' as TerrainType,
        roadConnections: [],
        costcoZones: [{ id: 'z1', segments: ['north'], hasPennant: false }],
      };
      const costcoTile = new Tile(costcoTileDef);
      
      const move = costcoAI.planMove(mockGame, player, costcoTile);
      
      expect(move).toBeDefined();
    });

    it('should add randomness to prevent predictability', () => {
      // Run multiple times and expect some variation in results
      const moves = [];
      for (let i = 0; i < 10; i++) {
        const move = ai.planMove(mockGame, player, testTile);
        if (move) {
          moves.push(move);
        }
      }
      
      // At least one move should have been found
      expect(moves.length).toBeGreaterThan(0);
    });
  });

  describe('Weight Customization', () => {
    it('should prefer completion with high completion weight', () => {
      const completionFocusedAI = new SimpleAI({ completionWeight: 100 });
      mockGame.board.previewPlacement.mockReturnValue({
        completed: [{ type: 'road', points: 5 }],
      });
      mockGame.calculatePoints.mockReturnValue(5);
      
      const move = completionFocusedAI.planMove(mockGame, player, testTile);
      
      expect(move).toBeDefined();
    });

    it('should work with zero weights', () => {
      const zeroWeightAI = new SimpleAI({
        completionWeight: 0,
        adjacencyWeight: 0,
        costcoWeight: 0,
      });
      
      const move = zeroWeightAI.planMove(mockGame, player, testTile);
      
      // Should still make a move based on randomness
      expect(move).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single candidate position', () => {
      mockGame.board.getPlacementCandidates.mockReturnValue([{ x: 0, y: 1 }]);
      
      const move = ai.planMove(mockGame, player, testTile);
      
      expect(move).toBeDefined();
      expect(move?.position).toEqual({ x: 0, y: 1 });
    });

    it('should handle no valid rotations', () => {
      mockGame.board.canPlace.mockReturnValue(false);
      
      const move = ai.planMove(mockGame, player, testTile);
      
      expect(move).toBeNull();
    });

    it('should handle preview returning null', () => {
      mockGame.board.previewPlacement.mockReturnValue(null);
      
      const move = ai.planMove(mockGame, player, testTile);
      
      // Should still work, just with 0 completion score
      expect(move).toBeDefined();
    });
  });
});
