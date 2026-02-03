import { PlayerState, CompletedFeature } from "../types";
import type { IBoard } from "../interfaces/IBoard";

/**
 * ScoreManager handles all scoring calculations for the game.
 * Responsibilities:
 * - Score completed features during gameplay
 * - Calculate final scores for incomplete features
 * - Manage feature-specific scoring rules
 */
export class ScoreManager {
  /**
   * Score completed features and award points to claiming players
   */
  public scoreCompletedFeatures(
    completedFeatures: CompletedFeature[],
    players: PlayerState[]
  ): void {
    completedFeatures.forEach((feature) => {
      if (feature.claimedBy && feature.claimedBy.length > 0) {
        // Award points to claiming players
        feature.claimedBy.forEach((playerId: string) => {
          const player = players.find((p) => p.id === playerId);
          if (player) {
            player.score += feature.points;
          }
        });
      }
    });
  }

  /**
   * Calculate final scores for all incomplete features at game end
   */
  public calculateFinalScores(players: PlayerState[], board: IBoard): void {
    // Score incomplete Costco features
    this.scoreIncompleteCostcoFeatures(players, board);

    // Score other incomplete features using simplified scoring
    const claims = board.getFeatureClaims();
    claims.forEach((claim) => {
      const player = players.find((p) => claim.players.includes(p.id));
      if (player && claim.type !== "costco") {
        // Other features: simplified final scoring - 1 point per tile
        player.score += 1;
      }
    });
  }

  /**
   * Score incomplete Costco features at game end
   * Scoring: 1 point per tile + 1 point per pennant
   */
  private scoreIncompleteCostcoFeatures(
    players: PlayerState[],
    board: IBoard
  ): void {
    const allIncompleteFeatures = this.findAllIncompleteCostcoFeatures(board);

    allIncompleteFeatures.forEach((feature) => {
      // Create proper feature object for claimant lookup
      const featureForClaimants = {
        type: "costco" as const,
        tiles: feature.tiles,
        edges: feature.edges,
        isComplete: false,
        pennants: feature.pennants,
      };

      const claimants = board.getFeatureClaimants(featureForClaimants);
      if (claimants.length > 0) {
        // Incomplete Costco scoring: 1 point per tile + 1 point per pennant
        const tilePoints = feature.tiles.size;
        const pennantPoints = feature.pennants;
        const totalPoints = tilePoints + pennantPoints;

        claimants.forEach((playerId: string) => {
          const player = players.find((p) => p.id === playerId);
          if (player) {
            player.score += totalPoints;
          }
        });
      }
    });
  }

  /**
   * Find all incomplete Costco features across the board
   */
  private findAllIncompleteCostcoFeatures(board: IBoard): Array<{
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
    board.getAllTiles().forEach((tileRecord: any, positionKey: string) => {
      if (processedTiles.has(positionKey)) return;

      const position = this.parsePositionKey(positionKey);
      tileRecord.tile.costcoZones.forEach((zone: any) => {
        const visited = new Set<string>();
        const feature = board.traceCostcoFeature(
          position,
          zone,
          visited
        );

        // Only include if feature is incomplete
        if (!board.isCostcoComplete(feature)) {
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
    });

    return allFeatures;
  }

  /**
   * Parse position key string to Position object
   */
  private parsePositionKey(key: string): { x: number; y: number } {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  }
}
