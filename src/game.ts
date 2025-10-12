import { Board } from "./board";
import { Player } from "./player";
import { buildDeck, getStartTile } from "./tileLibrary";
import { Tile } from "./tile";
import {
  PlayerDefinition,
  GameOptions,
  Position,
  PlacementOptions,
  PlacementResult,
  ScoringEvent,
  FollowerPlacement,
} from "./types";

const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

interface Feature {
  type: string;
  tiles: Set<string>;
}

export class Game {
  public readonly players: Player[];
  public readonly playersById: Map<string, Player>;
  public readonly board: Board;
  public readonly drawPile: Tile[];
  public readonly discardPile: Tile[];
  public currentPlayerIndex: number;
  public readonly startTile: Tile;

  constructor(
    playerDefinitions: (string | PlayerDefinition)[],
    options: GameOptions = {}
  ) {
    if (!playerDefinitions || playerDefinitions.length === 0) {
      throw new Error("At least one player is required to start the game.");
    }

    const normalized = playerDefinitions.map((definition, index) => {
      if (typeof definition === "string") {
        return { name: definition, options: { id: `p${index + 1}` } };
      }

      if (!definition || !definition.name) {
        throw new Error("Player objects must include a name.");
      }

      const { name, id, followers, isAI, color } = definition;
      return {
        name,
        options: {
          id: id ?? `p${index + 1}`,
          followers,
          isAI,
          color,
        },
      };
    });

    this.players = normalized.map(
      (entry) => new Player(entry.name, entry.options)
    );
    this.playersById = new Map(
      this.players.map((player) => [player.id, player])
    );
    this.board = new Board();
    this.drawPile = shuffle(buildDeck());
    this.discardPile = [];
    this.currentPlayerIndex = options.startingPlayer ?? 0;

    this.startTile = getStartTile();
    this.board.placeTile(this.startTile, { x: 0, y: 0 });
  }

  get currentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  advanceTurn(): void {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
  }

  drawTile(): Tile {
    if (this.drawPile.length === 0) {
      throw new Error("No tiles remain in the draw pile.");
    }
    const tile = this.drawPile.pop();
    if (!tile) {
      throw new Error("Failed to draw tile from pile.");
    }
    return tile;
  }

  discardTile(tile: Tile): void {
    if (!tile) {
      return;
    }
    const stored = tile.clone();
    this.discardPile.push(stored);
  }

  placeTile(
    playerId: string,
    tile: Tile,
    position: Position,
    options: PlacementOptions = {}
  ): PlacementResult {
    const player = this.playersById.get(playerId);
    if (!player) {
      throw new Error("Unknown player attempting to place a tile.");
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
        throw new Error("Follower placement requires a feature type.");
      }
      followerClaim = this.board.claimFeature(
        type,
        position,
        identifier,
        playerId
      );
      player.useFollower();
    }

    const scored = this.scoreCompletedFeatures(placement.completed);

    return {
      completed: placement.completed,
      scored,
      followerClaim,
    } as PlacementResult;
  }

  scoreCompletedFeatures(features: Feature[]): ScoringEvent[] {
    const scored: ScoringEvent[] = [];

    features.forEach((feature) => {
      // This would need proper implementation based on the actual feature system
      const claimants: string[] = []; // Placeholder
      if (claimants.length === 0) {
        return;
      }

      const points = this.calculatePoints(feature);
      claimants.forEach((playerId) => {
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

  calculatePoints(feature: Feature): number {
    if (feature.type === "road") {
      return feature.tiles.size;
    }
    if (feature.type === "costco") {
      return feature.tiles.size * 2;
    }
    if (feature.type === "mcdonalds") {
      return 9;
    }
    return 0;
  }
}
