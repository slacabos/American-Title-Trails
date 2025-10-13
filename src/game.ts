import { Board } from "./board";
import { Tile } from "./tile";
import { buildDeck, getStartTile } from "./tileLibrary";
import { PlayerDefinition, GameOptions, Position, TerrainType } from "./types";

export enum GamePhase {
  PLACE_TILE = "place_tile",
  CLAIM_FEATURE = "claim_feature",
  SCORE_FEATURES = "score_features",
  END_TURN = "end_turn",
  GAME_OVER = "game_over",
}

interface PlayerState {
  id: string;
  name: string;
  isAI: boolean;
  score: number;
  followers: number;
  color: string;
}

interface GameState {
  board: Board;
  players: PlayerState[];
  currentPlayerIndex: number;
  currentTile?: Tile;
  tileDeck: Tile[];
  discardPile: Tile[];
  phase: GamePhase;
  isGameOver: boolean;
  winner?: string;
  turnNumber: number;
  lastPlacedPosition?: Position;
}

interface TilePlacementResult {
  success: boolean;
  completedFeatures: any[];
  message?: string;
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

  constructor(playerConfigs: PlayerDefinition[], options: GameOptions = {}) {
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
    if (this.state.tileDeck.length === 0) {
      this.endGame();
      return;
    }

    this.state.currentTile = this.state.tileDeck.pop();
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

      // Track the position where this tile was placed
      this.state.lastPlacedPosition = position;

      // Add tile to discard pile
      this.state.discardPile.push(this.state.currentTile);
      this.state.currentTile = undefined;

      // Score completed features
      this.scoreCompletedFeatures(result.completed);

      // Return followers from completed features
      this.state.board.returnFollowersFromCompletedFeatures(result.completed);

      // Check if there are claimable features
      const claimableFeatures = this.getClaimableFeatures(rotatedTile);

      if (
        claimableFeatures.length > 0 &&
        this.getCurrentPlayer().followers > 0
      ) {
        this.state.phase = GamePhase.CLAIM_FEATURE;
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

  private scoreCompletedFeatures(completedFeatures: any[]): void {
    completedFeatures.forEach((feature) => {
      if (feature.claimedBy && feature.claimedBy.length > 0) {
        // Award points to claiming players
        feature.claimedBy.forEach((playerId: string) => {
          const player = this.state.players.find((p) => p.id === playerId);
          if (player) {
            player.score += feature.points;
          }
        });
      }
    });
  }

  private getClaimableFeatures(
    tile: Tile
  ): Array<{ type: TerrainType; identifier?: string; displayName?: string }> {
    const claimable: Array<{
      type: TerrainType;
      identifier?: string;
      displayName?: string;
    }> = [];

    // Check road connections with descriptive labels
    tile.roadConnections.forEach((connection, index) => {
      // Create a readable description of the road connection
      const directions = connection
        .filter((dir) => dir !== "center") // Remove "center" for cleaner display
        .map((dir) => dir.charAt(0).toUpperCase() + dir.slice(1)) // Capitalize
        .join("-");

      // If no directions (only center), use the directions that have roads on edges
      let label = directions;
      if (!label) {
        const roadEdges = ["north", "east", "south", "west"]
          .filter((dir) => tile.edgeAt(dir as any) === "road")
          .map((dir) => dir.charAt(0).toUpperCase() + dir.slice(1))
          .join("-");
        label = roadEdges || "Center";
      }

      claimable.push({
        type: "road",
        identifier: `road_${index}`,
        displayName: label,
      });
    });

    // Check Costco zones with descriptive labels
    tile.costcoZones.forEach((zone, index) => {
      const directions = zone.segments
        .filter((segment) => segment !== "center")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("-");

      const label = directions || "Center";

      claimable.push({
        type: "costco",
        identifier: `costco_${index}`,
        displayName: label,
      });
    });

    // Check McDonalds
    if (tile.center === "mcdonalds") {
      claimable.push({ type: "mcdonalds" });
    }

    return claimable;
  }

  public getClaimableFeaturesForCurrentTurn(): Array<{
    type: TerrainType;
    identifier?: string;
    displayName?: string;
  }> {
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

    return this.getClaimableFeatures(tileRecord.tile);
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
    return this.state.lastPlacedPosition;
  }

  private endTurn(): void {
    this.state.phase = GamePhase.END_TURN;

    // Clear the last placed position for the new turn
    this.state.lastPlacedPosition = undefined;

    // Move to next player
    this.state.currentPlayerIndex =
      (this.state.currentPlayerIndex + 1) % this.state.players.length;

    // If we're back to the first player, increment turn number
    if (this.state.currentPlayerIndex === 0) {
      this.state.turnNumber++;
    }

    // Draw next tile for new player
    this.drawNextTile();

    if (this.state.currentTile) {
      this.state.phase = GamePhase.PLACE_TILE;
    } else {
      this.endGame();
    }
  }

  private endGame(): void {
    this.state.phase = GamePhase.GAME_OVER;
    this.state.isGameOver = true;

    // Calculate final scores (field scoring, etc.)
    this.calculateFinalScores();

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

  private calculateFinalScores(): void {
    // Score incomplete features by finding all incomplete Costco features
    this.scoreIncompleteCostcoFeatures();

    // Score other incomplete features using simplified scoring
    const claims = this.state.board.getFeatureClaims();
    claims.forEach((claim) => {
      const player = this.state.players.find((p) =>
        claim.players.includes(p.id)
      );
      if (player && claim.type !== "costco") {
        // Other features: simplified final scoring - 1 point per tile
        player.score += 1;
      }
    });
  }

  private scoreIncompleteCostcoFeatures(): void {
    // Find all incomplete Costco features across the board
    const allIncompleteFeatures = this.findAllIncompleteCostcoFeatures();

    allIncompleteFeatures.forEach((feature) => {
      // Create proper feature object for claimant lookup
      const featureForClaimants = {
        type: "costco" as const,
        tiles: feature.tiles,
        edges: feature.edges,
        isComplete: false,
        pennants: feature.pennants,
      };

      const claimants = (this.state.board as any).getFeatureClaimants(
        featureForClaimants
      );
      if (claimants.length > 0) {
        // Incomplete Costco scoring: 1 point per tile + 1 point per pennant
        const tilePoints = feature.tiles.size;
        const pennantPoints = feature.pennants;
        const totalPoints = tilePoints + pennantPoints;

        claimants.forEach((playerId: string) => {
          const player = this.state.players.find((p) => p.id === playerId);
          if (player) {
            player.score += totalPoints;
          }
        });
      }
    });
  }

  private findAllIncompleteCostcoFeatures(): Array<{
    tiles: Set<string>;
    pennants: number;
    edges: Set<string>;
  }> {
    const allFeatures: Array<{
      tiles: Set<string>;
      pennants: number;
      edges: Set<string>;
    }> = [];
    const processedTiles = new Set<string>();

    // Iterate through all tiles to find Costco features
    (this.state.board as any).tiles.forEach(
      (tileRecord: any, positionKey: string) => {
        if (processedTiles.has(positionKey)) return;

        const position = this.parsePositionKey(positionKey);
        tileRecord.tile.costcoZones.forEach((zone: any) => {
          const visited = new Set<string>();
          const feature = (this.state.board as any).traceCostcoFeature(
            position,
            zone,
            visited
          );

          // Only include if feature is incomplete
          if (!(this.state.board as any).isCostcoComplete(feature)) {
            // Mark all tiles in this feature as processed
            feature.tiles.forEach((tileKey: string) =>
              processedTiles.add(tileKey)
            );
            allFeatures.push({
              tiles: feature.tiles,
              pennants: feature.pennants || 0,
              edges: feature.edges,
            });
          }
        });
      }
    );

    return allFeatures;
  }

  private parsePositionKey(key: string): { x: number; y: number } {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
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

  public rotateTile(times: number = 1): void {
    if (this.canRotateTile() && this.state.currentTile) {
      this.state.currentTile = this.state.currentTile.rotate(times);
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
    if (!this.state.currentTile) {
      return [];
    }

    return this.state.board
      .getPlacementCandidates()
      .filter(
        (position) =>
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
    const total =
      this.state.tileDeck.length +
      this.state.discardPile.length +
      (this.state.currentTile ? 1 : 0);
    const remaining = this.state.tileDeck.length;
    const placed = this.state.discardPile.length;

    return { remaining, placed, total };
  }
}
