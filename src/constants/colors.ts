// Game color hex values — single source of truth for runtime JS usage.
// Tailwind classes use CSS variables defined in index.css @theme.

export const GAME_COLORS = {
  primary: "#E84B26",
  accent: "#F9D65B",
  asphalt: "#2C3039",
  costco: "#4169E1",
  grass: "#6E7F4F",
  road: "#474B52",
  neutral: "#1F2229",
  text: "#f1faee",
  foreground: "#f1faee",
} as const;

// Tile-specific color mapping for easy reference
export const TILE_COLORS = {
  field: GAME_COLORS.grass,
  road: GAME_COLORS.road,
  costco: GAME_COLORS.costco,
  mcdonalds: GAME_COLORS.accent,
  pennantGold: GAME_COLORS.accent,
  pennantOrange: GAME_COLORS.primary,
} as const;

// Player colors - used for player identification in setup and game UI
export const PLAYER_COLORS = [
  "#ff595e", // Red
  "#1982c4", // Blue
  "#ffca3a", // Yellow
  "#6a4c93", // Purple
  "#43aa8b", // Green
] as const;

// UI color mapping for components
export const UI_COLORS = {
  background: GAME_COLORS.neutral,
  card: GAME_COLORS.asphalt,
  muted: GAME_COLORS.road,
  border: `rgba(241, 250, 238, 0.1)`,
  accent: GAME_COLORS.accent,
  primary: GAME_COLORS.primary,
  text: GAME_COLORS.text,
} as const;
