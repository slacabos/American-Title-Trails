import { PlayerState } from "../types";
import { Board } from "../board";

/**
 * ScoreManager handles all scoring logic for the game.
 * Responsibilities:
 * - Score completed features during gameplay
 * - Calculate final scores at game end
 * - Manage scoring rules and point calculations
 */
export class ScoreManager {
  /**
   * Scores completed features and updates player scores
   * @param completedFeatures - Array of completed features from board
   * @param players - Array of player states to update
   */
  public scoreCompletedFeatures(
    completedFeatures: any[],
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
   * Calculates final scores for incomplete features at game end
   * @param board - Game board containing all placed tiles
   * @param players - Array of player states to update
   */
  public calculateFinalScores(board: Board, players: PlayerState[]): void {
    // Score incomplete features
    const claims = board.getFeatureClaims();

    claims.forEach((claim) => {
      const player = players.find((p) => claim.players.includes(p.id));
      if (player) {
        if (claim.type === "costco") {
          // TODO: Implement proper incomplete Costco scoring with pennants
          // For now, use simplified scoring: 1 point per tile + 1 point for pennant if present
          player.score += 2; // Temporary simplified scoring
        } else {
          // Other features: simplified final scoring - 1 point per tile
          player.score += 1;
        }
      }
    });
  }

  /**
   * Determines the winner(s) based on final scores
   * @param players - Array of player states
   * @returns Winner name(s), including tie notation if applicable
   */
  public determineWinner(players: PlayerState[]): string {
    const maxScore = Math.max(...players.map((p) => p.score));
    const winners = players.filter((p) => p.score === maxScore);

    if (winners.length === 1) {
      return winners[0].name;
    } else {
      return winners.map((w) => w.name).join(", ") + " (tie)";
    }
  }

  /**
   * Calculates points for a specific feature type
   * Used for previews and what-if scenarios
   * @param featureType - Type of feature to score
   * @param tileCount - Number of tiles in the feature
   * @param hasPennant - Whether feature has a pennant/bonus
   * @param isComplete - Whether feature is complete
   * @returns Point value for the feature
   */
  public calculateFeaturePoints(
    featureType: string,
    tileCount: number,
    hasPennant: boolean = false,
    isComplete: boolean = true
  ): number {
    switch (featureType) {
      case "road":
        return isComplete ? tileCount : Math.floor(tileCount / 2);

      case "costco":
        const basePoints = isComplete ? 2 : 1;
        const pennantPoints = hasPennant ? (isComplete ? 2 : 1) : 0;
        return tileCount * basePoints + pennantPoints;

      case "mcdonalds":
        // McDonalds are worth 9 points when complete (surrounded by 8 tiles)
        return isComplete ? 9 : 0;

      case "field":
        // Fields score based on adjacent completed Costcos at end of game
        // This is calculated separately in final scoring
        return 0;

      default:
        return 0;
    }
  }
}
