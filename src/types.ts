import type { ITile, IBoard } from "./interfaces";

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
  completed: CompletedFeature[];
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
  tile: ITile;
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

// Game state and player state interfaces
export interface PlayerState {
  id: string;
  name: string;
  isAI: boolean;
  score: number;
  followers: number;
  color: string;
}

export enum GamePhase {
  PLACE_TILE = "place_tile",
  CLAIM_FEATURE = "claim_feature",
  SCORE_FEATURES = "score_features",
  END_TURN = "end_turn",
  GAME_OVER = "game_over",
}

export interface GameState {
  board: IBoard;
  players: PlayerState[];
  currentPlayerIndex: number;
  currentTile?: ITile;
  tileDeck: ITile[];
  discardPile: ITile[];
  phase: GamePhase;
  isGameOver: boolean;
  winner?: string;
  turnNumber: number;
  lastPlacedPosition?: Position;
}

export interface TilePlacementResult {
  success: boolean;
  completedFeatures: CompletedFeature[];
  message?: string;
}

export interface CompletedFeature {
  type: TerrainType;
  tiles: Set<string>;
  edges?: Set<string>;
  isComplete: boolean;
  points: number;
  pennants?: number;
  claimedBy?: string[];
}

export interface ClaimableFeature {
  type: TerrainType;
  identifier?: string;
  displayName?: string;
}

export interface Feature {
  type: TerrainType;
  tiles: Set<string>;
  edges: Set<string>;
  isComplete: boolean;
  pennants?: number;
}

// Type aliases for semantic clarity
export type FeatureForClaimants = Feature;
export type CostcoFeature = Feature;
export type BoardBounds = Bounds;
