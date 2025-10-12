const defaultWeights = {
  completion: 6,
  adjacency: 1,
  costcoPreference: 2
};

const scoreFeature = (game, feature) => game.calculatePoints(feature);

export class SimpleAI {
  constructor(options = {}) {
    this.completionWeight = options.completionWeight ?? defaultWeights.completion;
    this.adjacencyWeight = options.adjacencyWeight ?? defaultWeights.adjacency;
    this.costcoWeight = options.costcoWeight ?? defaultWeights.costcoPreference;
  }

  planMove(game, player, tile) {
    const candidates = game.board.getPlacementCandidates();
    if (candidates.length === 0) {
      return null;
    }

    let bestScore = -Infinity;
    let bestMove = null;

    candidates.forEach(position => {
      const neighborCount = Object.keys(game.board.getNeighbors(position)).length;

      for (let rotation = 0; rotation < 4; rotation += 1) {
        const rotated = tile.rotate(rotation);
        if (!game.board.canPlace(rotated, position)) {
          continue;
        }

        const preview = game.board.previewPlacement(rotated, position);
        const completionScore = preview
          ? preview.completed.reduce((total, feature) => total + scoreFeature(game, feature), 0)
          : 0;
        const containsCostco = rotated.center === 'costco' || rotated.center === 'mixed';

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
            follower: null
          };
        }
      }
    });

    if (!bestMove) {
      return null;
    }

    if (player.canPlaceFollower() && tile.center === 'mcdonalds') {
      bestMove.follower = { type: 'mcdonalds' };
    }

    return bestMove;
  }
}
