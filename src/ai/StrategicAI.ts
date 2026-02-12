/**
 * StrategicAI - Hard difficulty AI strategy.
 *
 * Uses look-ahead evaluation with expectimax-style search.
 * Considers defensive play and follower management.
 */

import type { Position, PlayerState } from "../types";
import type { IBoard, ITile } from "../interfaces";
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
 * Configuration options for StrategicAI.
 */
export interface StrategicAIOptions {
  weights?: Partial<EvaluationWeights>;
  searchDepth?: number;
  maxSearchTimeMs?: number;
  defensiveWeight?: number;
  rng?: RNG;
  claimThresholdScale?: number;
}

/**
 * Hard difficulty AI with look-ahead search and defensive play.
 */
export class StrategicAI implements AIStrategy {
  public readonly difficulty: AIDifficulty = "hard";

  private readonly evaluator: TilePlacementEvaluator;
  private readonly searchDepth: number;
  private readonly maxSearchTimeMs: number;
  private readonly defensiveWeight: number;
  private readonly claimThresholdScale: number;
  private searchStartTime: number = 0;

  constructor(options: StrategicAIOptions = {}) {
    // Enhanced weights for strategic play
    const strategicWeights: Partial<EvaluationWeights> = {
      completion: 4.5,
      adjacency: 1.0,
      costcoPreference: 1.9,
      extensionBonus: 2.2,
      blockingBonus: 1.6,
      centerBonus: 0.2,
      ...options.weights,
    };

    this.evaluator = new TilePlacementEvaluator(strategicWeights, options.rng);
    this.searchDepth = options.searchDepth ?? 2;
    this.maxSearchTimeMs = options.maxSearchTimeMs ?? 400;
    this.defensiveWeight = options.defensiveWeight ?? 1.0;
    this.claimThresholdScale = options.claimThresholdScale ?? 1.7;
  }

  /**
   * Evaluate tile placements with look-ahead.
   */
  evaluateTilePlacements(context: AIContext): TilePlacement[] {
    this.searchStartTime = Date.now();

    const { board, currentTile, currentPlayer, allPlayers, validPlacements } =
      context;

    // Get base evaluations
    const baseScores = this.evaluator.evaluateAllPlacements(
      board,
      currentTile,
      validPlacements,
      currentPlayer.id,
      allPlayers
    );

    // Apply strategic adjustments
    const strategicScores = baseScores.map((score) => {
      let adjustedScore = score.totalScore;

      // Defensive analysis
      adjustedScore += this.evaluateDefensiveValue(
        board,
        currentTile.rotate(score.rotation),
        score.position,
        currentPlayer,
        allPlayers
      );

      // Look-ahead bonus (if time permits)
      if (!this.isTimeExceeded()) {
        adjustedScore += this.evaluateLookAhead(
          board,
          currentTile.rotate(score.rotation),
          score.position,
          currentPlayer,
          allPlayers
        );
      }

      return {
        position: score.position,
        rotation: score.rotation,
        score: adjustedScore,
      };
    });

    // Sort by strategic score
    return strategicScores.sort((a, b) => b.score - a.score);
  }

