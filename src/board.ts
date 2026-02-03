import { DIRECTIONS, DELTAS, OPPOSITE } from "./directions";
import { GAME_RULES } from "./constants/gameRules";
import {
  Position,
  Bounds,
  TileRecord,
  FeatureClaim,
  Direction,
  TerrainType,
  CostcoSegment,
  Feature,
  FieldSegment,
  FieldCorner,
  FollowerType,
} from "./types";
import type { ITile } from "./interfaces";
import type { IBoard } from "./interfaces/IBoard";

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
  tile: ITile;
}

interface CompletedFeature extends Feature {
  claimedBy: string[];
  points: number;
}

interface PlacementResult {
  completed: CompletedFeature[];
}

export class Board implements IBoard {
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

  canPlace(tile: ITile, position: Position): boolean {
    if (!this.isEmpty() && this.getTile(position)) {
      return false;
    }

    const neighbors = this.getNeighbors(position);
    const neighborEntries = Object.entries(neighbors);
    if (!this.isEmpty() && neighborEntries.length === 0) {
      return false;
    }

    return neighborEntries.every(([direction, neighbor]) => {
      const oppositeEdge = neighbor.tile.getEdge(
        OPPOSITE[direction as Direction]
      );
      const currentEdge = tile.getEdge(direction as Direction);
      return oppositeEdge === currentEdge;
    });
  }

