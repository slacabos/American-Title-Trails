/**
 * Game rule constants for American Tile Trails.
 * Centralizes all magic numbers for easy configuration and maintenance.
 */
export const GAME_RULES = {
  // Player configuration
  FOLLOWERS_PER_PLAYER: 7,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 5,

  // McDonald's (Monastery) scoring
  MCDONALDS_MAX_SCORE: 9,
  MCDONALDS_SURROUNDING_TILES: 8,
  MCDONALDS_POINTS_PER_TILE: 1,

  // Costco (City) scoring - complete features
  COSTCO_POINTS_PER_TILE_COMPLETE: 2,
  COSTCO_PENNANT_BONUS_COMPLETE: 2,

  // Costco (City) scoring - incomplete features
  COSTCO_POINTS_PER_TILE_INCOMPLETE: 1,
  COSTCO_PENNANT_BONUS_INCOMPLETE: 1,

  // Road scoring
  ROAD_POINTS_PER_TILE: 1,

  // Farmer scoring
  FARMER_POINTS_PER_COSTCO: 3,

  // AI configuration
  AI_MOVE_DELAY_MS: 1000,
  AI_CLAIM_THRESHOLD: 2,

  // AI difficulty defaults
  AI_DEFAULT_DIFFICULTY: "medium" as const,
  AI_EASY_CLAIM_CHANCE: 0.15,
  AI_MEDIUM_MIN_FOLLOWERS: 1,
  AI_HARD_SEARCH_DEPTH: 2,
  AI_HARD_MAX_SEARCH_TIME_MS: 400,
  AI_EXPERT_SEARCH_DEPTH: 3,
  AI_EXPERT_MAX_SEARCH_TIME_MS: 600,

  // Tile configuration
  TILE_ROTATIONS: 4,
} as const;

export type GameRules = typeof GAME_RULES;
