// Game color palette - centralized color constants
// These colors match the design system defined in tailwind.config.js

export const GAME_COLORS = {
  // Primary theme colors
  primary: "#E84B26", // Bright orange-red - Action buttons, key highlights
  accent: "#F9D65B", // Warm yellow - Headings, neon edges, focus rings
  asphalt: "#2C3039", // Blue-gray - Backgrounds, road textures
  costco: "#4169E1", // Soft coral - Costco buildings
  grass: "#6E7F4F", // Olive green - Map elements, tiles
  road: "#474B52", // Neutral gray - Secondary surfaces
  neutral: "#1F2229", // Deep navy-gray - App shell, footer, dark UI

  // Text colors
  text: "#f1faee", // Light text color for contrast

  // Legacy/computed colors
  foreground: "#f1faee",
} as const;

// Tile-specific color mapping for easy reference
export const TILE_COLORS = {
  field: GAME_COLORS.grass, // Background fields
  road: GAME_COLORS.road, // Roads
  costco: GAME_COLORS.costco, // Costco areas
  mcdonalds: GAME_COLORS.accent, // McDonald's
  pennantGold: GAME_COLORS.accent, // Follower pennants
  pennantOrange: GAME_COLORS.primary, // Follower pennants
} as const;

// UI color mapping for components
export const UI_COLORS = {
  background: GAME_COLORS.neutral,
  card: GAME_COLORS.asphalt,
  muted: GAME_COLORS.road,
  border: `rgba(241, 250, 238, 0.1)`, // Light border with transparency
  accent: GAME_COLORS.accent,
  primary: GAME_COLORS.primary,
  text: GAME_COLORS.text,
} as const;
