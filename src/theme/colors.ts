// Central color palette (TypeScript) - single source of truth for app colors
export const PALETTE = [
  '#ff595e',
  '#1982c4',
  '#ffca3a',
  '#6a4c93',
  '#43aa8b',
];

export const UI = {
  background: '#0f172a',
  foreground: '#f8fafc',
  card: '#0f172a',
  cardForeground: '#f8fafc',
  popover: '#0f172a',
  popoverForeground: '#f8fafc',
  primary: '#f8fafc',
  primaryForeground: '#0f172a',
  secondary: '#1e293b',
  secondaryForeground: '#f8fafc',
  muted: '#1e293b',
  mutedForeground: '#94a3b8',
  accent: '#1e293b',
  accentForeground: '#f8fafc',
  destructive: '#7f1d1d',
  destructiveForeground: '#f8fafc',
  border: '#1e293b',
  input: '#1e293b',
  ring: '#cbd5e1',
  gradientTop: '#1d3557',
  gradientBottom: '#0b132b',
  canvasBg: '#0b132b',
  tileBg: '#1d3557',
  stroke: '#333333',
  roadOutline: '#654321',
  costcoOutline: '#1E40AF',
  pennantStroke: '#FFA500',
  mcdonaldsStroke: '#DAA520',
  mcdonaldsText: '#B8860B',
};

export const GAME = {
  road: '#8B4513',
  costco: '#4169E1',
  mcdonalds: '#FFD700',
  field: '#90EE90',
};

export const CHART = {
  1: '#3b82f6',
  2: '#10b981',
  3: '#f59e0b',
  4: '#8b5cf6',
  5: '#ef4444',
};

// Helper to convert hex '#rrggbb' to 'r,g,b' string for CSS rgba usage
export const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
};

export default {
  PALETTE,
  UI,
  GAME,
  CHART,
  hexToRgb,
};
