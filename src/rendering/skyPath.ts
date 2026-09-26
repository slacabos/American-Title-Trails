import * as THREE from "three";

/** Where the key light comes from and how it colours the board. */
export interface SkyPose {
  /** Unit vector from the board towards the sun or moon. */
  direction: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  sky: THREE.Color;
  ground: THREE.Color;
  ambient: number;
}

interface Key {
  color: string;
  intensity: number;
  sky: string;
  ground: string;
  ambient: number;
}

// Morning, midday and golden hour; the sun blends between them as tiles are placed.
const DAY: [Key, Key, Key] = [
  { color: "#ffe0bd", intensity: 2.2, sky: "#fbeedd", ground: "#7a8a7a", ambient: 1.95 },
  { color: "#fff0d5", intensity: 1.75, sky: "#fff6df", ground: "#788a77", ambient: 1.55 },
  { color: "#ffc896", intensity: 2.3, sky: "#ffe8cc", ground: "#7b7a68", ambient: 1.9 },
];
// The moon keeps one cool colour and only dims towards the horizon.
const NIGHT: [Key, Key, Key] = [
  { color: "#b9c4e0", intensity: 0.85, sky: "#7d88a0", ground: "#232c30", ambient: 1.05 },
  { color: "#c3cde6", intensity: 1.05, sky: "#7d88a0", ground: "#232c30", ambient: 1.05 },
  { color: "#b9c4e0", intensity: 0.85, sky: "#7d88a0", ground: "#232c30", ambient: 1.05 },
];

/** Degrees above the table: never so low that shadows smear across the board. */
export const SKY_ELEVATION = { day: { low: 24, high: 60 }, night: { low: 26, high: 48 } } as const;

const mixColor = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);

/**
 * The sun rises in the east (+x) as the game starts, crosses the south (+z) at
 * midday and sets in the west (−x) as the last tiles are placed. At night the
 * moon makes the same crossing, lower and cooler.
 */
export function skyPose(progress: number, night = false): SkyPose {
  const t = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0.5));
  const { low, high } = night ? SKY_ELEVATION.night : SKY_ELEVATION.day;
  const arc = Math.sin(Math.PI * t);
  const elevation = THREE.MathUtils.degToRad(low + (high - low) * arc);
  const azimuth = Math.PI * t;
  const direction = new THREE.Vector3(
    Math.cos(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.sin(azimuth) * Math.cos(elevation),
  ).normalize();
  const keys = night ? NIGHT : DAY;
  const [from, to, blend] = t < 0.5 ? [keys[0], keys[1], t * 2] : [keys[1], keys[2], t * 2 - 1];
  return {
    direction,
    color: mixColor(from.color, to.color, blend),
    intensity: THREE.MathUtils.lerp(from.intensity, to.intensity, blend),
    sky: mixColor(from.sky, to.sky, blend),
    ground: mixColor(from.ground, to.ground, blend),
    ambient: THREE.MathUtils.lerp(from.ambient, to.ambient, blend),
  };
}

/** How far through the deck the game is: 0 at the first tile, 1 when the deck runs out. */
export function gameProgress(tilesPlaced: number, tilesLeft: number): number {
  const total = tilesPlaced + tilesLeft;
  return total > 0 ? tilesPlaced / total : 0;
}
