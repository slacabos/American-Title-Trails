/**
 * RandomAI - Easy difficulty AI strategy.
 *
 * Makes random valid moves with minimal strategy.
 * Good for beginners or casual play.
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
import { GAME_RULES } from "../constants/gameRules";
import type { RNG } from "../utils/rng";

/**
 * Configuration options for RandomAI.
 */
export interface RandomAIOptions {
  claimChance?: number; // Probability of claiming any feature (0-1)
  rng?: RNG;
}

/**
 * Easy difficulty AI that makes random valid moves.
 */
export class RandomAI implements AIStrategy {
  public readonly difficulty: AIDifficulty = "easy";

  private readonly claimChance: number;
  private readonly rng: RNG;

  constructor(options: RandomAIOptions = {}) {
    this.claimChance = options.claimChance ?? GAME_RULES.AI_EASY_CLAIM_CHANCE;
    this.rng = options.rng ?? Math.random;
  }

  /**
   * Evaluate tile placements - assigns random scores to valid placements.
   */
  evaluateTilePlacements(context: AIContext): TilePlacement[] {
    const { board, currentTile, validPlacements } = context;
    const placements: TilePlacement[] = [];

    for (const position of validPlacements) {
      for (let rotation = 0; rotation < GAME_RULES.TILE_ROTATIONS; rotation++) {
        const rotatedTile = currentTile.rotate(rotation);

        if (board.canPlace(rotatedTile, position)) {
          placements.push({
            position,
            rotation,
            score: this.rng(), // Random score
          });
        }
      }
    }

    // Sort by random score
    return placements.sort((a, b) => b.score - a.score);
  }

  /**
   * Evaluate meeple placement - random chance to claim any feature.
   */
  evaluateMeeplePlacement(
    context: AIContext,
    _placedPosition: Position
  ): MeeplePlacement | null {
    const { currentPlayer, claimableFeatures } = context;

    // Need at least one follower to claim
    if (currentPlayer.followers <= 0) {
      return null;
    }

    if (claimableFeatures.length === 0) {
      return null;
    }

    // Random chance to claim
    if (this.rng() > this.claimChance) {
      return null;
    }

    // Pick a random claimable feature
    const randomIndex = Math.floor(this.rng() * claimableFeatures.length);
    const feature = claimableFeatures[randomIndex];

    return {
      type: feature.type,
      identifier: feature.identifier,
      score: this.rng(),
      shouldClaim: true,
    };
  }

  /**
   * Get the best (random) move for a turn.
   */
  getBestMove(context: AIContext): AIDecision | null {
    const tilePlacements = this.evaluateTilePlacements(context);

    if (tilePlacements.length === 0) {
      return null;
    }

    // Pick a random placement from valid options
    const randomIndex = Math.floor(
      this.rng() * Math.min(tilePlacements.length, 5)
    );
    const tilePlacement = tilePlacements[randomIndex];

    return {
      tilePlacement,
      meeplePlacement: null, // Will be evaluated after tile placement
    };
  }
}