  /**
   * Evaluate meeple placement with strategic considerations.
   */
  evaluateMeeplePlacement(
    context: AIContext,
    placedPosition: Position
  ): MeeplePlacement | null {
    const { board, currentPlayer, claimableFeatures, gameState } = context;

    // Strategic follower management
    const followerThreshold = this.calculateFollowerThreshold(
      currentPlayer,
      gameState
    );

    if (currentPlayer.followers <= followerThreshold) {
      return null;
    }

    if (claimableFeatures.length === 0) {
      return null;
    }

    const analyzer = new FeatureAnalyzer(board);
    let bestClaim: MeeplePlacement | null = null;
    let bestScore = 0;

    // Higher thresholds for strategic claiming
    const thresholds = {
      mcdonalds: 5,
      costco: 5.5,
      road: 3.5,
      field: 2.5,
    };

    for (const feature of claimableFeatures) {
      const estimate = analyzer.estimateFeatureValue(
        feature.type,
        placedPosition,
        feature.identifier
      );

      let score = estimate.totalValue;

      // Strategic scoring adjustments
      score = this.applyStrategicMeepleModifiers(
        score,
        feature,
        estimate,
        gameState,
        currentPlayer
      );

      const baseThreshold =
        thresholds[feature.type as keyof typeof thresholds] || 4;
      const threshold = baseThreshold * this.claimThresholdScale;

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
   * Get the best strategic move for a turn.
   */
  getBestMove(context: AIContext): AIDecision | null {
    const tilePlacements = this.evaluateTilePlacements(context);

    if (tilePlacements.length === 0) {
      return null;
    }

    return {
      tilePlacement: tilePlacements[0],
      meeplePlacement: null,
    };
  }

  /**
   * Evaluate defensive value of a placement.
   */
  private evaluateDefensiveValue(
    board: IBoard,
    tile: ITile,
    position: Position,
    currentPlayer: PlayerState,
    allPlayers: PlayerState[]
  ): number {
    let defensiveScore = 0;
    const claims = board.getFeatureClaims();
    const opponentIds = allPlayers
      .filter((p) => p.id !== currentPlayer.id)
      .map((p) => p.id);

    // Check for opportunities to join opponent features (majority rule competition)
    const preview = board.previewPlacement(tile, position);
    if (preview) {
      for (const completed of preview.completed) {
        if (completed.claimedBy) {
          const opponentClaims = completed.claimedBy.filter((id) =>
            opponentIds.includes(id)
          );
          const ourClaims = completed.claimedBy.filter(
            (id) => id === currentPlayer.id
          );

          // Bonus for completing features that benefit us over opponents
          if (ourClaims.length >= opponentClaims.length && ourClaims.length > 0) {
            defensiveScore += completed.points * 0.35 * this.defensiveWeight;
          }

          // Penalty for completing features that only benefit opponents
          if (opponentClaims.length > 0 && ourClaims.length === 0) {
            defensiveScore -= completed.points * 0.45 * this.defensiveWeight;
          }
        }
      }
    }

    // Check for blocking high-value opponent features
    const directions = ["north", "east", "south", "west"] as const;

    for (const direction of directions) {
      const neighborPos = this.getNeighborPosition(position, direction);
      const neighbor = board.getTile(neighborPos);

      if (neighbor) {
        // Check for opponent claims near this position
        const opponentClaimsNearby = claims.filter(
          (claim) =>
            claim.players.some((p) => opponentIds.includes(p)) &&
            claim.edge.startsWith(`${neighborPos.x},${neighborPos.y}`)
        );

        for (const claim of opponentClaimsNearby) {
          // Penalize helping opponent complete features
          // Bonus for potentially blocking them
          if (claim.type === "costco") {
            defensiveScore += this.defensiveWeight * 0.3;
          }
        }
      }
    }

    return defensiveScore;
  }

  /**
   * Simple look-ahead evaluation.
   */
  private evaluateLookAhead(
    board: IBoard,
    tile: ITile,
    position: Position,
    currentPlayer: PlayerState,
    _allPlayers: PlayerState[]
  ): number {
    if (this.searchDepth < 1) return 0;

    // Preview the placement
    const preview = board.previewPlacement(tile, position);
    if (!preview) return 0;

    let lookAheadScore = 0;

    // Evaluate immediate scoring potential
    for (const completed of preview.completed) {
      if (completed.claimedBy?.includes(currentPlayer.id)) {
        lookAheadScore += completed.points * 0.3;
      }
    }

    // Evaluate future completion potential
    // (simplified - just check if placement creates good continuation opportunities)
    const futurePotential = this.estimateFuturePotential(
      board,
      tile,
      position,
      currentPlayer.id
    );
    lookAheadScore += futurePotential * 0.2;

    return lookAheadScore;
  }

  /**
   * Estimate future potential from a placement.
   */
  private estimateFuturePotential(
    board: IBoard,
    tile: ITile,
    position: Position,
    _playerId: string
  ): number {
    let potential = 0;

    // Bonus for creating open features that we could continue
    if (tile.costcoZones.length > 0) {
      potential += tile.costcoZones.length * 2;
    }

    if (tile.roadConnections.length > 0) {
      potential += tile.roadConnections.length * 1;
    }

    if (tile.hasMcDonalds) {
      // McDonald's potential based on surrounding empty spaces
      const surroundingEmpty = this.countEmptySurrounding(board, position);
      if (surroundingEmpty >= 6) {
        potential += 4; // Good McDonald's position
      }
    }

    return potential;
  }

  /**
   * Count empty spaces surrounding a position.
   */
  private countEmptySurrounding(board: IBoard, position: Position): number {
    const surroundingPositions = [
      { x: position.x - 1, y: position.y - 1 },
      { x: position.x, y: position.y - 1 },
      { x: position.x + 1, y: position.y - 1 },
      { x: position.x - 1, y: position.y },
      { x: position.x + 1, y: position.y },
      { x: position.x - 1, y: position.y + 1 },
      { x: position.x, y: position.y + 1 },
      { x: position.x + 1, y: position.y + 1 },
    ];

    return surroundingPositions.filter(
      (pos) => board.getTile(pos) === undefined
    ).length;
  }

  /**
   * Calculate follower threshold based on game state.
   */
  private calculateFollowerThreshold(
    _player: PlayerState,
    gameState: any
  ): number {
    const totalTiles = 72;
    const tilesRemaining = gameState.tileDeck?.length ?? 0;
    const gameProgress = 1 - tilesRemaining / totalTiles;

    // Early game: keep more followers in reserve
    if (gameProgress < 0.3) {
      return 1;
    }

    // Mid game: balanced approach
    if (gameProgress < 0.7) {
      return 1;
    }

    // Late game: use followers more aggressively
    return 0;
  }

  /**
   * Apply strategic modifiers to meeple placement scoring.
   */
  private applyStrategicMeepleModifiers(
    score: number,
    feature: any,
    estimate: any,
    gameState: any,
    player: PlayerState
  ): number {
    let adjustedScore = score;

    // High completion chance bonus
    if (estimate.completionChance > 0.8) {
      adjustedScore *= 1.5;
    } else if (estimate.completionChance < 0.3) {
      adjustedScore *= 0.5;
    }

    // McDonald's strategic value
    if (feature.type === "mcdonalds") {
      if (estimate.currentPoints >= 6) {
        adjustedScore *= 1.6; // Very well positioned
      } else if (estimate.currentPoints >= 4) {
        adjustedScore *= 1.25;
      }
    }

    // Large Costco bonus
    if (feature.type === "costco" && estimate.currentPoints >= 6) {
      adjustedScore *= 1.4;
    }

    // Field strategy - only late game
    if (feature.type === "field") {
      const totalTiles = 72;
      const tilesRemaining = gameState.tileDeck?.length ?? 0;
      const gameProgress = 1 - tilesRemaining / totalTiles;

      if (gameProgress < 0.5) {
        adjustedScore = 0; // No fields early/mid game
      } else {
        // Scale field value with game progress
        adjustedScore *= gameProgress * 1.5;
      }
    }

    // Last follower protection
    if (player.followers <= 1) {
      // Only use last follower for very high value features
      if (adjustedScore < 10) {
        adjustedScore = 0;
      }
    }

    return adjustedScore;
  }

  /**
   * Check if search time has been exceeded.
   */
  private isTimeExceeded(): boolean {
    return Date.now() - this.searchStartTime > this.maxSearchTimeMs;
  }

  /**
   * Get neighbor position in a direction.
   */
  private getNeighborPosition(
    position: Position,
    direction: string
  ): Position {
    const deltas: Record<string, Position> = {
      north: { x: 0, y: -1 },
      east: { x: 1, y: 0 },
      south: { x: 0, y: 1 },
      west: { x: -1, y: 0 },
    };

    const delta = deltas[direction] || { x: 0, y: 0 };
    return { x: position.x + delta.x, y: position.y + delta.y };
  }
}

/**
 * ExpertAI - Enhanced StrategicAI with additional heuristics.
 * Uses the same core logic but with more aggressive weights.
 */
export class ExpertAI extends StrategicAI {
  public readonly difficulty: AIDifficulty = "expert";

  constructor(options: StrategicAIOptions = {}) {
    super({
      weights: {
        completion: 13,
        adjacency: 2.2,
        costcoPreference: 5,
        extensionBonus: 8,
        blockingBonus: 6.5,
        centerBonus: 0.6,
        ...(options.weights ?? {}),
      },
      searchDepth: options.searchDepth ?? 3,
      maxSearchTimeMs: options.maxSearchTimeMs ?? 600,
      defensiveWeight: options.defensiveWeight ?? 3.2,
      claimThresholdScale: options.claimThresholdScale ?? 0.9,
      rng: options.rng,
    });
  }
}
