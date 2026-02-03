import { Board } from "./board";
import { buildDeck, getStartTile } from "./tileLibrary";
import {
  PlayerDefinition,
  GameOptions,
  Position,
  TerrainType,
  PlayerState,
  GameState,
  GamePhase,
  TilePlacementResult,
  ClaimableFeature,
  CompletedFeature,
} from "./types";
import { ScoreManager } from "./managers/ScoreManager";
import { TurnManager } from "./managers/TurnManager";
import { TileManager } from "./managers/TileManager";
import { FeatureClaimManager } from "./managers/FeatureClaimManager";
import { PlayerManager } from "./managers/PlayerManager";
import { shuffle } from "./utils/arrayUtils";
import { GAME_RULES } from "./constants/gameRules";

// Re-export types for backward compatibility
export { GamePhase } from "./types";
export type { GameState, PlayerState, TilePlacementResult } from "./types";

export class Game {
  private state: GameState;
  private onStateChange?: (state: GameState) => void;
  private readonly scoreManager: ScoreManager;
  private readonly turnManager: TurnManager;
  private readonly tileManager: TileManager;
  private readonly featureClaimManager: FeatureClaimManager;
  private readonly playerManager: PlayerManager;

  constructor(playerConfigs: PlayerDefinition[], options: GameOptions = {}) {
    // Initialize managers
    this.scoreManager = new ScoreManager();
    this.turnManager = new TurnManager(options.startingPlayer || 0);
    this.tileManager = new TileManager(shuffle(buildDeck()));
    this.featureClaimManager = new FeatureClaimManager();
    this.playerManager = new PlayerManager(playerConfigs);

    this.state = {
      board: new Board(),
      players: this.playerManager.getPlayers(),
      currentPlayerIndex: this.turnManager.getCurrentPlayerIndex(),
      tileDeck: this.tileManager.getTileDeck(),
      discardPile: this.tileManager.getDiscardPile(),
      phase: this.turnManager.getPhase(),
      isGameOver: false,
      turnNumber: this.turnManager.getTurnNumber(),
    };

    // Place the starting tile
    const startTile = getStartTile();
    this.state.board.placeTile(startTile, { x: 0, y: 0 });

    this.tileManager.drawNextTile();
    this.state.currentTile = this.tileManager.getCurrentTile();
  }

  /**
   * Sync tile-related state from TileManager to game state
   */
  private syncTileState(): void {
    this.state.currentTile = this.tileManager.getCurrentTile();
    this.state.tileDeck = this.tileManager.getTileDeck();
    this.state.discardPile = this.tileManager.getDiscardPile();
  }

  public setStateChangeListener(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getCurrentPlayer(): PlayerState {
    return this.playerManager.getCurrentPlayer(this.state.currentPlayerIndex);
  }

  public placeTile(
    position: Position,
    rotation: number = 0
  ): TilePlacementResult {
    if (this.state.phase !== GamePhase.PLACE_TILE) {
      return {
        success: false,
        completedFeatures: [],
        message: "Not in tile placement phase",
      };
    }

    const currentTile = this.tileManager.getCurrentTile();
    if (!currentTile) {
      return {
        success: false,
        completedFeatures: [],
        message: "No current tile to place",
      };
    }

    // Apply rotation using TileManager
    const rotatedTile = this.tileManager.getRotatedCurrentTile(rotation);
    if (!rotatedTile) {
      return {
        success: false,
        completedFeatures: [],
        message: "Failed to rotate tile",
      };
    }

    // Check if placement is valid
    if (!this.state.board.canPlace(rotatedTile, position)) {
      return {
        success: false,
        completedFeatures: [],
        message: "Invalid tile placement",
      };
    }

    try {
      // Place the tile
      const result = this.state.board.placeTile(rotatedTile, position);

      // Track the position where this tile was placed
      this.turnManager.setLastPlacedPosition(position);
      this.state.lastPlacedPosition = position;

      // Discard the current tile
      this.tileManager.discardCurrentTile();
      this.syncTileState();

      // Score completed features
      this.scoreCompletedFeatures(result.completed);

      // Return followers from completed features
      this.state.board.returnFollowersFromCompletedFeatures(result.completed);

      // Check if there are claimable features
      const claimableFeatures =
        this.featureClaimManager.getClaimableFeatures(rotatedTile);

      if (
        claimableFeatures.length > 0 &&
        this.getCurrentPlayer().followers > 0
      ) {
        this.turnManager.enterClaimPhase();
        this.state.phase = this.turnManager.getPhase();
      } else {
        this.endTurn();
      }

      this.notifyStateChange();
      return {
        success: true,
        completedFeatures: result.completed,
        message: `Tile placed successfully. ${result.completed.length} features completed.`,
      };
    } catch (error) {
      return {
        success: false,
        completedFeatures: [],
        message:
          error instanceof Error ? error.message : "Failed to place tile",
      };
    }
  }

  private scoreCompletedFeatures(completedFeatures: CompletedFeature[]): void {
    this.scoreManager.scoreCompletedFeatures(
      completedFeatures,
      this.state.players
    );
  }

  public getClaimableFeaturesForCurrentTurn(): ClaimableFeature[] {
    if (this.state.phase !== GamePhase.CLAIM_FEATURE) {
      return [];
    }

    const lastPlacedPosition = this.getLastPlacedTilePosition();
    if (!lastPlacedPosition) {
      return [];
    }

    const tileRecord = this.state.board.getTile(lastPlacedPosition);
    if (!tileRecord) {
      return [];
    }

    return this.featureClaimManager.getClaimableFeatures(tileRecord.tile);
  }

  public claimFeature(type: TerrainType, identifier?: string): boolean {
    if (this.state.phase !== GamePhase.CLAIM_FEATURE) {
      return false;
    }

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.followers <= 0) {
      return false;
    }

    const lastPlacedPosition = this.getLastPlacedTilePosition();
    if (!lastPlacedPosition) {
      return false;
    }

    try {
      this.featureClaimManager.claimFeature(
        this.state.board,
        type,
        lastPlacedPosition,
        identifier,
        currentPlayer.id
      );
      this.playerManager.decreaseFollowerCount(currentPlayer.id);

      this.endTurn();
      this.notifyStateChange();
      return true;
    } catch (error) {
      console.error("Failed to claim feature:", error);
      return false;
    }
  }

