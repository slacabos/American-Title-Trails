/**
 * AI Strategy interface and types for American Title Trails.
 *
 * This module defines the contract that all AI implementations must follow,
 * enabling a strategy pattern for different difficulty levels.
 */

import type { ITile, IBoard } from "../interfaces";
import type {
  Position,
  TerrainType,
  PlayerState,
  GameState,
  ClaimableFeature,
} from "../types";

/**
 * Represents a potential tile placement with its evaluation score.
 */
export interface TilePlacement {
  position: Position;
  rotation: number;
  score: number;
}

/**
 * Represents a potential meeple/follower placement decision.
 */
export interface MeeplePlacement {
  type: TerrainType;
  identifier?: string;
  score: number;
  shouldClaim: boolean;
}

/**
 * Complete AI decision for a turn.
 */
export interface AIDecision {
  tilePlacement: TilePlacement;
  meeplePlacement: MeeplePlacement | null;
}

/**
 * Context provided to AI strategies for decision making.
 */
export interface AIContext {
  board: IBoard;
  currentTile: ITile;
  currentPlayer: PlayerState;
  allPlayers: PlayerState[];
  validPlacements: Position[];
  claimableFeatures: ClaimableFeature[];
  gameState: GameState;
}

/**
 * AI difficulty levels.
 */
export type AIDifficulty = "easy" | "medium" | "hard" | "expert";

/**
 * Interface that all AI strategies must implement.
 *
 * Each strategy evaluates the game state and returns scored placements
 * for both tiles and meeples, allowing the game engine to execute the
 * best move according to the AI's evaluation.
 */
export interface AIStrategy {
  /**
   * The difficulty level this strategy represents.
   */
  readonly difficulty: AIDifficulty;

  /**
   * Evaluate all valid tile placements and return them sorted by score (best first).
   *
   * @param context - The current game context for decision making
   * @returns Array of tile placements sorted by score (descending)
   */
  evaluateTilePlacements(context: AIContext): TilePlacement[];

  /**
   * Evaluate whether and where to place a meeple after tile placement.
   *
   * @param context - The current game context (after tile has been placed)
   * @param placedPosition - Where the tile was just placed
   * @returns Meeple placement decision, or null if no meeple should be placed
   */
  evaluateMeeplePlacement(
    context: AIContext,
    placedPosition: Position
  ): MeeplePlacement | null;

  /**
   * Get the best complete decision for a turn.
   * This is a convenience method that combines tile and meeple evaluation.
   *
   * @param context - The current game context
   * @returns The best AI decision, or null if no valid move exists
   */
  getBestMove(context: AIContext): AIDecision | null;
}
