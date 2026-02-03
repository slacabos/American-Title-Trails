import { Direction, TerrainType, CostcoSegment, FieldSegment } from "../types";

/**
 * ITile interface defines the contract for tile objects in American Tile Trails.
 *
 * Tiles are immutable - rotation and cloning create new instances.
 * This interface enables dependency injection and avoids circular dependencies
 * between the Tile class and type definitions.
 */
export interface ITile {
  /**
   * Unique identifier for the tile type (e.g., "road-straight", "costco-2").
   */
  readonly id: string;

  /**
   * Human-readable tile name (e.g., "Straight Highway", "Costco Shopping Center").
   */
  readonly name: string;

  /**
   * Terrain type at the center of the tile.
   */
  readonly center: TerrainType;

  /**
   * Road connection definitions showing which edges are connected by roads.
   * Each inner array represents one continuous road path.
   * Example: [["north", "south"]] means a road connects the north and south edges.
   */
  readonly roadConnections: string[][];

  /**
   * Costco zone definitions with segments and pennant flags.
   * Each zone represents a distinct Costco area on the tile.
   */
  readonly costcoZones: CostcoSegment[];

  /**
   * Field segment definitions with corner assignments.
   * Each segment represents a distinct grass area on the tile.
   */
  readonly fieldSegments: FieldSegment[];

  /**
   * Whether this tile has a McDonald's restaurant at its center.
   * Computed from the center terrain type.
   */
  readonly hasMcDonalds: boolean;

  /**
   * Whether this is the starting tile for the game.
   */
  readonly isStart: boolean;

  /**
   * Current rotation state of the tile.
   * - 0: No rotation (0°)
   * - 1: Rotated 90° clockwise
   * - 2: Rotated 180°
   * - 3: Rotated 270° clockwise (90° counter-clockwise)
   */
  readonly orientation: number;

  /**
   * Get the terrain type at the specified edge direction.
   *
   * @param direction - The cardinal direction (north, east, south, west)
   * @returns The terrain type at that edge
   * @throws Error if the direction is invalid
   */
  getEdge(direction: Direction): TerrainType;

  /**
   * Create a rotated copy of this tile.
   * Rotation is applied clockwise in 90° increments.
   * Negative values rotate counter-clockwise.
   *
   * @param times - Number of 90° clockwise rotations (can be negative for counter-clockwise)
   * @returns A new tile instance with the specified rotation applied
   *
   * @example
   * const rotated = tile.rotate(1);  // Rotate 90° clockwise
   * const flipped = tile.rotate(2);  // Rotate 180°
   * const ccw = tile.rotate(-1);     // Rotate 90° counter-clockwise
   */
  rotate(times: number): ITile;

  /**
   * Create an exact copy of this tile with identical properties.
   *
   * @returns A new tile instance with the same state
   */
  clone(): ITile;
}
