/**
 * SimpleAI - Medium difficulty AI strategy.
 *
 * Evaluates all rotations and positions using weighted heuristics.
 * Considers feature completion, adjacency, and basic meeple strategy.
 */

import type { Position } from "../types";
import type {
  AIStrategy,
  AIDifficulty,
  AIContext,
  TilePlacement,
  MeeplePlacement,
  AIDecision,
} from "./AIStrategy";
import {
  TilePlacementEvaluator,
  FeatureAnalyzer,
} from "./evaluators";
import type { EvaluationWeights } from "./evaluators";
import type { RNG } from "../utils/rng";

/**
 * Configuration options for SimpleAI.
 */
export interface SimpleAIOptions {
  weights?: Partial<EvaluationWeights>;
  minFollowersToKeep?: number;
  rng?: RNG;
}

/**
 * Medium difficulty AI that uses weighted heuristics for decision making.
 */
export class SimpleAI implements AIStrategy {
  public readonly difficulty: AIDifficulty = "medium";

  private readonly evaluator: TilePlacementEvaluator;
  private readonly minFollowersToKeep: number;

  constructor(options: SimpleAIOptions = {}) {
    this.evaluator = new TilePlacementEvaluator(options.weights, options.rng);
    this.minFollowersToKeep = options.minFollowersToKeep ?? 0;
  }

  /**
   * Evaluate all valid tile placements.
   */
  evaluateTilePlacements(context: AIContext): TilePlacement[] {
    const { board, currentTile, currentPlayer, allPlayers, validPlacements } =
      context;

    const scores = this.evaluator.evaluateAllPlacements(
      board,
      currentTile,
      validPlacements,
      currentPlayer.id,
      allPlayers
    );

    return scores.map((score) => ({
      position: score.position,
      rotation: score.rotation,
      score: score.totalScore,
    }));
  }

  /**
   * Evaluate meeple placement decision.
   */
  evaluateMeeplePlacement(
    context: AIContext,
    placedPosition: Position
  ): MeeplePlacement | null {
    const { board, currentPlayer, claimableFeatures, gameState } = context;

    // Don't claim if we need to keep followers in reserve
    if (currentPlayer.followers <= this.minFollowersToKeep) {
      return null;
    }

    if (claimableFeatures.length === 0) {
      return null;
    }

    const analyzer = new FeatureAnalyzer(board);
    let bestClaim: MeeplePlacement | null = null;
    let bestScore = 0;

    // Score thresholds for different feature types
    const featureThresholds = {
      mcdonalds: 4.5, // High value - monastery equivalent
      costco: 4, // High value - city equivalent
      road: 2, // Lower priority
      field: 1, // Farmers - only late game
    };

    for (const feature of claimableFeatures) {
      const estimate = analyzer.estimateFeatureValue(
        feature.type,
        placedPosition,
        feature.identifier
      );

      // Apply feature-specific scoring
      let score = estimate.totalValue;

      // Bonus for high completion chance
      if (estimate.completionChance > 0.7) {
        score *= 1.3;
      }

      // McDonald's bonus when well-positioned
      if (feature.type === "mcdonalds" && estimate.currentPoints >= 5) {
        score *= 1.5;
      }

      // Costco bonus for larger features
      if (feature.type === "costco" && estimate.currentPoints >= 4) {
        score *= 1.2;
      }

      // Avoid fields early game (farmers score only at end)
      if (feature.type === "field") {
        const totalTiles = 72; // Approximate total tiles
        const tilesRemaining = gameState.tileDeck.length;
        const gameProgress = 1 - tilesRemaining / totalTiles;

        // Only consider fields in late game (>60% through)
        if (gameProgress < 0.6) {
          score = 0;
        } else {
          score *= gameProgress; // Scale with game progress
        }
      }

      const threshold =
        featureThresholds[feature.type as keyof typeof featureThresholds] || 3;

      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestClaim = {
          type: feature.type,
          identifier: feature.identifier,
          score,
          shouldClaim: true,
        };
      }
    }

    return bestClaim;
  }

  /**
   * Get the best complete decision for a turn.
   */
  getBestMove(context: AIContext): AIDecision | null {
    const tilePlacements = this.evaluateTilePlacements(context);

    if (tilePlacements.length === 0) {
      return null;
    }

    const bestTilePlacement = tilePlacements[0];

    return {
      tilePlacement: bestTilePlacement,
      meeplePlacement: null, // Will be evaluated after tile placement
    };
  }
}
