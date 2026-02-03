import {
  Position,
  TileRecord,
  FeatureClaim,
  CostcoSegment,
  FeatureForClaimants,
  CostcoFeature,
  BoardBounds,
  CompletedFeature,
  Feature,
  TerrainType,
  FieldSegment,
} from "../types";
import { ITile } from "./ITile";

/**
 * IBoard interface defines the contract for the game board.
 *
 * The board manages tile placement, feature tracking, and completion detection.
 * This interface enables dependency injection and type-safe access to board
 * methods from managers like ScoreManager.
 */
export interface IBoard {
  /**
   * Check if the board is empty (no tiles placed).
   */
  isEmpty(): boolean;

  /**
   * Get the tile record at a specific position.
   *
   * @param position - The board position to check
   * @returns The tile record if present, undefined otherwise
   */
  getTile(position: Position): TileRecord | undefined;

  /**
   * Get all neighboring tiles around a position.
   *
   * @param position - The center position
   * @returns Record of neighbors by direction
   */
  getNeighbors(position: Position): Record<string, { position: Position; tile: ITile }>;

  /**
   * Get the bounding box of all placed tiles.
   *
   * @returns The bounds containing all tiles
   */
  getBounds(): BoardBounds;

  /**
   * Get all valid positions where a tile could potentially be placed.
   *
   * @returns Array of candidate positions
   */
  getPlacementCandidates(): Position[];

  /**
   * Check if a tile can be legally placed at a position.
   *
   * @param tile - The tile to place
   * @param position - The target position
   * @returns True if placement is valid
   */
  canPlace(tile: ITile, position: Position): boolean;

  /**
   * Place a tile on the board and analyze completed features.
   *
   * @param tile - The tile to place
   * @param position - The position to place it
   * @returns Result containing completed features
   * @throws Error if placement is invalid
   */
  placeTile(tile: ITile, position: Position): { completed: CompletedFeature[] };

  /**
   * Claim a feature on a placed tile.
   *
   * @param type - The terrain type being claimed
   * @param position - The position of the tile
   * @param identifier - Optional identifier for the specific feature
   * @param playerId - The player making the claim
   * @returns The claim result
   */
  claimFeature(
    type: string,
    position: Position,
    identifier: string | undefined,
    playerId: string
  ): FeatureClaim;

  /**
   * Get all current feature claims on the board.
   *
   * @returns Array of all active feature claims
   */
  getFeatureClaims(): FeatureClaim[];

  /**
   * Preview what features would complete if a tile were placed.
   *
   * @param tile - The tile to preview
   * @param position - The position to preview at
   * @returns Preview result or null if invalid placement
   */
  previewPlacement(tile: ITile, position: Position): { completed: CompletedFeature[] } | null;

  /**
   * Remove a follower from a claimed feature.
   *
   * @param edge - The edge identifier of the claim
   */
  removeFollower(edge: string): void;

  /**
   * Return all followers from completed features to their owners.
   *
   * @param completed - Array of completed features
   */
  returnFollowersFromCompletedFeatures(completed: CompletedFeature[]): void;

  /**
   * Get all player IDs that have claimed a feature.
   * This method is used by ScoreManager for scoring.
   *
   * @param feature - The feature to check for claimants
   * @returns Array of player IDs who have claimed this feature
   */
  getFeatureClaimants(feature: FeatureForClaimants): string[];

  /**
   * Trace a complete Costco feature starting from a position and zone.
   * This method is used by ScoreManager for final scoring.
   *
   * @param position - Starting position
   * @param zone - The Costco zone to trace from
   * @param visited - Set of already visited feature keys
   * @returns The complete Costco feature
   */
  traceCostcoFeature(
    position: Position,
    zone: CostcoSegment,
    visited: Set<string>
  ): CostcoFeature;

  /**
   * Check if a Costco feature is complete (fully enclosed).
   * This method is used by ScoreManager for final scoring.
   *
   * @param feature - The Costco feature to check
   * @returns True if the Costco is complete
   */
  isCostcoComplete(feature: CostcoFeature): boolean;

  /**
   * Check if a feature can be claimed (no existing followers on connected feature).
   *
   * @param type - The terrain type being checked
   * @param position - The position of the tile
   * @param identifier - Optional identifier for the specific feature
   * @returns True if the feature can be claimed
   */
  canClaimFeature(
    type: TerrainType,
    position: Position,
    identifier: string | undefined
  ): boolean;

  /**
   * Trace a complete road feature starting from a position and connection.
   *
   * @param position - Starting position
   * @param connection - The road connection segments to trace from
   * @param visited - Set of already visited feature keys
   * @returns The complete road feature
   */
  traceRoadFeature(
    position: Position,
    connection: string[],
    visited: Set<string>
  ): Feature;

  /**
   * Get all tiles on the board.
   * This method is used by ScoreManager to iterate through tiles.
   *
   * @returns Map of position keys to tile records
   */
  getAllTiles(): Map<string, TileRecord>;

  /**
   * Trace a complete field feature starting from a position and field segment.
   * This method is used for farmer placement and scoring.
   *
   * @param position - Starting position
   * @param fieldSegment - The field segment to trace from
   * @param visited - Set of already visited feature keys
   * @returns The complete field feature
   */
  traceFieldFeature(
    position: Position,
    fieldSegment: FieldSegment,
    visited: Set<string>
  ): Feature;

  /**
   * Find all completed Costco features adjacent to a field feature.
   * This method is used for farmer scoring at game end.
   *
   * @param fieldFeature - The field feature to check adjacency for
   * @returns Set of unique Costco feature identifiers
   */
  findAdjacentCostcos(fieldFeature: Feature): Set<string>;
}
