import type { Position } from "@/types";
import { rotatePoint, type Point } from "./tileLayout";

export type Region = "meadow" | "farmland" | "forest" | "desert";
export const REGIONS: Region[] = ["meadow", "farmland", "forest", "desert"];

export type RegionWeights = Record<Region, number>;

/** Region features are about this many tiles across. */
const CELL = 4.5;
/** The river opening always sits in familiar meadow. */
const HOME_RADIUS = 2;
const HOME_FADE = 1.5;

function lattice(ix: number, iz: number, seed: number, salt: number): number {
  let h = Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iz, 0x165667b1) ^ Math.imul(seed + salt, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * (3 - 2 * t);
const smoothstep = (a: number, b: number, x: number) => fade(Math.min(1, Math.max(0, (x - a) / (b - a))));

/** Smooth, seeded value noise in [0, 1]. */
function noise(x: number, z: number, seed: number, salt: number): number {
  const gx = x / CELL,
    gz = z / CELL;
  const ix = Math.floor(gx),
    iz = Math.floor(gz);
  const tx = fade(gx - ix),
    tz = fade(gz - iz);
  const a = lattice(ix, iz, seed, salt),
    b = lattice(ix + 1, iz, seed, salt);
  const c = lattice(ix, iz + 1, seed, salt),
    d = lattice(ix + 1, iz + 1, seed, salt);
  return (a + (b - a) * tx) * (1 - tz) + (c + (d - c) * tx) * tz;
}

/** Two octaves in a rotated frame, so borders never follow the tile grid. */
function field(x: number, z: number, seed: number, salt: number, angle: number): number {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const u = x * c - z * s,
    v = x * s + z * c;
  return (noise(u, v, seed, salt) * 3 + noise(u * 2.3 + 7.1, v * 2.3 - 3.7, seed, salt + 1)) / 4;
}

/**
 * How much each landscape applies at a world position. Weights sum to 1 and
 * vary smoothly, so neighbouring tiles agree wherever they meet.
 */
export function regionWeights(x: number, z: number, seed = 0): RegionWeights {
  const dry = field(x, z, seed, 11, 0.52);
  const wild = field(x, z, seed, 97, 1.21);
  const away = smoothstep(HOME_RADIUS, HOME_RADIUS + HOME_FADE, Math.hypot(x, z));
  const desert = smoothstep(0.55, 0.62, dry) * away;
  const forest = smoothstep(0.53, 0.6, wild) * (1 - desert) * away;
  const farmland = smoothstep(0.41, 0.35, wild) * (1 - desert) * away;
  return { meadow: 1 - desert - forest - farmland, farmland, forest, desert };
}

/** The region with the largest weight. */
export function dominantRegion(weights: RegionWeights): Region {
  return REGIONS.reduce((best, region) => (weights[region] > weights[best] ? region : best), "meadow" as Region);
}

/** Pick a region in proportion to its weight, so borders mingle naturally. */
export function sampleRegion(weights: RegionWeights, roll: number): Region {
  let total = 0;
  for (const region of REGIONS) {
    total += weights[region];
    if (roll < total) return region;
  }
  return "meadow";
}

/** Canonical tile corners in NW, NE, SW, SE order, matching the ground shader. */
const CORNER_POINTS: Point[] = [
  [-0.5, -0.5],
  [0.5, -0.5],
  [-0.5, 0.5],
  [0.5, 0.5],
];

/** Region weights at the four canonical corners of a placed tile. */
export function cornerWeights(position: Position, orientation: number, seed = 0): RegionWeights[] {
  return CORNER_POINTS.map((corner) => {
    const [x, z] = rotatePoint(corner, orientation);
    return regionWeights(position.x + x, position.y + z, seed);
  });
}
