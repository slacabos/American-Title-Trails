import { Board } from './board.js';
import { Player } from './player.js';
import { buildDeck, getStartTile } from './tileLibrary.js';

const shuffle = array => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export class Game {
  constructor(playerDefinitions, options = {}) {
    if (!playerDefinitions || playerDefinitions.length === 0) {
      throw new Error('At least one player is required to start the game.');
    }

    const normalized = playerDefinitions.map((definition, index) => {
      if (typeof definition === 'string') {
        return { name: definition, options: { id: `p${index + 1}` } };
      }

      if (!definition || !definition.name) {
        throw new Error('Player objects must include a name.');
      }

      const { name, id, followers, isAI, color } = definition;
      return {
        name,
        options: {
          id: id ?? `p${index + 1}`,
          followers,
          isAI,
          color
        }
      };
    });

    this.players = normalized.map(entry => new Player(entry.name, entry.options));
    this.playersById = new Map(this.players.map(player => [player.id, player]));
    this.board = new Board();
    this.drawPile = shuffle(buildDeck());
    this.discardPile = [];
    this.currentPlayerIndex = options.startingPlayer ?? 0;

    this.startTile = getStartTile();
    this.board.placeTile(this.startTile, { x: 0, y: 0 });
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  advanceTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  drawTile() {
    if (this.drawPile.length === 0) {
      throw new Error('No tiles remain in the draw pile.');
    }
    return this.drawPile.pop();
  }

  discardTile(tile) {
    if (!tile) {
      return;
    }
    const stored = typeof tile.clone === 'function' ? tile.clone() : tile;
    this.discardPile.push(stored);
  }

  placeTile(playerId, tile, position, options = {}) {
    const player = this.playersById.get(playerId);
    if (!player) {
      throw new Error('Unknown player attempting to place a tile.');
    }

    const rotation = options.rotation ?? 0;
    const tileToPlace = tile.rotate(rotation);

    const placement = this.board.placeTile(tileToPlace, position);

    let followerClaim = null;
    if (options.follower) {
      if (!player.canPlaceFollower()) {
        throw new Error(`${player.name} cannot place another follower.`);
      }
      const { type, identifier } = options.follower;
      if (!type) {
        throw new Error('Follower placement requires a feature type.');
      }
      followerClaim = this.board.claimFeature(type, position, identifier, playerId);
      player.useFollower();
    }

    const scored = this.scoreCompletedFeatures(placement.completed);

    return {
      completed: placement.completed,
      scored,
      followerClaim
    };
  }

  scoreCompletedFeatures(features) {
    const scored = [];

    features.forEach(feature => {
      const claimants = this.board.releaseFeature(feature);
      if (claimants.length === 0) {
        return;
      }

      const points = this.calculatePoints(feature);
      claimants.forEach(playerId => {
        const player = this.playersById.get(playerId);
        if (!player) {
          return;
        }
        player.addScore(points);
        player.returnFollower();
        scored.push({ player: player.name, feature: feature.type, points });
      });
    });

    return scored;
  }

  calculatePoints(feature) {
    if (feature.type === 'road') {
      return feature.tiles.size;
    }
    if (feature.type === 'costco') {
      return feature.tiles.size * 2;
    }
    if (feature.type === 'mcdonalds') {
      return 9;
    }
    return 0;
  }
}