  public skipClaim(): void {
    if (this.state.phase === GamePhase.CLAIM_FEATURE) {
      this.endTurn();
      this.notifyStateChange();
    }
  }

  private getLastPlacedTilePosition(): Position | undefined {
    return this.turnManager.getLastPlacedPosition();
  }

  private endTurn(): void {
    // Draw next tile using TileManager
    const hasNextTile = this.tileManager.drawNextTile();
    this.syncTileState();

    // Use TurnManager to handle turn completion
    this.turnManager.completeTurn(
      this.tileManager.getCurrentTile(),
      this.state.players.length
    );

    // Sync state with TurnManager
    this.state.phase = this.turnManager.getPhase();
    this.state.currentPlayerIndex = this.turnManager.getCurrentPlayerIndex();
    this.state.turnNumber = this.turnManager.getTurnNumber();
    this.state.lastPlacedPosition = this.turnManager.getLastPlacedPosition();

    if (!hasNextTile) {
      this.endGame();
    }
  }

  private endGame(): void {
    this.turnManager.endGame();
    this.state.phase = this.turnManager.getPhase();
    this.state.isGameOver = true;

    // Calculate final scores using ScoreManager
    this.scoreManager.calculateFinalScores(
      this.state.players,
      this.state.board
    );

    // Determine winner
    const maxScore = Math.max(...this.state.players.map((p) => p.score));
    const winners = this.state.players.filter((p) => p.score === maxScore);

    if (winners.length === 1) {
      this.state.winner = winners[0].name;
    } else {
      this.state.winner = winners.map((w) => w.name).join(", ") + " (tie)";
    }

    this.notifyStateChange();
  }

  public processAITurn(): void {
    const currentPlayer = this.getCurrentPlayer();
    const currentTile = this.tileManager.getCurrentTile();
    if (!currentPlayer.isAI || !currentTile) {
      return;
    }

    if (this.state.phase === GamePhase.PLACE_TILE) {
      // Simple AI: place tile at first valid position
      const validPlacements = this.getValidPlacements();
      if (validPlacements.length > 0) {
        this.placeTile(validPlacements[0], 0);
      }
    } else if (this.state.phase === GamePhase.CLAIM_FEATURE) {
      // AI decides whether to claim a feature (simplified logic)
      if (currentPlayer.followers > GAME_RULES.AI_CLAIM_THRESHOLD) {
        // Try to claim the first available feature
        const lastPosition = this.getLastPlacedTilePosition();
        if (lastPosition) {
          const placedTile = this.state.board.getTile(lastPosition)?.tile;
          if (placedTile) {
            const claimable =
              this.featureClaimManager.getClaimableFeatures(placedTile);
            if (claimable.length > 0) {
              this.claimFeature(claimable[0].type, claimable[0].identifier);
              return;
            }
          }
        }
      }
      this.skipClaim();
    }
  }

  public canRotateTile(): boolean {
    return (
      this.state.phase === GamePhase.PLACE_TILE &&
      this.tileManager.canRotateTile()
    );
  }

  public rotateTile(times: number = 1): void {
    if (this.canRotateTile()) {
      this.tileManager.rotateTile(times);
      this.syncTileState();
      this.notifyStateChange();
    }
  }

  public rotateTileClockwise(): void {
    this.rotateTile(1);
  }

  public rotateTileCounterClockwise(): void {
    this.rotateTile(-1);
  }

  public getValidPlacements(): Position[] {
    return this.tileManager.getValidPlacements(this.state.board);
  }

  public previewTilePlacement(position: Position): any {
    return this.tileManager.previewTilePlacement(this.state.board, position);
  }

  public getTileStats(): { remaining: number; placed: number; total: number } {
    return this.tileManager.getTileStats();
  }
}
