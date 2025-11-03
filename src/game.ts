import { Board } from "./board";
import { Tile } from "./tile";
import { buildDeck, getStartTile } from "./tileLibrary";
import {
  PlayerDefinition,
  GameOptions,
  Position,
  TerrainType,
  GameState,
  PlayerState,
  TilePlacementResult,
  ClaimableFeature,
} from "./types";
import { ScoreManager } from "./managers/ScoreManager";
import { TurnManager } from "./managers/TurnManager";

export enum GamePhase {
  PLACE_TILE = "place_tile",
  CLAIM_FEATURE = "claim_feature",
  SCORE_FEATURES = "score_features",
  END_TURN = "end_turn",
  GAME_OVER = "game_over",
}

// Shuffle utility function
const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export class Game {
  private state: GameState;
  private onStateChange?: (state: GameState) => void;
  private scoreManager: ScoreManager;
  private turnManager: TurnManager;

  constructor(playerConfigs: PlayerDefinition[], options: GameOptions = {}) {
    // Initialize managers
    this.scoreManager = new ScoreManager();
    this.turnManager = new TurnManager();

    const players: PlayerState[] = playerConfigs.map((config, index) => ({
      id: config.id || `player_${index + 1}`,
      name: config.name,
      isAI: config.isAI || false,
      score: 0,
      followers: config.followers || 7,
      color: config.color || this.getDefaultColor(index),
    }));

    // Create and shuffle tile deck
    const tileDeck = shuffle(buildDeck());

    this.state = {
      board: new Board(),
      players,
      currentPlayerIndex: options.startingPlayer || 0,
      tileDeck,
      discardPile: [],
      phase: GamePhase.PLACE_TILE,
      isGameOver: false,
      turnNumber: 1,
    };

    // Place the starting tile
    const startTile = getStartTile();
    this.state.board.placeTile(startTile, { x: 0, y: 0 });

    this.drawNextTile();
  }

  private getDefaultColor(index: number): string {
    const colors = ["#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#FF00FF"];
    return colors[index % colors.length];
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
    return this.state.players[this.state.currentPlayerIndex];
  }

  private drawNextTile(): void {
    const nextTile = this.turnManager.drawNextTile(this.state.tileDeck);
    if (!nextTile) {
      this.endGame();
      return;
    }
    this.state.currentTile = nextTile;
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

    if (!this.state.currentTile) {
      return {
        success: false,
        completedFeatures: [],
        message: "No current tile to place",
      };
    }

    // Apply rotation
    let rotatedTile = this.state.currentTile.clone();
    for (let i = 0; i < rotation; i++) {
      rotatedTile = rotatedTile.rotate();
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

      // Add tile to discard pile
      this.state.discardPile.push(this.state.currentTile);
      this.state.currentTile = undefined;

      // Score completed features using ScoreManager
      this.scoreManager.scoreCompletedFeatures(
        result.completed,
        this.state.players
      );

      // Return followers from completed features
      this.state.board.returnFollowersFromCompletedFeatures(result.completed);

      // Check if there are claimable features
      const claimableFeatures = this.getClaimableFeatures(rotatedTile);

      // Determine next phase using TurnManager
      this.state.phase = this.turnManager.getPhaseAfterPlacement(
        this.getCurrentPlayer(),
        claimableFeatures.length > 0
      );

      if (this.state.phase === GamePhase.END_TURN) {
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

  public getClaimableFeatures(
    tile?: Tile
  ): ClaimableFeature[] {
    // Use provided tile, or current tile from state, or last placed tile
    let targetTile = tile || this.state.currentTile;
    
    // If no tile is available but we're in CLAIM_FEATURE phase, get the last placed tile
    if (!targetTile && this.state.phase === GamePhase.CLAIM_FEATURE) {
      const lastPosition = this.getLastPlacedTilePosition();
      if (lastPosition) {
        const tileRecord = this.state.board.getTile(lastPosition);
        if (tileRecord) {
          targetTile = tileRecord.tile;
        }
      }
    }
    
    if (!targetTile) {
      return [];
    }

    const claimable: ClaimableFeature[] = [];

    // Helper to format directions into a readable string
    const formatDirections = (segments: string[]): string => {
      // Filter out 'center' and format cardinal directions
      const cardinals = segments
        .filter(s => s !== 'center')
        .map(s => s.charAt(0).toUpperCase()); // N, E, S, W
      
      if (cardinals.length === 0) {
        return 'Center';
      } else if (cardinals.length === 1) {
        return cardinals[0];
      } else {
        return cardinals.join('-');
      }
    };

    // Check road connections
    targetTile.roadConnections.forEach((connection: string[], index: number) => {
      const label = formatDirections(connection);
      claimable.push({ 
        type: "road", 
        identifier: `road_${index}`,
        label: `Road ${label}`,
      });
    });

    // Check Costco zones
    targetTile.costcoZones.forEach((zone: any, index: number) => {
      const label = formatDirections(zone.segments);
      claimable.push({ 
        type: "costco", 
        identifier: `costco_${index}`,
        label: `Costco ${label}`,
      });
    });

    // Check McDonalds
    if (targetTile.center === "mcdonalds") {
      claimable.push({ type: "mcdonalds", label: "McDonalds" });
    }

    return claimable;
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
      this.state.board.claimFeature(
        type,
        lastPlacedPosition,
        identifier,
        currentPlayer.id
      );
      currentPlayer.followers--;

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
    // For now, we'll need to track this. In a more sophisticated implementation,
    // we'd maintain a history of moves.
    // This is a simplified approach - in practice you'd track the last placement
    const boardTiles = Array.from(this.state.board.tiles.values());
    if (boardTiles.length > 0) {
      return boardTiles[boardTiles.length - 1].position;
    }
    return undefined;
  }

  private endTurn(): void {
    // Use TurnManager to handle turn progression
    this.state.phase = this.turnManager.endTurn(this.state);

    if (this.state.phase === GamePhase.GAME_OVER) {
      this.endGame();
    }
  }

  private endGame(): void {
    this.state.phase = GamePhase.GAME_OVER;
    this.state.isGameOver = true;

    // Calculate final scores using ScoreManager
    this.scoreManager.calculateFinalScores(this.state.board, this.state.players);

    // Determine winner using ScoreManager
    this.state.winner = this.scoreManager.determineWinner(this.state.players);

    this.notifyStateChange();
  }

  public processAITurn(): void {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer.isAI || !this.state.currentTile) {
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
      if (currentPlayer.followers > 2) {
        // Try to claim the first available feature
        const lastPosition = this.getLastPlacedTilePosition();
        if (lastPosition) {
          const placedTile = this.state.board.getTile(lastPosition)?.tile;
          if (placedTile) {
            const claimable = this.getClaimableFeatures(placedTile);
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
      this.state.phase === GamePhase.PLACE_TILE && !!this.state.currentTile
    );
  }

  public rotateTile(): void {
    if (this.canRotateTile() && this.state.currentTile) {
      this.state.currentTile = this.state.currentTile.rotate();
      this.notifyStateChange();
    }
  }

  public getValidPlacements(): Position[] {
    if (!this.state.currentTile) {
      return [];
    }

    return this.state.board
      .getPlacementCandidates()
      .filter((position: Position) =>
        this.state.currentTile &&
        this.state.board.canPlace(this.state.currentTile, position)
      );
  }

  public previewTilePlacement(position: Position): any {
    if (!this.state.currentTile) {
      return null;
    }

    return this.state.board.previewPlacement(this.state.currentTile, position);
  }

  public getTileStats(): { remaining: number; placed: number; total: number } {
    return this.turnManager.getTileStats(
      this.state.tileDeck,
      this.state.discardPile,
      this.state.currentTile
    );
  }
}
