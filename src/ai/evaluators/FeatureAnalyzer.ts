/**
 * Feature analysis utilities for AI decision making.
 *
 * Provides methods to estimate the value of different feature types
 * based on current state, growth potential, and completion probability.
 */

import type { IBoard } from "../../interfaces";
import type {
  Position,
  TerrainType,
  Feature,
  FieldSegment,
  Direction,
  CostcoSegment,
} from "../../types";
import { GAME_RULES } from "../../constants/gameRules";

/**
 * Result of analyzing a feature's value.
 */
export interface FeatureValueEstimate {
  currentPoints: number;
  potentialPoints: number;
  completionChance: number;
  totalValue: number;
}

/**
 * Analyzes features to estimate their value for AI decision making.
 */
export class FeatureAnalyzer {
  private readonly board: IBoard;
  private static readonly OPPOSITE: Record<Direction, Direction> = {
    north: "south",
    east: "west",
    south: "north",
    west: "east",
  };

  constructor(board: IBoard) {
    this.board = board;
  }

  /**
   * Estimate the value of a Costco feature.
   * Higher value for larger features that are close to completion.
   */
  estimateCostcoValue(
    position: Position,
    zoneIndex: number
  ): FeatureValueEstimate {
    const tileRecord = this.board.getTile(position);
    if (!tileRecord) {
      return { currentPoints: 0, potentialPoints: 0, completionChance: 0, totalValue: 0 };
    }

    const zone = tileRecord.tile.costcoZones[zoneIndex];
    if (!zone) {
      return { currentPoints: 0, potentialPoints: 0, completionChance: 0, totalValue: 0 };
    }

    const feature = this.board.traceCostcoFeature(position, zone, new Set());
    const isComplete = this.board.isCostcoComplete(feature);

    const tileCount = feature.tiles.size;
    const pennants = feature.pennants || 0;

    // Current points if completed now
    const currentPoints = isComplete
      ? tileCount * GAME_RULES.COSTCO_POINTS_PER_TILE_COMPLETE +
        pennants * GAME_RULES.COSTCO_PENNANT_BONUS_COMPLETE
      : tileCount * GAME_RULES.COSTCO_POINTS_PER_TILE_INCOMPLETE +
        pennants * GAME_RULES.COSTCO_PENNANT_BONUS_INCOMPLETE;

    // Estimate potential points (assume 1-2 more tiles)
    const potentialTiles = tileCount + 2;
    const potentialPoints =
      potentialTiles * GAME_RULES.COSTCO_POINTS_PER_TILE_COMPLETE +
      pennants * GAME_RULES.COSTCO_PENNANT_BONUS_COMPLETE;

    // Completion chance decreases as feature grows (harder to complete large features)
    const openEdges = this.countOpenEdges(feature);
    const completionChance = isComplete
      ? 1.0
      : Math.max(0.1, 1.0 - openEdges * 0.15);

    const totalValue = currentPoints * completionChance + potentialPoints * (1 - completionChance) * 0.3;

    return { currentPoints, potentialPoints, completionChance, totalValue };
  }

  /**
   * Estimate the value of a road feature.
   * Roads score 1 point per tile, so value is based on length potential.
   */
  estimateRoadValue(
    position: Position,
    connectionIndex: number
  ): FeatureValueEstimate {
    const tileRecord = this.board.getTile(position);
    if (!tileRecord) {
      return { currentPoints: 0, potentialPoints: 0, completionChance: 0, totalValue: 0 };
    }

    const connection = tileRecord.tile.roadConnections[connectionIndex];
    if (!connection) {
      return { currentPoints: 0, potentialPoints: 0, completionChance: 0, totalValue: 0 };
    }

    const feature = this.board.traceRoadFeature(position, connection, new Set());
    const tileCount = feature.tiles.size;

    // Current points
    const currentPoints = tileCount * GAME_RULES.ROAD_POINTS_PER_TILE;

    // Potential points (roads can grow long)
    const potentialPoints = (tileCount + 3) * GAME_RULES.ROAD_POINTS_PER_TILE;

    // Roads are easier to complete than Costcos
    const openEnds = this.countRoadOpenEnds(feature);
    const completionChance = openEnds === 0 ? 1.0 : Math.max(0.2, 1.0 - openEnds * 0.2);

    const totalValue = currentPoints * completionChance + potentialPoints * (1 - completionChance) * 0.4;

    return { currentPoints, potentialPoints, completionChance, totalValue };
  }

  /**
   * Estimate the value of a McDonald's feature.
   * McDonald's score based on surrounding tiles (max 9 points).
   */
  estimateMcDonaldsValue(position: Position): FeatureValueEstimate {
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

    const filledCount = surroundingPositions.filter(
      (pos) => this.board.getTile(pos) !== undefined
    ).length;

    // McDonald's gives 1 point per tile including itself
    const currentPoints =
      (filledCount + 1) * GAME_RULES.MCDONALDS_POINTS_PER_TILE;
    const potentialPoints = GAME_RULES.MCDONALDS_MAX_SCORE;

    // Completion chance based on how many tiles are already placed
    const completionChance = filledCount >= 5 ? 0.9 : filledCount >= 3 ? 0.6 : 0.3;

    const totalValue =
      currentPoints * completionChance +
      potentialPoints * (1 - completionChance) * 0.5;

    return { currentPoints, potentialPoints, completionChance, totalValue };
  }

