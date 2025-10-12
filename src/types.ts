export type Direction = "north" | "east" | "south" | "west";

export type TerrainType = "road" | "field" | "costco" | "mcdonalds" | "mixed";

export interface Position {
  x: number;
  y: number;
}

export interface TileEdges {
  north: TerrainType;
  east: TerrainType;
  south: TerrainType;
  west: TerrainType;
}

export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface CostcoZoneDefinition {
  /**
   * Unique identifier for the Costco area on the tile. Used for follower placement
   * and feature tracking.
   */
  id: string;
  /**
   * Cardinal directions (and optional center) that the zone touches. These drive
   * connection logic between neighbouring tiles.
   */
  edges: Array<Direction | "center">;
  /**
   * Normalized polygon describing the visual footprint of the Costco segment. The
   * polygon uses coordinates in the [0,1] range and is rotated together with the tile.
   */
  polygon: NormalizedPoint[];
  /**
   * Number of pennant markers present in the zone (awards bonus points when the
   * Costco is completed).
   */
  pennants?: number;
}

export interface TileDefinition {
  id: string;
  name: string;
  edges: TileEdges;
  center: TerrainType;
  roadConnections: string[][];
  costcoZones: CostcoZoneDefinition[];
  isStart?: boolean;
}

export interface PlayerOptions {
  id?: string;
  followers?: number;
  isAI?: boolean;
  color?: string;
}

export interface PlayerDefinition {
  name: string;
  id?: string;
  followers?: number;
  isAI?: boolean;
  color?: string;
}

export interface GameOptions {
  startingPlayer?: number;
}

export interface FollowerPlacement {
  type: TerrainType;
  identifier?: string;
}

export interface PlacementOptions {
  rotation?: number;
  follower?: FollowerPlacement;
}

export interface PlacementResult {
  completed: any[];
  scored: ScoringEvent[];
}

export interface ScoringEvent {
  player: string;
  feature: string;
  points: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface TileRecord {
  position: Position;
  tile: any; // Will be properly typed when we convert Tile class
}

export interface FeatureClaim {
  edge: string;
  type: string;
  players: string[];
}

export interface AIMove {
  position: Position;
  rotation: number;
  follower?: FollowerPlacement | null;
}