  placeTile(tile: ITile, position: Position): PlacementResult {
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
    placedTile: ITile
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
          points: feature.tiles.size * GAME_RULES.ROAD_POINTS_PER_TILE,
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
        const basePoints = feature.tiles.size * GAME_RULES.COSTCO_POINTS_PER_TILE_COMPLETE;
        const pennantPoints = (feature.pennants || 0) * GAME_RULES.COSTCO_PENNANT_BONUS_COMPLETE;
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
          points: GAME_RULES.MCDONALDS_MAX_SCORE,
        });
      }
    }

    return completed;
  }

  private findConnectedRoads(
    startPosition: Position,
    startTile: ITile
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

  public traceRoadFeature(
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
    startTile: ITile
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

  public traceCostcoFeature(
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

  // Corner adjacency: which directions a corner touches
  private static readonly CORNER_ADJACENCIES: Record<FieldCorner, Direction[]> = {
    nw: ["north", "west"],
    ne: ["north", "east"],
    sw: ["south", "west"],
    se: ["south", "east"],
  };

  // When crossing a tile boundary from a corner in a direction, which corner does it connect to
  private static readonly OPPOSITE_CORNER: Record<FieldCorner, Partial<Record<Direction, FieldCorner>>> = {
    nw: { north: "sw", west: "ne" },
    ne: { north: "se", east: "nw" },
    sw: { south: "nw", west: "se" },
    se: { south: "ne", east: "sw" },
  };

  public traceFieldFeature(
    startPosition: Position,
    fieldSegment: FieldSegment,
    visited: Set<string>
  ): Feature {
    const feature: Feature = {
      type: "field",
      tiles: new Set(),
      edges: new Set(),
      isComplete: false,
    };

    // Queue contains position and field segment
    const queue: Array<{ position: Position; segment: FieldSegment }> = [
      { position: startPosition, segment: fieldSegment },
    ];

    while (queue.length > 0) {
      const { position, segment } = queue.shift()!;
      const posKey = positionKey(position);

      // Create a unique key for this field segment on this tile
      const segmentKey = `${posKey}:${segment.id}`;
      if (visited.has(segmentKey)) continue;
      visited.add(segmentKey);

      feature.tiles.add(posKey);

      const tile = this.getTile(position)?.tile;
      if (!tile) continue;

      // Add corners as edges for claim tracking
      segment.corners.forEach((corner) => {
        feature.edges.add(`${posKey}:${corner}`);
      });

      // For each corner in this segment, check if it connects to neighboring tiles
      segment.corners.forEach((corner) => {
        const adjacentDirections = Board.CORNER_ADJACENCIES[corner];

        adjacentDirections.forEach((direction) => {
          const neighborPos = addDelta(position, direction);
          const neighbor = this.getTile(neighborPos);
          if (!neighbor) return;

          // Find the opposite corner in the neighboring tile
          const oppositeCorner = Board.OPPOSITE_CORNER[corner][direction];
          if (!oppositeCorner) return;

          // Find which field segment in the neighbor contains this corner
          const neighborSegment = neighbor.tile.fieldSegments.find(
            (fs) => fs.corners.includes(oppositeCorner)
          );

          if (neighborSegment) {
            const neighborKey = `${positionKey(neighborPos)}:${neighborSegment.id}`;
            if (!visited.has(neighborKey)) {
              queue.push({ position: neighborPos, segment: neighborSegment });
            }
          }
        });
      });
    }

    return feature;
  }

  public findAdjacentCostcos(fieldFeature: Feature): Set<string> {
    const adjacentCostcos = new Set<string>();

    // For each tile in the field feature, check for adjacent Costco tiles
    fieldFeature.tiles.forEach((tileKey) => {
      const position = parsePositionKey(tileKey);
      const tileRecord = this.getTile(position);
      if (!tileRecord) return;

      // Check all neighboring tiles for Costco zones
      DIRECTIONS.forEach((direction) => {
        const neighborPos = addDelta(position, direction);
        const neighbor = this.getTile(neighborPos);
        if (!neighbor) return;

        // Check if neighbor has Costco zones
        neighbor.tile.costcoZones.forEach((zone) => {
          // Only count if the Costco zone touches this edge
          const oppositeDir = OPPOSITE[direction];
          if (zone.segments.includes(oppositeDir)) {
            // Trace the full Costco feature to get a unique identifier
            const costcoFeature = this.traceCostcoFeature(neighborPos, zone, new Set());

            // Only count completed Costcos
            if (this.isCostcoComplete(costcoFeature)) {
              // Use sorted tile keys as unique identifier
              const costcoId = Array.from(costcoFeature.tiles).sort().join("|");
              adjacentCostcos.add(costcoId);
            }
          }
        });
      });

      // Also check if the current tile has Costco zones that are adjacent to the field
      tileRecord.tile.costcoZones.forEach((zone) => {
        // A Costco is adjacent to a field on the same tile if they share edge proximity
        // For simplicity, we consider any Costco on the same tile as potentially adjacent
        const costcoFeature = this.traceCostcoFeature(position, zone, new Set());
        if (this.isCostcoComplete(costcoFeature)) {
          const costcoId = Array.from(costcoFeature.tiles).sort().join("|");
          adjacentCostcos.add(costcoId);
        }
      });
    });

    return adjacentCostcos;
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

  public isCostcoComplete(feature: Feature): boolean {
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

    return true;
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

  public getFeatureClaimants(feature: Feature): string[] {
    const claimants: string[] = [];

    feature.edges.forEach((edge) => {
      const claim = this.featureClaims.get(edge);
      if (claim) {
        claim.players.forEach((player) => claimants.push(player));
      }
    });

    return claimants;
  }

  canClaimFeature(
    type: TerrainType,
    position: Position,
    identifier: string | undefined
  ): boolean {
    const tileRecord = this.getTile(position);
    if (!tileRecord) return false;

    let feature: Feature | null = null;

    if (type === "road") {
      const connectionIndex = identifier
        ? parseInt(identifier.replace("road_", ""))
        : 0;
      const connection = tileRecord.tile.roadConnections[connectionIndex];
      if (connection) {
        feature = this.traceRoadFeature(position, connection, new Set());
      }
    } else if (type === "costco") {
      const zoneIndex = identifier
        ? parseInt(identifier.replace("costco_", ""))
        : 0;
      const zone = tileRecord.tile.costcoZones[zoneIndex];
      if (zone) {
        feature = this.traceCostcoFeature(position, zone, new Set());
      }
    } else if (type === "field") {
      const fieldIndex = identifier
        ? parseInt(identifier.replace("field_", ""))
        : 0;
      const fieldSegment = tileRecord.tile.fieldSegments[fieldIndex];
      if (fieldSegment) {
        feature = this.traceFieldFeature(position, fieldSegment, new Set());
      }
    } else if (type === "mcdonalds") {
      const edge = positionKey(position);
      const existingClaim = this.featureClaims.get(edge);
      return !existingClaim || existingClaim.players.length === 0;
    }

    if (!feature) return false;

    for (const edge of feature.edges) {
      const existingClaim = this.featureClaims.get(edge);
      if (existingClaim && existingClaim.players.length > 0) {
        return false;
      }
    }
    return true;
  }

  claimFeature(
    type: TerrainType,
    position: Position,
    identifier: string | undefined,
    playerId: string
  ): FeatureClaim {
    if (!this.canClaimFeature(type, position, identifier)) {
      throw new Error("Cannot claim feature: already has a follower");
    }

    const tileRecord = this.getTile(position);
    const posKey = positionKey(position);

    // Determine follower type - farmers for fields, standard for everything else
    const followerType: FollowerType = type === "field" ? "farmer" : "standard";

    // For roads and costcos, we need to store the claim using the same edge format
    // as the traced features (e.g., "0,0:north" instead of "0,0:road_0")
    if (type === "road" && tileRecord) {
      const connectionIndex = identifier
        ? parseInt(identifier.replace("road_", ""))
        : 0;
      const connection = tileRecord.tile.roadConnections[connectionIndex];
      if (connection && connection.length > 0) {
        // Store claim using the first segment of the connection
        const edge = `${posKey}:${connection[0]}`;
        const newClaim: FeatureClaim = { edge, type, players: [playerId], followerType };
        this.featureClaims.set(edge, newClaim);
        return newClaim;
      }
    } else if (type === "costco" && tileRecord) {
      const zoneIndex = identifier
        ? parseInt(identifier.replace("costco_", ""))
        : 0;
      const zone = tileRecord.tile.costcoZones[zoneIndex];
      if (zone && zone.segments.length > 0) {
        // Store claim using the first segment of the zone
        const edge = `${posKey}:${zone.segments[0]}`;
        const newClaim: FeatureClaim = { edge, type, players: [playerId], followerType };
        this.featureClaims.set(edge, newClaim);
        return newClaim;
      }
    } else if (type === "field" && tileRecord) {
      const fieldIndex = identifier
        ? parseInt(identifier.replace("field_", ""))
        : 0;
      const fieldSegment = tileRecord.tile.fieldSegments[fieldIndex];
      if (fieldSegment && fieldSegment.corners.length > 0) {
        // Store claim using the first corner of the field segment
        const edge = `${posKey}:${fieldSegment.corners[0]}`;
        const newClaim: FeatureClaim = { edge, type, players: [playerId], followerType };
        this.featureClaims.set(edge, newClaim);
        return newClaim;
      }
    }

    // For mcdonalds or fallback, use position key
    const edge = posKey;
    const newClaim: FeatureClaim = { edge, type, players: [playerId], followerType };
    this.featureClaims.set(edge, newClaim);
    return newClaim;
  }

  getFeatureClaims(): FeatureClaim[] {
    return Array.from(this.featureClaims.values());
  }

  getAllTiles(): Map<string, TileRecord> {
    return this.tiles;
  }

  previewPlacement(tile: ITile, position: Position): PlacementResult | null {
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
        // Check if this is a farmer claim - farmers are never returned
        const claim = this.featureClaims.get(edge);
        if (claim && claim.followerType === "farmer") {
          return; // Skip removing farmers
        }
        this.removeFollower(edge);
      });
    });
  }
}