  /**
   * Estimate the value of a field feature.
   * Fields score based on adjacent completed Costcos at game end.
   */
  estimateFieldValue(
    position: Position,
    identifier?: string
  ): FeatureValueEstimate {
    const tileRecord = this.board.getTile(position);
    if (!tileRecord || !tileRecord.tile.fieldSegments) {
      return { currentPoints: 0, potentialPoints: 0, completionChance: 0, totalValue: 0 };
    }

    const segments = tileRecord.tile.fieldSegments;
    let fieldSegment: FieldSegment | undefined;

    if (identifier && identifier.startsWith("field_")) {
      const index = parseInt(identifier.replace("field_", ""));
      fieldSegment = segments[index];
    } else {
      fieldSegment = segments[0];
    }

    if (!fieldSegment) {
      return { currentPoints: 0, potentialPoints: 0, completionChance: 0, totalValue: 0 };
    }

    const fieldFeature = this.board.traceFieldFeature(
      position,
      fieldSegment,
      new Set()
    );

    const adjacentCostcoFeatures = this.collectAdjacentCostcoFeatures(
      fieldFeature
    );

    let expectedPoints = 0;
    let completedCount = 0;

    adjacentCostcoFeatures.forEach((feature) => {
      if (this.board.isCostcoComplete(feature)) {
        expectedPoints += GAME_RULES.FARMER_POINTS_PER_COSTCO;
        completedCount += 1;
        return;
      }

      const openEdges = this.countOpenEdges(feature);
      const completionChance = Math.max(0.1, 1.0 - openEdges * 0.15);
      expectedPoints += completionChance * GAME_RULES.FARMER_POINTS_PER_COSTCO;
    });

    const currentPoints =
      completedCount * GAME_RULES.FARMER_POINTS_PER_COSTCO;
    const maxPoints =
      adjacentCostcoFeatures.size * GAME_RULES.FARMER_POINTS_PER_COSTCO;
    const completionChance = maxPoints > 0 ? expectedPoints / maxPoints : 0;

    return {
      currentPoints,
      potentialPoints: maxPoints,
      completionChance,
      totalValue: expectedPoints,
    };
  }

  /**
   * Estimate feature value by type.
   */
  estimateFeatureValue(
    type: TerrainType,
    position: Position,
    identifier?: string
  ): FeatureValueEstimate {
    switch (type) {
      case "costco": {
        const costcoIndex = identifier
          ? parseInt(identifier.replace("costco_", ""))
          : 0;
        return this.estimateCostcoValue(position, costcoIndex);
      }

      case "road": {
        const roadIndex = identifier
          ? parseInt(identifier.replace("road_", ""))
          : 0;
        return this.estimateRoadValue(position, roadIndex);
      }

      case "mcdonalds":
        return this.estimateMcDonaldsValue(position);

      case "field":
        return this.estimateFieldValue(position, identifier);

      default:
        return { currentPoints: 0, potentialPoints: 0, completionChance: 0, totalValue: 0 };
    }
  }

  /**
   * Count open edges in a Costco feature.
   */
  private countOpenEdges(feature: Feature): number {
    let openEdges = 0;
    const directions = ["north", "east", "south", "west"];

    feature.edges.forEach((edge) => {
      const [posKey, segment] = edge.split(":");
      if (directions.includes(segment)) {
        const [x, y] = posKey.split(",").map(Number);
        const neighborPos = this.getNeighborPosition({ x, y }, segment);
        if (!this.board.getTile(neighborPos)) {
          openEdges++;
        }
      }
    });

    return openEdges;
  }

  /**
   * Count open ends of a road feature.
   */
  private countRoadOpenEnds(feature: Feature): number {
    let openEnds = 0;
    const directions = ["north", "east", "south", "west"];

    feature.edges.forEach((edge) => {
      const [posKey, segment] = edge.split(":");
      if (directions.includes(segment)) {
        const [x, y] = posKey.split(",").map(Number);
        const neighborPos = this.getNeighborPosition({ x, y }, segment);
        if (!this.board.getTile(neighborPos)) {
          openEnds++;
        }
      }
    });

    return openEnds;
  }

  /**
   * Get neighbor position in a direction.
   */
  private getNeighborPosition(
    position: Position,
    direction: string
  ): Position {
    const deltas: Record<string, Position> = {
      north: { x: 0, y: -1 },
      east: { x: 1, y: 0 },
      south: { x: 0, y: 1 },
      west: { x: -1, y: 0 },
    };

    const delta = deltas[direction] || { x: 0, y: 0 };
    return { x: position.x + delta.x, y: position.y + delta.y };
  }

  private parsePositionKey(key: string): Position {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  }

  private collectAdjacentCostcoFeatures(fieldFeature: Feature): Set<Feature> {
    const unique = new Map<string, Feature>();
    const directions: Direction[] = ["north", "east", "south", "west"];

    const addFeature = (feature: Feature): void => {
      const id = Array.from(feature.tiles).sort().join("|");
      if (!unique.has(id)) {
        unique.set(id, feature);
      }
    };

    fieldFeature.tiles.forEach((tileKey) => {
      const position = this.parsePositionKey(tileKey);
      const tileRecord = this.board.getTile(position);
      if (!tileRecord) return;

      directions.forEach((direction) => {
        const neighborPos = this.getNeighborPosition(position, direction);
        const neighbor = this.board.getTile(neighborPos);
        if (!neighbor) return;

        neighbor.tile.costcoZones.forEach((zone: CostcoSegment) => {
          const oppositeDir = FeatureAnalyzer.OPPOSITE[direction];
          if (zone.segments.includes(oppositeDir)) {
            const feature = this.board.traceCostcoFeature(
              neighborPos,
              zone,
              new Set()
            );
            addFeature(feature);
          }
        });
      });

      tileRecord.tile.costcoZones.forEach((zone: CostcoSegment) => {
        const feature = this.board.traceCostcoFeature(position, zone, new Set());
        addFeature(feature);
      });
    });

    return new Set(unique.values());
  }
}
