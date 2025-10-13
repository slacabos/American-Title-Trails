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

export interface CostcoSegment {
  id: string; // Unique identifier for this segment within the tile
  segments: (Direction | "center")[]; // List of directions and areas this segment covers
  hasPennant?: boolean; // Whether this segment has a pennant for bonus scoring
  shape?: "curved" | "straight" | "complex"; // Shape type for rendering
}

export interface TileDefinition {
  id: string;
  name: string;
  edges: TileEdges;
  center: TerrainType;
  roadConnections: string[][];
  costcoZones: CostcoSegment[]; // Changed from string[][] to support complex areas
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
