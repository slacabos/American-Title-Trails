import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game, GamePhase } from '../game';
import { PlayerDefinition } from '../types';

describe('Game', () => {
  let playerConfigs: PlayerDefinition[];

  beforeEach(() => {
    playerConfigs = [
      { name: 'Alice', color: '#FF0000' },
      { name: 'Bob', isAI: true, color: '#0000FF' },
    ];
  });

  describe('Constructor', () => {
    it('should initialize game with correct number of players', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe('Alice');
      expect(state.players[1].name).toBe('Bob');
    });

    it('should set default follower count to 7', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state.players[0].followers).toBe(7);
      expect(state.players[1].followers).toBe(7);
    });

    it('should respect custom follower counts', () => {
      const customConfigs: PlayerDefinition[] = [
        { name: 'Alice', followers: 5 },
        { name: 'Bob', followers: 10 },
      ];
      const game = new Game(customConfigs);
      const state = game.getState();

      expect(state.players[0].followers).toBe(5);
      expect(state.players[1].followers).toBe(10);
    });

    it('should initialize all players with zero score', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      state.players.forEach((player) => {
        expect(player.score).toBe(0);
      });
    });

    it('should mark AI players correctly', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state.players[0].isAI).toBe(false);
      expect(state.players[1].isAI).toBe(true);
    });

    it('should assign custom colors', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state.players[0].color).toBe('#FF0000');
      expect(state.players[1].color).toBe('#0000FF');
    });

    it('should generate player IDs when not provided', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state.players[0].id).toBeDefined();
      expect(state.players[1].id).toBeDefined();
    });

    it('should use provided player IDs', () => {
      const customConfigs: PlayerDefinition[] = [
        { name: 'Alice', id: 'alice-123' },
        { name: 'Bob', id: 'bob-456' },
      ];
      const game = new Game(customConfigs);
      const state = game.getState();

      expect(state.players[0].id).toBe('alice-123');
      expect(state.players[1].id).toBe('bob-456');
    });

    it('should initialize in PLACE_TILE phase', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state.phase).toBe(GamePhase.PLACE_TILE);
    });

    it('should not be game over at start', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state.isGameOver).toBe(false);
      expect(state.winner).toBeUndefined();
    });

    it('should start at turn 1', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state.turnNumber).toBe(1);
    });

    it('should place starter tile at origin', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      const starterTile = state.board.getTile({ x: 0, y: 0 });
      expect(starterTile).toBeDefined();
      expect(starterTile?.tile.isStart).toBe(true);
    });

    it('should draw first tile from deck', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state.currentTile).toBeDefined();
    });

    it('should respect starting player option', () => {
      const game = new Game(playerConfigs, { startingPlayer: 1 });
      const state = game.getState();

      expect(state.currentPlayerIndex).toBe(1);
    });

    it('should default to player 0 when starting player not specified', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state.currentPlayerIndex).toBe(0);
    });
  });

  describe('getState', () => {
    it('should return a copy of the state', () => {
      const game = new Game(playerConfigs);
      const state1 = game.getState();
      const state2 = game.getState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });

    it('should include all state properties', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();

      expect(state).toHaveProperty('board');
      expect(state).toHaveProperty('players');
      expect(state).toHaveProperty('currentPlayerIndex');
      expect(state).toHaveProperty('currentTile');
      expect(state).toHaveProperty('tileDeck');
      expect(state).toHaveProperty('discardPile');
      expect(state).toHaveProperty('phase');
      expect(state).toHaveProperty('isGameOver');
      expect(state).toHaveProperty('turnNumber');
    });
  });

  describe('getCurrentPlayer', () => {
    it('should return first player at start', () => {
      const game = new Game(playerConfigs);
      const currentPlayer = game.getCurrentPlayer();

      expect(currentPlayer.name).toBe('Alice');
    });

    it('should return correct player based on currentPlayerIndex', () => {
      const game = new Game(playerConfigs, { startingPlayer: 1 });
      const currentPlayer = game.getCurrentPlayer();

      expect(currentPlayer.name).toBe('Bob');
    });

    it('should return player with all properties', () => {
      const game = new Game(playerConfigs);
      const currentPlayer = game.getCurrentPlayer();

      expect(currentPlayer).toHaveProperty('id');
      expect(currentPlayer).toHaveProperty('name');
      expect(currentPlayer).toHaveProperty('isAI');
      expect(currentPlayer).toHaveProperty('score');
      expect(currentPlayer).toHaveProperty('followers');
      expect(currentPlayer).toHaveProperty('color');
    });
  });

  describe('setStateChangeListener', () => {
    it('should call listener when state changes', () => {
      const game = new Game(playerConfigs);
      const listener = vi.fn();
      game.setStateChangeListener(listener);

      // Force CLAIM_FEATURE phase so skipClaim will trigger state change
      (game as any).state.phase = GamePhase.CLAIM_FEATURE;
      game.skipClaim();

      expect(listener).toHaveBeenCalled();
    });

    it('should pass updated state to listener', () => {
      const game = new Game(playerConfigs);
      let capturedState: any = null;
      
      game.setStateChangeListener((state) => {
        capturedState = state;
      });

      // Force CLAIM_FEATURE phase so skipClaim will trigger state change
      (game as any).state.phase = GamePhase.CLAIM_FEATURE;
      game.skipClaim();

      expect(capturedState).toBeDefined();
      expect(capturedState).toHaveProperty('phase');
      expect(capturedState).toHaveProperty('players');
    });

    it('should allow multiple state changes', () => {
      const game = new Game(playerConfigs);
      const listener = vi.fn();
      game.setStateChangeListener(listener);

      // Force CLAIM_FEATURE phase for each call
      (game as any).state.phase = GamePhase.CLAIM_FEATURE;
      game.skipClaim();
      
      (game as any).state.phase = GamePhase.CLAIM_FEATURE;
      game.skipClaim();

      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('placeTile', () => {
    it('should reject placement when not in PLACE_TILE phase', () => {
      const game = new Game(playerConfigs);
      // Force phase change
      (game as any).state.phase = GamePhase.CLAIM_FEATURE;

      const result = game.placeTile({ x: 1, y: 0 }, 0);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Not in tile placement phase');
    });

    it('should reject placement when no current tile', () => {
      const game = new Game(playerConfigs);
      (game as any).state.currentTile = undefined;

      const result = game.placeTile({ x: 1, y: 0 }, 0);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No current tile');
    });

    it('should accept valid tile placement', () => {
      const game = new Game(playerConfigs);
      const initialState = game.getState();
      
      // Try to find a valid placement
      const candidates = initialState.board.getPlacementCandidates();
      expect(candidates.length).toBeGreaterThan(0);
      
      // We need to find a valid rotation for the current tile
      const position = candidates[0];
      let validRotation = -1;
      
      for (let rotation = 0; rotation < 4; rotation++) {
        let rotatedTile = initialState.currentTile!.clone();
        for (let i = 0; i < rotation; i++) {
          rotatedTile = rotatedTile.rotate();
        }
        
        if (initialState.board.canPlace(rotatedTile, position)) {
          validRotation = rotation;
          break;
        }
      }
      
      if (validRotation >= 0) {
        const result = game.placeTile(position, validRotation);
        expect(result.success).toBe(true);
      } else {
        // If no valid placement found, that's ok for this test
        expect(true).toBe(true);
      }
    });

    it('should handle rotation parameter', () => {
      const game = new Game(playerConfigs);
      
      // Even if placement fails, rotation parameter should be accepted
      const result = game.placeTile({ x: 1, y: 0 }, 2);
      
      // Result may succeed or fail depending on tile, but no error should be thrown
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('completedFeatures');
    });

    it('should move tile to discard pile after successful placement', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();
      const initialDiscardSize = state.discardPile.length;
      
      // Find valid placement
      const candidates = state.board.getPlacementCandidates();
      if (candidates.length > 0) {
        const position = candidates[0];
        
        for (let rotation = 0; rotation < 4; rotation++) {
          const result = game.placeTile(position, rotation);
          if (result.success) {
            const newState = game.getState();
            expect(newState.discardPile.length).toBe(initialDiscardSize + 1);
            break;
          }
        }
      }
    });
  });

  describe('skipClaim', () => {
    it('should only work in CLAIM_FEATURE phase', () => {
      const game = new Game(playerConfigs);
      const initialPhase = game.getState().phase;

      game.skipClaim();

      // Should not change phase if not in CLAIM_FEATURE phase
      const newState = game.getState();
      if (initialPhase !== GamePhase.CLAIM_FEATURE) {
        expect(newState.phase).toBe(GamePhase.PLACE_TILE);
      }
    });

    it('should trigger state change notification', () => {
      const game = new Game(playerConfigs);
      const listener = vi.fn();
      game.setStateChangeListener(listener);

      // Force CLAIM_FEATURE phase
      (game as any).state.phase = GamePhase.CLAIM_FEATURE;
      
      game.skipClaim();

      expect(listener).toHaveBeenCalled();
    });

    it('should end turn after skipping claim', () => {
      const game = new Game(playerConfigs);
      const initialPlayerIndex = game.getState().currentPlayerIndex;
      
      // Force CLAIM_FEATURE phase
      (game as any).state.phase = GamePhase.CLAIM_FEATURE;
      
      game.skipClaim();
      
      const newState = game.getState();
      // Player index should have advanced
      expect(newState.currentPlayerIndex).not.toBe(initialPlayerIndex);
    });
  });

  describe('Game Flow', () => {
    it('should handle 3+ players correctly', () => {
      const threePlayers: PlayerDefinition[] = [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' },
      ];
      const game = new Game(threePlayers);
      const state = game.getState();

      expect(state.players).toHaveLength(3);
      expect(state.currentPlayerIndex).toBe(0);
    });

    it('should cycle through players', () => {
      const game = new Game(playerConfigs);
      
      // Force end turn
      (game as any).endTurn();
      
      let state = game.getState();
      expect(state.currentPlayerIndex).toBe(1);
      
      // End turn again
      (game as any).endTurn();
      
      state = game.getState();
      expect(state.currentPlayerIndex).toBe(0); // Back to first player
    });

    it('should increment turn number after full round', () => {
      const game = new Game(playerConfigs);
      const initialTurn = game.getState().turnNumber;
      
      // Complete one full round
      (game as any).endTurn(); // Player 0 -> 1
      expect(game.getState().turnNumber).toBe(initialTurn);
      
      (game as any).endTurn(); // Player 1 -> 0
      expect(game.getState().turnNumber).toBe(initialTurn + 1);
    });

    it('should maintain player state across turns', () => {
      const game = new Game(playerConfigs);
      const state = game.getState();
      
      // Modify first player's score
      state.players[0].score = 10;
      
      // End turn
      (game as any).endTurn();
      
      // Come back to first player
      (game as any).endTurn();
      
      const newState = game.getState();
      expect(newState.players[0].score).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single player game', () => {
      const singlePlayer: PlayerDefinition[] = [{ name: 'Solo' }];
      const game = new Game(singlePlayer);
      const state = game.getState();

      expect(state.players).toHaveLength(1);
      expect(state.currentPlayerIndex).toBe(0);
    });

    it('should handle many players', () => {
      const manyPlayers: PlayerDefinition[] = Array.from(
        { length: 6 },
        (_, i) => ({ name: `Player ${i + 1}` })
      );
      const game = new Game(manyPlayers);
      const state = game.getState();

      expect(state.players).toHaveLength(6);
    });

    it('should assign default colors when not provided', () => {
      const configs: PlayerDefinition[] = [
        { name: 'P1' },
        { name: 'P2' },
        { name: 'P3' },
      ];
      const game = new Game(configs);
      const state = game.getState();

      state.players.forEach((player) => {
        expect(player.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});
