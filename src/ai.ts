import { AIMove } from "./types";
import { Tile } from "./tile";
import { Player } from "./player";

interface AIOptions {
  completionWeight?: number;
  adjacencyWeight?: number;
  costcoWeight?: number;
}

const defaultWeights = {
  completion: 6,
  adjacency: 1,
  costcoPreference: 2,
};

// Forward declaration - will be properly typed when Game is converted
interface GameInterface {
  board: any;
  calculatePoints: (feature: any) => number;
}

const scoreFeature = (game: GameInterface, feature: any): number =>
  game.calculatePoints(feature);

export class SimpleAI {
  private readonly completionWeight: number;
  private readonly adjacencyWeight: number;
  private readonly costcoWeight: number;

  constructor(options: AIOptions = {}) {
    this.completionWeight =
      options.completionWeight ?? defaultWeights.completion;
    this.adjacencyWeight = options.adjacencyWeight ?? defaultWeights.adjacency;
    this.costcoWeight = options.costcoWeight ?? defaultWeights.costcoPreference;
  }

  planMove(game: GameInterface, player: Player, tile: Tile): AIMove | null {
    const candidates = game.board.getPlacementCandidates();
    if (candidates.length === 0) {
      return null;
    }

    let bestScore = -Infinity;
    let bestMove: AIMove | null = null;

    candidates.forEach((position: any) => {
      const neighborCount = Object.keys(
        game.board.getNeighbors(position)
      ).length;

      for (let rotation = 0; rotation < 4; rotation += 1) {
        const rotated = tile.rotate(rotation);
        if (!game.board.canPlace(rotated, position)) {
          continue;
        }

        const preview = game.board.previewPlacement(rotated, position);
        const completionScore = preview
          ? preview.completed.reduce(
              (total: number, feature: any) =>
                total + scoreFeature(game, feature),
              0
            )
          : 0;
        const containsCostco =
          rotated.center === "costco" || rotated.center === "mixed";

        const score =
          completionScore * this.completionWeight +
          neighborCount * this.adjacencyWeight +
          (containsCostco ? this.costcoWeight : 0) +
          Math.random() * 0.1;

        if (score > bestScore) {
          bestScore = score;
          bestMove = {
            position,
            rotation,
            follower: null,
          };
        }
      }
    });

    if (!bestMove) {
      return null;
    }

    // At this point, bestMove is guaranteed to be non-null
    const validMove: AIMove = bestMove;

    if (player.canPlaceFollower() && tile.center === "mcdonalds") {
      validMove.follower = { type: "mcdonalds" };
    }

    return validMove;
  }
}
