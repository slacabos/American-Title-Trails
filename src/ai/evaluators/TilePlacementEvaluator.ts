/**
 * Tile placement evaluation utilities for AI decision making.
 *
 * Provides scoring methods for tile placements considering:
 * - Feature completion potential
 * - Adjacency benefits
 * - Offensive opportunities (extending own features)
 * - Defensive considerations (blocking opponents)
 * - Board positioning
 */

import type { ITile, IBoard } from "../../interfaces";
import type { Position, PlayerState } from "../../types";
import { GAME_RULES } from "../../constants/gameRules";
import type { RNG } from "../../utils/rng";

/**
 * Weights for different scoring factors.
 */
export interface EvaluationWeights {
  completion: number;
  adjacency: number;
  costcoPreference: number;
  extensionBonus: number;
  blockingBonus: number;
  centerBonus: number;
}

/**
 * Default weights for medium difficulty.
 */
export const DEFAULT_WEIGHTS: EvaluationWeights = {
  completion: 6,
  adjacency: 1,
  costcoPreference: 2,
  extensionBonus: 3,
  blockingBonus: 2,
  centerBonus: 0.5,
};

/**
 * Result of evaluating a tile placement.
 */
export interface PlacementScore {
  position: Position;
  rotation: number;
  totalScore: number;
  breakdown: {
    completionScore: number;
    adjacencyScore: number;
    costcoScore: number;
    extensionScore: number;
    blockingScore: number;
    positionScore: number;
  };
}

/**
 * Evaluates tile placements for AI decision making.
 */
export class TilePlacementEvaluator {
  private readonly weights: EvaluationWeights;
  private readonly rng: RNG;

  constructor(weights: Partial<EvaluationWeights> = {}, rng: RNG = Math.random) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    this.rng = rng;
  }

  /**
   * Evaluate a single tile placement.
   */
  evaluatePlacement(
    board: IBoard,
    tile: ITile,
    position: Position,
    rotation: number,
    currentPlayerId: string,
    allPlayers: PlayerState[]
  ): PlacementScore {
    const rotatedTile = tile.rotate(rotation);

    // Check if placement is valid
    if (!board.canPlace(rotatedTile, position)) {
      return {
        position,
        rotation,
        totalScore: -Infinity,
        breakdown: {
          completionScore: 0,
          adjacencyScore: 0,
          costcoScore: 0,
          extensionScore: 0,
          blockingScore: 0,
          positionScore: 0,
        },
      };
    }

    // Evaluate each factor
    const completionScore = this.evaluateCompletion(board, rotatedTile, position);
    const adjacencyScore = this.evaluateAdjacency(board, position);
    const costcoScore = this.evaluateCostcoPreference(rotatedTile);
    const extensionScore = this.evaluateExtension(
      board,
      rotatedTile,
      position,
      currentPlayerId
    );
    const blockingScore = this.evaluateBlocking(
      board,
      rotatedTile,
      position,
      currentPlayerId,
      allPlayers
    );
    const positionScore = this.evaluatePosition(board, position);

    // Add small random factor to break ties
    const randomFactor = this.rng() * 0.1;

    const totalScore =
      completionScore * this.weights.completion +
      adjacencyScore * this.weights.adjacency +
      costcoScore * this.weights.costcoPreference +
      extensionScore * this.weights.extensionBonus +
      blockingScore * this.weights.blockingBonus +
      positionScore * this.weights.centerBonus +
      randomFactor;

    return {
      position,
      rotation,
      totalScore,
      breakdown: {
        completionScore,
        adjacencyScore,
        costcoScore,
        extensionScore,
        blockingScore,
        positionScore,
      },
    };
  }

  /**
   * Evaluate all placements for a tile and return sorted by score.
   */
  evaluateAllPlacements(
    board: IBoard,
    tile: ITile,
    validPositions: Position[],
    currentPlayerId: string,
    allPlayers: PlayerState[]
  ): PlacementScore[] {
    const scores: PlacementScore[] = [];

    for (const position of validPositions) {
      for (let rotation = 0; rotation < GAME_RULES.TILE_ROTATIONS; rotation++) {
        const score = this.evaluatePlacement(
          board,
          tile,
          position,
          rotation,
          currentPlayerId,
          allPlayers
        );

        if (score.totalScore > -Infinity) {
          scores.push(score);
        }
      }
    }

    // Sort by total score descending
    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Evaluate completion potential - how many points would be scored immediately.
   */
  private evaluateCompletion(
    board: IBoard,
    tile: ITile,
    position: Position
  ): number {
    const preview = board.previewPlacement(tile, position);
    if (!preview) return 0;

    return preview.completed.reduce((total, feature) => {
      return total + feature.points;
    }, 0);
  }

  /**
   * Evaluate adjacency - prefer positions with more neighbors.
   */
  private evaluateAdjacency(board: IBoard, position: Position): number {
    const neighbors = board.getNeighbors(position);
    return Object.keys(neighbors).length;
  }

  /**
   * Evaluate costco preference - bonus for placing Costco tiles.
   */
  private evaluateCostcoPreference(tile: ITile): number {
    return tile.center === "costco" || tile.center === "mixed" ? 1 : 0;
  }

  /**
   * Evaluate extension potential - bonus for extending own claimed features.
   */
  private evaluateExtension(
    board: IBoard,
    _tile: ITile,
    position: Position,
    currentPlayerId: string
  ): number {
    let extensionScore = 0;
    const claims = board.getFeatureClaims();

    // Check if this placement extends any of our claimed features
    const directions = ["north", "east", "south", "west"] as const;

    for (const direction of directions) {
      const neighborPos = this.getNeighborPosition(position, direction);
      const neighbor = board.getTile(neighborPos);

      if (neighbor) {
        // Check if any claim on the neighbor belongs to current player
        const ourClaims = claims.filter(
          (claim) =>
            claim.players.includes(currentPlayerId) &&
            claim.edge.startsWith(`${neighborPos.x},${neighborPos.y}`)
        );

        if (ourClaims.length > 0) {
          extensionScore += 1;
        }
      }
    }

    return extensionScore;
  }

  /**
   * Evaluate blocking potential - bonus for blocking opponent features.
   */
  private evaluateBlocking(
    board: IBoard,
    _tile: ITile,
    position: Position,
    currentPlayerId: string,
    allPlayers: PlayerState[]
  ): number {
    let blockingScore = 0;
    const claims = board.getFeatureClaims();
    const opponentIds = allPlayers
      .filter((p) => p.id !== currentPlayerId)
      .map((p) => p.id);

    // Check if this placement might interfere with opponent features
    const directions = ["north", "east", "south", "west"] as const;

    for (const direction of directions) {
      const neighborPos = this.getNeighborPosition(position, direction);
      const neighbor = board.getTile(neighborPos);

      if (neighbor) {
        // Check if any claim on the neighbor belongs to an opponent
        const opponentClaims = claims.filter(
          (claim) =>
            claim.players.some((p) => opponentIds.includes(p)) &&
            claim.edge.startsWith(`${neighborPos.x},${neighborPos.y}`)
        );

        if (opponentClaims.length > 0) {
          // This placement might affect opponent features
          blockingScore += 0.5;
        }
      }
    }

    return blockingScore;
  }

  /**
   * Evaluate board position - slight preference for central placements.
   */
  private evaluatePosition(board: IBoard, position: Position): number {
    const bounds = board.getBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const distanceFromCenter = Math.sqrt(
      Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2)
    );

    // Invert distance so closer to center = higher score
    return Math.max(0, 5 - distanceFromCenter);
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
