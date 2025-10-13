import { DIRECTIONS, DELTAS, OPPOSITE } from "./directions";
import {
  Position,
  Bounds,
  TileRecord,
  FeatureClaim,
  Direction,
  TerrainType,
  CostcoSegment,
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

interface NeighborInfo {
  position: Position;
  tile: Tile;
}

interface Feature {
  type: TerrainType;
  tiles: Set<string>;
  edges: Set<string>;
  isComplete: boolean;
  pennants?: number; // Track pennants for Costco areas
}

interface CompletedFeature extends Feature {
  claimedBy: string[];
  points: number;
}

interface PlacementResult {
  completed: CompletedFeature[];
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

    // Analyze completed features after placement
    const completed = this.analyzeCompletedFeatures(position, tile);

    return { completed };
  }

  private analyzeCompletedFeatures(
    placedPosition: Position,
    placedTile: Tile
  ): CompletedFeature[] {
    const completed: CompletedFeature[] = [];

    // Check roads
    const roadFeatures = this.findConnectedRoads(placedPosition, placedTile);
    roadFeatures.forEach((feature) => {
      if (this.isRoadComplete(feature)) {
        const claimedBy = this.getFeatureClaimants(feature);
        completed.push({
          ...feature,
          isComplete: true,
          claimedBy,
          points: feature.tiles.size,
        });
      }
    });

    // Check Costcos
    const costcoFeatures = this.findConnectedCostcos(
      placedPosition,
      placedTile
    );
    costcoFeatures.forEach((feature) => {
      if (this.isCostcoComplete(feature)) {
        const claimedBy = this.getFeatureClaimants(feature);
        // Complete Costco: 2 points per tile + 2 points per pennant
        const basePoints = feature.tiles.size * 2;
        const pennantPoints = (feature.pennants || 0) * 2;
        completed.push({
          ...feature,
          isComplete: true,
          claimedBy,
          points: basePoints + pennantPoints,
        });
      }
    });

    // Check McDonalds
    if (placedTile.center === "mcdonalds") {
      if (this.isMcDonaldsComplete(placedPosition)) {
        const claimedBy = this.getFeatureClaimants({
          type: "mcdonalds",
          tiles: new Set([positionKey(placedPosition)]),
          edges: new Set([positionKey(placedPosition)]),
          isComplete: true,
        });
        completed.push({
          type: "mcdonalds",
          tiles: new Set([positionKey(placedPosition)]),
          edges: new Set([positionKey(placedPosition)]),
          isComplete: true,
          claimedBy,
          points: 9,
        });
      }
    }

    return completed;
  }

  private findConnectedRoads(
    startPosition: Position,
    startTile: Tile
  ): Feature[] {
    const features: Feature[] = [];
    const visited = new Set<string>();

    // Check each road connection on the placed tile
    startTile.roadConnections.forEach((connection) => {
      const featureKey = `${positionKey(startPosition)}:${connection.join(
        ","
      )}`;
      if (visited.has(featureKey)) return;

      const feature = this.traceRoadFeature(startPosition, connection, visited);
      if (feature.tiles.size > 0) {
        features.push(feature);
      }
    });

    return features;
  }

  private traceRoadFeature(
    startPosition: Position,
    connection: string[],
    visited: Set<string>
  ): Feature {
    const feature: Feature = {
      type: "road",
      tiles: new Set(),
      edges: new Set(),
      isComplete: false,
    };

    const queue: Array<{ position: Position; segments: string[] }> = [
      { position: startPosition, segments: connection },
    ];

    while (queue.length > 0) {
      const { position, segments } = queue.shift()!;
      const posKey = positionKey(position);

      if (feature.tiles.has(posKey)) continue;
      feature.tiles.add(posKey);

      const tile = this.getTile(position)?.tile;
      if (!tile) continue;

      // Add road segments to edges
      segments.forEach((segment) => {
        feature.edges.add(`${posKey}:${segment}`);
        visited.add(`${posKey}:${segment}`);
      });

      // Find connected roads in neighboring tiles
      DIRECTIONS.forEach((direction) => {
        if (!segments.includes(direction)) return;

        const neighborPos = addDelta(position, direction);
        const neighbor = this.getTile(neighborPos);
        if (!neighbor) return;

        const oppositeDir = OPPOSITE[direction];
        const neighborRoads = neighbor.tile.roadConnections.filter(
          (conn: string[]) => conn.includes(oppositeDir)
        );

        neighborRoads.forEach((roadConn: string[]) => {
          queue.push({ position: neighborPos, segments: roadConn });
        });
      });
    }

    return feature;
  }

  private findConnectedCostcos(
    startPosition: Position,
    startTile: Tile
  ): Feature[] {
    const features: Feature[] = [];
    const visited = new Set<string>();

    // Check each Costco zone on the placed tile
    startTile.costcoZones.forEach((zone) => {
      const featureKey = `${positionKey(startPosition)}:${zone.id}`;
      if (visited.has(featureKey)) return;

      const feature = this.traceCostcoFeature(startPosition, zone, visited);
      if (feature.tiles.size > 0) {
        features.push(feature);
      }
    });

    return features;
  }

  private traceCostcoFeature(
    startPosition: Position,
    zone: CostcoSegment,
    visited: Set<string>
  ): Feature {
    const feature: Feature = {
      type: "costco",
      tiles: new Set(),
      edges: new Set(),
      isComplete: false,
      pennants: 0,
    };

    const queue: Array<{ position: Position; zone: CostcoSegment }> = [
      { position: startPosition, zone },
    ];

    while (queue.length > 0) {
      const { position, zone: currentZone } = queue.shift()!;
      const posKey = positionKey(position);

      if (feature.tiles.has(posKey)) continue;
      feature.tiles.add(posKey);

      const tile = this.getTile(position)?.tile;
      if (!tile) continue;

      // Count pennants
      if (currentZone.hasPennant) {
        feature.pennants = (feature.pennants || 0) + 1;
      }

      // Add Costco segments to edges
      currentZone.segments.forEach((segment) => {
        feature.edges.add(`${posKey}:${segment}`);
      });

      // Mark this zone as visited
      visited.add(`${posKey}:${currentZone.id}`);

      // Find connected Costcos in neighboring tiles
      currentZone.segments.forEach((segment) => {
        if (!DIRECTIONS.includes(segment as Direction)) return;

        const direction = segment as Direction;
        const neighborPos = addDelta(position, direction);
        const neighbor = this.getTile(neighborPos);
        if (!neighbor) return;

        const oppositeDir = OPPOSITE[direction];
        const neighborCostcos = neighbor.tile.costcoZones.filter(
          (neighborZone: CostcoSegment) =>
            neighborZone.segments.includes(oppositeDir)
        );

        neighborCostcos.forEach((costcoZone: CostcoSegment) => {
          const neighborKey = `${positionKey(neighborPos)}:${costcoZone.id}`;
          if (!visited.has(neighborKey)) {
            queue.push({ position: neighborPos, zone: costcoZone });
          }
        });
      });
    }

    return feature;
  }

  private isRoadComplete(feature: Feature): boolean {
    // A road is complete if all its endpoints are connected or terminate at road ends
    const openEnds = new Set<string>();

    feature.edges.forEach((edge) => {
      const [posKey, segment] = edge.split(":");
      const position = parsePositionKey(posKey);
      const tile = this.getTile(position)?.tile;
      if (!tile) return;

      // Check if this segment connects to the center or to another direction
      const roadConn = tile.roadConnections.find((conn: string[]) =>
        conn.includes(segment)
      );
      if (!roadConn) return;

      roadConn.forEach((dir: string) => {
        if (dir === "center") return; // Center connections don't create open ends

        if (DIRECTIONS.includes(dir as Direction)) {
          const neighborPos = addDelta(position, dir as Direction);
          const neighbor = this.getTile(neighborPos);

          if (!neighbor) {
            openEnds.add(`${posKey}:${dir}`);
          } else {
            const oppositeDir = OPPOSITE[dir as Direction];
            const hasConnectingRoad = neighbor.tile.roadConnections.some(
              (conn: string[]) => conn.includes(oppositeDir)
            );
            if (!hasConnectingRoad) {
              openEnds.add(`${posKey}:${dir}`);
            }
          }
        }
      });
    });

    return openEnds.size === 0;
  }

  private isCostcoComplete(feature: Feature): boolean {
    // A Costco is complete if it forms a closed area with no open edges
    for (const edge of feature.edges) {
      const [posKey, segment] = edge.split(":");
      if (DIRECTIONS.includes(segment as Direction)) {
        const position = parsePositionKey(posKey);
        const neighborPos = addDelta(position, segment as Direction);
        const neighbor = this.getTile(neighborPos);

        if (!neighbor) return false; // Open edge to empty space

        const oppositeDir = OPPOSITE[segment as Direction];
        const hasConnectingCostco = neighbor.tile.costcoZones.some(
          (zone: CostcoSegment) => zone.segments.includes(oppositeDir)
        );
        if (!hasConnectingCostco) return false; // Open edge to non-Costco
      }
    }

    // Additional requirement: Costco areas must contain at least 2 tiles
    return feature.tiles.size >= 2;
  }

  private isMcDonaldsComplete(position: Position): boolean {
    // McDonalds is complete when all 8 surrounding positions have tiles
    const surroundingPositions = [
      { x: position.x - 1, y: position.y - 1 },
      { x: position.x, y: position.y - 1 },
      { x: position.x + 1, y: position.y - 1 },
      { x: position.x - 1, y: position.y },
      { x: position.x + 1, y: position.y },
      { x: position.x - 1, y: position.y + 1 },
      { x: position.x, y: position.y + 1 },
      { x: position.x + 1, y: position.y + 1 },
    ];

    return surroundingPositions.every((pos) => this.getTile(pos) !== undefined);
  }

  private getFeatureClaimants(feature: Feature): string[] {
    const claimants = new Set<string>();

    feature.edges.forEach((edge) => {
      const claim = this.featureClaims.get(edge);
      if (claim) {
        claim.players.forEach((player) => claimants.add(player));
      }
    });

    return Array.from(claimants);
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
      return { edge, type, players: existingClaim.players };
    } else {
      const newClaim = {
        edge,
        type,
        players: [playerId],
      };
      this.featureClaims.set(edge, newClaim);
      return { edge, type, players: [playerId] };
    }
  }

  getFeatureClaims(): FeatureClaim[] {
    return Array.from(this.featureClaims.values());
  }

  previewPlacement(tile: Tile, position: Position): PlacementResult | null {
    if (!this.canPlace(tile, position)) {
      return null;
    }

    // Create a temporary board state to analyze completion
    const tempBoard = new Board();
    tempBoard.tiles.clear();
    this.tiles.forEach((record, key) => {
      tempBoard.tiles.set(key, record);
    });

    // Place tile temporarily
    tempBoard.tiles.set(positionKey(position), { position, tile });

    // Analyze what would complete
    const completed = tempBoard.analyzeCompletedFeatures(position, tile);

    return { completed };
  }

  removeFollower(edge: string): void {
    this.featureClaims.delete(edge);
  }

  returnFollowersFromCompletedFeatures(completed: CompletedFeature[]): void {
    completed.forEach((feature) => {
      feature.edges.forEach((edge) => {
        this.removeFollower(edge);
      });
    });
  }
}
