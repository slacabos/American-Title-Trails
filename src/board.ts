import { DIRECTIONS, DELTAS, OPPOSITE } from "./directions";
import {
  Position,
  Bounds,
  TileRecord,
  FeatureClaim,
  Direction,
  TerrainType,
} from "./types";
import { Tile } from "./tile";

const positionKey = ({ x, y }: Position): string => `${x},${y}`;

const parsePositionKey = (key: string): Position => {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
};

const addDelta = (position: Position, direction: Direction): Position => {
  const delta = DELTAS[direction];
  return { x: position.x + delta.x, y: position.y + delta.y };
};

const makeSignature = (type: string, parts: string[]): string =>
  `${type}:${[...parts].sort().join("|")}`;

interface NeighborInfo {
  position: Position;
  tile: Tile;
}

interface PlacementResult {
  completed: any[];
}

export class Board {
  public readonly tiles: Map<string, TileRecord>;
  private readonly featureClaims: Map<string, FeatureClaim>;

  constructor() {
    this.tiles = new Map();
    this.featureClaims = new Map();
  }

  isEmpty(): boolean {
    return this.tiles.size === 0;
  }

  getTile(position: Position): TileRecord | undefined {
    return this.tiles.get(positionKey(position));
  }

  getNeighbors(position: Position): Record<string, NeighborInfo> {
    return DIRECTIONS.reduce((neighbors, direction) => {
      const neighborPosition = addDelta(position, direction);
      const record = this.getTile(neighborPosition);
      if (record) {
        neighbors[direction] = {
          position: neighborPosition,
          tile: record.tile,
        };
      }
      return neighbors;
    }, {} as Record<string, NeighborInfo>);
  }

  getBounds(): Bounds {
    if (this.tiles.size === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.tiles.forEach(({ position }) => {
      if (position.x < minX) minX = position.x;
      if (position.x > maxX) maxX = position.x;
      if (position.y < minY) minY = position.y;
      if (position.y > maxY) maxY = position.y;
    });

    return { minX, maxX, minY, maxY };
  }

  getPlacementCandidates(): Position[] {
    if (this.isEmpty()) {
      return [{ x: 0, y: 0 }];
    }

    const candidates = new Set<string>();

    this.tiles.forEach(({ position }) => {
      DIRECTIONS.forEach((direction) => {
        const neighborPosition = addDelta(position, direction);
        if (this.getTile(neighborPosition)) {
          return;
        }
        candidates.add(positionKey(neighborPosition));
      });
    });

    return [...candidates].map(parsePositionKey);
  }

  canPlace(tile: Tile, position: Position): boolean {
    if (!this.isEmpty() && this.getTile(position)) {
      return false;
    }

    const neighbors = this.getNeighbors(position);
    const neighborEntries = Object.entries(neighbors);
    if (!this.isEmpty() && neighborEntries.length === 0) {
      return false;
    }

    return neighborEntries.every(([direction, neighbor]) => {
      const oppositeEdge = neighbor.tile.edgeAt(
        OPPOSITE[direction as Direction]
      );
      const currentEdge = tile.edgeAt(direction as Direction);
      return oppositeEdge === currentEdge;
    });
  }

  placeTile(tile: Tile, position: Position): PlacementResult {
    if (!this.canPlace(tile, position)) {
      throw new Error(
        `Cannot place tile at position (${position.x}, ${position.y})`
      );
    }

    const tileRecord: TileRecord = { position, tile };
    this.tiles.set(positionKey(position), tileRecord);

    // Analyze completed features (simplified for now)
    const completed: any[] = [];

    return { completed };
  }

  claimFeature(
    type: TerrainType,
    position: Position,
    identifier: string | undefined,
    playerId: string
  ): any {
    const edge = identifier
      ? `${positionKey(position)}:${identifier}`
      : positionKey(position);

    const existingClaim = this.featureClaims.get(edge);
    if (existingClaim) {
      existingClaim.players.push(playerId);
    } else {
      this.featureClaims.set(edge, {
        edge,
        type,
        players: [playerId],
      });
    }

    return { edge, type, players: [playerId] };
  }

  getFeatureClaims(): FeatureClaim[] {
    return Array.from(this.featureClaims.values());
  }

  previewPlacement(tile: Tile, position: Position): PlacementResult | null {
    if (!this.canPlace(tile, position)) {
      return null;
    }

    // Simplified preview - would need full implementation
    return { completed: [] };
  }
}
