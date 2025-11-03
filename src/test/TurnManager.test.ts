import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from '../managers/TurnManager';
import { Tile } from '../tile';
import { PlayerState, GameState } from '../types';
import { GamePhase } from '../game';
import { Board } from '../board';

describe('TurnManager', () => {
  let turnManager: TurnManager;
  let mockTiles: Tile[];

  beforeEach(() => {
    turnManager = new TurnManager();

    // Create mock tiles
    mockTiles = [
      new Tile({
        id: 'tile-1',
        name: 'Tile 1',
        edges: { north: 'field', east: 'field', south: 'field', west: 'field' },
        center: 'field',
        roadConnections: [],
        costcoZones: [],
      }),
      new Tile({
        id: 'tile-2',
        name: 'Tile 2',
        edges: { north: 'road', east: 'road', south: 'field', west: 'field' },
        center: 'field',
        roadConnections: [['north', 'east']],
        costcoZones: [],
      }),
      new Tile({
        id: 'tile-3',
        name: 'Tile 3',
        edges: { north: 'costco', east: 'field', south: 'field', west: 'field' },
        center: 'field',
        roadConnections: [],
        costcoZones: [{ id: 'c1', segments: ['north'] }],
      }),
    ];
  });

  describe('drawNextTile', () => {
    it('should draw and remove the last tile from deck', () => {
      const deck = [...mockTiles];
      const drawnTile = turnManager.drawNextTile(deck);

      expect(drawnTile).toBe(mockTiles[2]); // Last tile
      expect(deck.length).toBe(2);
      expect(deck).not.toContain(mockTiles[2]);
    });

    it('should return undefined when deck is empty', () => {
      const emptyDeck: Tile[] = [];
      const drawnTile = turnManager.drawNextTile(emptyDeck);

      expect(drawnTile).toBeUndefined();
      expect(emptyDeck.length).toBe(0);
    });

    it('should handle drawing all tiles until empty', () => {
      const deck = [...mockTiles];

      const tile1 = turnManager.drawNextTile(deck);
      const tile2 = turnManager.drawNextTile(deck);
      const tile3 = turnManager.drawNextTile(deck);
      const tile4 = turnManager.drawNextTile(deck);

      expect(tile1).toBeDefined();
      expect(tile2).toBeDefined();
      expect(tile3).toBeDefined();
      expect(tile4).toBeUndefined();
      expect(deck.length).toBe(0);
    });
  });

  describe('advanceToNextPlayer', () => {
    it('should advance to next player', () => {
      const nextIndex = turnManager.advanceToNextPlayer(0, 3);

      expect(nextIndex).toBe(1);
    });

    it('should wrap around to first player after last', () => {
      const nextIndex = turnManager.advanceToNextPlayer(2, 3);

      expect(nextIndex).toBe(0);
    });

    it('should work with 2 players', () => {
      expect(turnManager.advanceToNextPlayer(0, 2)).toBe(1);
      expect(turnManager.advanceToNextPlayer(1, 2)).toBe(0);
    });

    it('should work with 5 players', () => {
      expect(turnManager.advanceToNextPlayer(0, 5)).toBe(1);
      expect(turnManager.advanceToNextPlayer(4, 5)).toBe(0);
    });
  });

  describe('isNewRound', () => {
    it('should return true when back to player 0', () => {
      expect(turnManager.isNewRound(0)).toBe(true);
    });

    it('should return false for other players', () => {
      expect(turnManager.isNewRound(1)).toBe(false);
      expect(turnManager.isNewRound(2)).toBe(false);
      expect(turnManager.isNewRound(3)).toBe(false);
    });
  });

  describe('endTurn', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = {
        board: new Board(),
        players: [
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
        ],
        currentPlayerIndex: 0,
        tileDeck: [...mockTiles],
        discardPile: [],
        phase: GamePhase.END_TURN,
        isGameOver: false,
        turnNumber: 1,
      };
    });

    it('should advance to next player', () => {
      turnManager.endTurn(gameState);

      expect(gameState.currentPlayerIndex).toBe(1);
    });

    it('should draw next tile', () => {
      turnManager.endTurn(gameState);

      expect(gameState.currentTile).toBeDefined();
      expect(gameState.tileDeck.length).toBe(2);
    });

    it('should return PLACE_TILE phase when tiles remain', () => {
      const phase = turnManager.endTurn(gameState);

      expect(phase).toBe(GamePhase.PLACE_TILE);
    });

    it('should return GAME_OVER when no tiles remain', () => {
      gameState.tileDeck = [];

      const phase = turnManager.endTurn(gameState);

      expect(phase).toBe(GamePhase.GAME_OVER);
      expect(gameState.isGameOver).toBe(true);
    });

    it('should increment turn number on new round', () => {
      gameState.currentPlayerIndex = 1; // Last player

      turnManager.endTurn(gameState);

      expect(gameState.currentPlayerIndex).toBe(0);
      expect(gameState.turnNumber).toBe(2);
    });

    it('should not increment turn number mid-round', () => {
      gameState.currentPlayerIndex = 0;

      turnManager.endTurn(gameState);

      expect(gameState.currentPlayerIndex).toBe(1);
      expect(gameState.turnNumber).toBe(1); // Still turn 1
    });
  });

  describe('getPhaseAfterPlacement', () => {
    let currentPlayer: PlayerState;

    beforeEach(() => {
      currentPlayer = {
        id: 'player-1',
        name: 'Alice',
        isAI: false,
        score: 0,
        followers: 7,
        color: '#ff0000',
      };
    });

    it('should return CLAIM_FEATURE when features available and followers remain', () => {
      const phase = turnManager.getPhaseAfterPlacement(currentPlayer, true);

      expect(phase).toBe(GamePhase.CLAIM_FEATURE);
    });

    it('should return END_TURN when no claimable features', () => {
      const phase = turnManager.getPhaseAfterPlacement(currentPlayer, false);

      expect(phase).toBe(GamePhase.END_TURN);
    });

    it('should return END_TURN when no followers remain', () => {
      currentPlayer.followers = 0;

      const phase = turnManager.getPhaseAfterPlacement(currentPlayer, true);

      expect(phase).toBe(GamePhase.END_TURN);
    });

    it('should return END_TURN when both no features and no followers', () => {
      currentPlayer.followers = 0;

      const phase = turnManager.getPhaseAfterPlacement(currentPlayer, false);

      expect(phase).toBe(GamePhase.END_TURN);
    });
  });

  describe('shouldGameEnd', () => {
    it('should return true when tile deck is empty', () => {
      const shouldEnd = turnManager.shouldGameEnd([]);

      expect(shouldEnd).toBe(true);
    });

    it('should return false when tiles remain', () => {
      const shouldEnd = turnManager.shouldGameEnd(mockTiles);

      expect(shouldEnd).toBe(false);
    });

    it('should return false with one tile remaining', () => {
      const shouldEnd = turnManager.shouldGameEnd([mockTiles[0]]);

      expect(shouldEnd).toBe(false);
    });
  });

  describe('getTileStats', () => {
    it('should calculate correct stats with all components', () => {
      const stats = turnManager.getTileStats(
        [mockTiles[0], mockTiles[1]], // 2 in deck
        [mockTiles[2]], // 1 in discard
        mockTiles[2] // 1 current (note: same as discard for simplicity)
      );

      expect(stats.remaining).toBe(2);
      expect(stats.placed).toBe(1);
      expect(stats.total).toBe(4);
    });

    it('should handle no current tile', () => {
      const stats = turnManager.getTileStats(
        [mockTiles[0]], // 1 in deck
        [mockTiles[1], mockTiles[2]], // 2 in discard
        undefined // No current
      );

      expect(stats.remaining).toBe(1);
      expect(stats.placed).toBe(2);
      expect(stats.total).toBe(3);
    });

    it('should handle empty deck', () => {
      const stats = turnManager.getTileStats(
        [], // Empty deck
        mockTiles, // All discarded
        undefined
      );

      expect(stats.remaining).toBe(0);
      expect(stats.placed).toBe(3);
      expect(stats.total).toBe(3);
    });

    it('should handle game start (no discards)', () => {
      const stats = turnManager.getTileStats(
        mockTiles, // All in deck
        [], // None discarded
        mockTiles[0] // One current
      );

      expect(stats.remaining).toBe(3);
      expect(stats.placed).toBe(0);
      expect(stats.total).toBe(4);
    });
  });

  describe('isValidPhaseTransition', () => {
    it('should allow PLACE_TILE to CLAIM_FEATURE', () => {
      const isValid = turnManager.isValidPhaseTransition(
        GamePhase.PLACE_TILE,
        GamePhase.CLAIM_FEATURE
      );

      expect(isValid).toBe(true);
    });

    it('should allow PLACE_TILE to END_TURN', () => {
      const isValid = turnManager.isValidPhaseTransition(
        GamePhase.PLACE_TILE,
        GamePhase.END_TURN
      );

      expect(isValid).toBe(true);
    });

    it('should allow CLAIM_FEATURE to END_TURN', () => {
      const isValid = turnManager.isValidPhaseTransition(
        GamePhase.CLAIM_FEATURE,
        GamePhase.END_TURN
      );

      expect(isValid).toBe(true);
    });

    it('should allow END_TURN to PLACE_TILE', () => {
      const isValid = turnManager.isValidPhaseTransition(
        GamePhase.END_TURN,
        GamePhase.PLACE_TILE
      );

      expect(isValid).toBe(true);
    });

    it('should allow END_TURN to GAME_OVER', () => {
      const isValid = turnManager.isValidPhaseTransition(
        GamePhase.END_TURN,
        GamePhase.GAME_OVER
      );

      expect(isValid).toBe(true);
    });

    it('should not allow CLAIM_FEATURE to PLACE_TILE', () => {
      const isValid = turnManager.isValidPhaseTransition(
        GamePhase.CLAIM_FEATURE,
        GamePhase.PLACE_TILE
      );

      expect(isValid).toBe(false);
    });

    it('should not allow transitions from GAME_OVER', () => {
      expect(
        turnManager.isValidPhaseTransition(GamePhase.GAME_OVER, GamePhase.PLACE_TILE)
      ).toBe(false);
      expect(
        turnManager.isValidPhaseTransition(GamePhase.GAME_OVER, GamePhase.END_TURN)
      ).toBe(false);
    });

    it('should not allow PLACE_TILE to GAME_OVER directly', () => {
      const isValid = turnManager.isValidPhaseTransition(
        GamePhase.PLACE_TILE,
        GamePhase.GAME_OVER
      );

      expect(isValid).toBe(false);
    });
  });
});
