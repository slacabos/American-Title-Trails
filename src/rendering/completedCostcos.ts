import type { IBoard } from "@/interfaces";
import type { TileRecord } from "@/types";
import { GAME_RULES } from "@/constants/gameRules";
import { zonePolygon } from "@/rendering/tileLayout";

export interface CompletedCostco {
  zones: { record: TileRecord; index: number }[];
  center: { x: number; y: number };
  points: number;
}

/** One marker per connected, closed Costco, even when it spans several tiles. */
export function completedCostcos(board: IBoard): CompletedCostco[] {
  const visited = new Set<string>();
  const completed: CompletedCostco[] = [];

  for (const record of board.getAllTiles().values()) {
    for (const zone of record.tile.costcoZones) {
      const key = `${record.position.x},${record.position.y}:${zone.id}`;
      if (visited.has(key)) continue;

      const before = new Set(visited);
      const feature = board.traceCostcoFeature(record.position, zone, visited);
      if (!board.isCostcoComplete(feature)) continue;

      const zones = [...visited].filter(key => !before.has(key)).flatMap(key => {
        const separator = key.lastIndexOf(":");
        const [x, y] = key.slice(0, separator).split(",").map(Number);
        const tileRecord = board.getTile({ x, y });
        if (!tileRecord) return [];
        const index = tileRecord.tile.costcoZones.findIndex(candidate => candidate.id === key.slice(separator + 1));
        return index < 0 ? [] : [{ record: tileRecord, index }];
      });
      if (!zones.length) continue;

      const centers = zones.map(({ record, index }) => {
        const polygon = zonePolygon(record.tile, index);
        if (!polygon.length) return record.position;
        return {
          x: record.position.x + polygon.reduce((sum, [x]) => sum + x, 0) / polygon.length,
          y: record.position.y + polygon.reduce((sum, [, y]) => sum + y, 0) / polygon.length,
        };
      });
      completed.push({
        zones,
        center: {
          x: centers.reduce((sum, center) => sum + center.x, 0) / centers.length,
          y: centers.reduce((sum, center) => sum + center.y, 0) / centers.length,
        },
        points: feature.tiles.size * GAME_RULES.COSTCO_POINTS_PER_TILE_COMPLETE +
          (feature.pennants ?? 0) * GAME_RULES.COSTCO_PENNANT_BONUS_COMPLETE,
      });
    }
  }

  return completed;
}
