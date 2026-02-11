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
  AIDifficulty,
} from "./types";
import { ScoreManager } from "./managers/ScoreManager";
import { TurnManager } from "./managers/TurnManager";
import { TileManager } from "./managers/TileManager";
import { FeatureClaimManager } from "./managers/FeatureClaimManager";
import { PlayerManager } from "./managers/PlayerManager";
import { shuffle } from "./utils/arrayUtils";
import { getRng } from "./utils/rng";
import { GAME_RULES } from "./constants/gameRules";
import { AIFactory, AIStrategy, AIContext } from "./ai";

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
  private readonly aiStrategies: Map<string, AIStrategy>;
  private readonly rng: () => number;

  constructor(playerConfigs: PlayerDefinition[], options: GameOptions = {}) {
    this.rng = getRng({ rng: options.rng, seed: options.seed });

    // Initialize managers
    this.scoreManager = new ScoreManager();
    this.turnManager = new TurnManager(options.startingPlayer || 0);
    this.tileManager = new TileManager(shuffle(buildDeck(), this.rng));
    this.featureClaimManager = new FeatureClaimManager();
    this.playerManager = new PlayerManager(playerConfigs);

    // Initialize AI strategies for each AI player
    this.aiStrategies = new Map();
    playerConfigs.forEach((config, index) => {
      if (config.isAI) {
        const playerId = config.id || `player_${index + 1}`;
        const difficulty = config.aiDifficulty || "medium";
        this.aiStrategies.set(playerId, AIFactory.create(difficulty, this.rng));
      }
    });

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

    const allClaimable =
      this.featureClaimManager.getClaimableFeatures(tileRecord.tile);

    // Filter out features that already have followers
    return allClaimable.filter((feature) =>
      this.state.board.canClaimFeature(
        feature.type,
        lastPlacedPosition,
        feature.identifier
      )
    );
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

    // Check if feature is already claimed
    if (!this.state.board.canClaimFeature(type, lastPlacedPosition, identifier)) {
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
    if (!currentPlayer.isAI) {
      return;
    }

    // For PLACE_TILE phase, we need a current tile
    // For CLAIM_FEATURE phase, the tile was already placed so we don't need it
    const currentTile = this.tileManager.getCurrentTile();
    if (this.state.phase === GamePhase.PLACE_TILE && !currentTile) {
      return;
    }

    // Get the AI strategy for this player
    const aiStrategy = this.aiStrategies.get(currentPlayer.id);
    if (!aiStrategy) {
      // Fallback to simple logic if no strategy (shouldn't happen)
      this.processAITurnFallback();
      return;
    }

    if (this.state.phase === GamePhase.PLACE_TILE) {
      // Get ALL candidate positions - the evaluator will try all rotations
      // and filter out invalid placement/rotation combinations
      const candidatePositions = this.state.board.getPlacementCandidates();
      if (candidatePositions.length === 0) {
        this.discardCurrentTileAndEndTurn();
        return;
      }

      // Build AI context (currentTile is guaranteed non-null in PLACE_TILE phase)
      const context: AIContext = {
        board: this.state.board,
        currentTile: currentTile!,
        currentPlayer,
        allPlayers: this.state.players,
        validPlacements: candidatePositions,
        claimableFeatures: [],
        gameState: this.state,
      };

      // Get evaluated placements from AI strategy
      const tilePlacements = aiStrategy.evaluateTilePlacements(context);

      if (tilePlacements.length > 0) {
        const best = tilePlacements[0];
        this.placeTile(best.position, best.rotation);
      } else {
        this.discardCurrentTileAndEndTurn();
      }
    } else if (this.state.phase === GamePhase.CLAIM_FEATURE) {
      const lastPosition = this.getLastPlacedTilePosition();
      if (!lastPosition) {
        this.skipClaim();
        return;
      }

      const placedTile = this.state.board.getTile(lastPosition)?.tile;
      if (!placedTile) {
        this.skipClaim();
        return;
      }

      // Get claimable features that aren't already claimed
      const claimableFeatures = this.getClaimableFeaturesForCurrentTurn();

      // Build AI context for meeple placement
      const context: AIContext = {
        board: this.state.board,
        currentTile: placedTile,
        currentPlayer,
        allPlayers: this.state.players,
        validPlacements: [],
        claimableFeatures,
        gameState: this.state,
      };

      // Get meeple placement decision from AI strategy
      const meeplePlacement = aiStrategy.evaluateMeeplePlacement(
        context,
        lastPosition
      );

      if (meeplePlacement && meeplePlacement.shouldClaim) {
        this.claimFeature(meeplePlacement.type, meeplePlacement.identifier);
      } else {
        this.skipClaim();
      }
    }
  }

  /**
   * Fallback AI logic if no strategy is available.
   */
  private processAITurnFallback(): void {
    const currentPlayer = this.getCurrentPlayer();
    const currentTile = this.tileManager.getCurrentTile();

    if (this.state.phase === GamePhase.PLACE_TILE) {
      if (!currentTile) return;

      // Try all candidate positions with all rotations
      const candidates = this.state.board.getPlacementCandidates();
      let placed = false;
      for (const position of candidates) {
        for (let rotation = 0; rotation < GAME_RULES.TILE_ROTATIONS; rotation++) {
          const rotatedTile = currentTile.rotate(rotation);
          if (this.state.board.canPlace(rotatedTile, position)) {
            this.placeTile(position, rotation);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      if (!placed) {
        this.discardCurrentTileAndEndTurn();
      }
    } else if (this.state.phase === GamePhase.CLAIM_FEATURE) {
      if (currentPlayer.followers > GAME_RULES.AI_CLAIM_THRESHOLD) {
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

  /**
   * Set or update the AI strategy for a specific player.
   */
  public setAIStrategy(playerId: string, difficulty: AIDifficulty): void {
    this.aiStrategies.set(playerId, AIFactory.create(difficulty, this.rng));
  }

  /**
   * Discard the current tile when no valid placements exist and end the turn.
   */
  private discardCurrentTileAndEndTurn(): void {
    this.tileManager.discardCurrentTile();
    this.syncTileState();
    this.endTurn();
    this.notifyStateChange();
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
