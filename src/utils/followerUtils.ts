import type { IBoard } from "../interfaces";

export interface FollowerBreakdown {
  total: number;
  remaining: number;
  placed: number;
  byFeature: {
    road: number;
    costco: number;
    mcdonalds: number;
    field: number;
  };
}

export function getFollowerBreakdown(
  playerId: string,
  remainingFollowers: number,
  board: IBoard
): FollowerBreakdown {
  const byFeature = {
    road: 0,
    costco: 0,
    mcdonalds: 0,
    field: 0,
  };

  const claims = board.getFeatureClaims();

  for (const claim of claims) {
    if (claim.players.includes(playerId)) {
      const featureType = claim.type as keyof typeof byFeature;
      if (featureType in byFeature) {
        byFeature[featureType]++;
      }
    }
  }

  const placed = byFeature.road + byFeature.costco + byFeature.mcdonalds + byFeature.field;

  return {
    total: 7,
    remaining: remainingFollowers,
    placed,
    byFeature,
  };
}
