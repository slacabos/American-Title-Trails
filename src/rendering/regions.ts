export type Region = "meadow" | "farmland" | "forest" | "desert";
export const REGIONS: Region[] = ["meadow", "farmland", "forest", "desert"];

export type RegionWeights = Record<Region, number>;

/** Landscape weights at a world position. Every region is meadow for now. */
export function regionWeights(_x: number, _z: number, _seed?: number): RegionWeights {
  return { meadow: 1, farmland: 0, forest: 0, desert: 0 };
}

/** The region with the largest weight. */
export function dominantRegion(weights: RegionWeights): Region {
  return REGIONS.reduce((best, region) => (weights[region] > weights[best] ? region : best), "meadow" as Region);
}
