import type { ITile } from "@/interfaces/ITile";
import type {
  ClaimableFeature,
  Direction,
  FeatureClaim,
  GameState,
  Position,
} from "@/types";
import { GamePhase } from "@/types";

export type Point = readonly [number, number];
export const PORTALS: Record<string, Point> = {
  north: [0, -0.5],
  east: [0.5, 0],
  south: [0, 0.5],
  west: [-0.5, 0],
  center: [0, 0],
};
export const CORNERS: Record<string, Point> = {
  nw: [-0.36, -0.36],
  ne: [0.36, -0.36],
  sw: [-0.36, 0.36],
  se: [0.36, 0.36],
};
export const ROAD_WIDTH = 0.18;
export const SHOP_WIDTH = 0.5;

/** Board coordinates use X/Z in the scene; positive board Y points south. */
export const boardToWorld = ({ x, y }: Position): [number, number, number] => [
  x,
  0,
  y,
];
export const worldToBoard = (x: number, z: number): Position => ({
  x: Math.floor(x + 0.5),
  y: Math.floor(z + 0.5),
});
export const positionKey = ({ x, y }: Position): string => `${x},${y}`;
export const samePosition = (a?: Position, b?: Position): boolean =>
  a?.x === b?.x && a?.y === b?.y;

/** Clockwise in board space. Geometry is authored once, in canonical orientation. */
export function rotatePoint([x, y]: Point, turns: number): Point {
  const count = ((turns % 4) + 4) % 4;
  for (let i = 0; i < count; i++) [x, y] = [-y, x];
  return [x, y];
}

export function canonicalTile(tile: ITile): ITile {
  return tile.orientation ? tile.rotate(-tile.orientation) : tile;
}

/** Includes topology so custom/test tiles cannot alias a different model by ID. */
export function sceneryKey(tile: ITile): string {
  const base = canonicalTile(tile);
  return JSON.stringify([
    base.id,
    base.center,
    base.roadConnections,
    base.costcoZones,
    base.fieldSegments,
  ]);
}

export function roadPath(connection: string[]): Point[] {
  const ends = connection.filter((part) => part !== "center");
  const start = PORTALS[ends[0]] ?? PORTALS.center;
  const end = PORTALS[ends[1]] ?? PORTALS.center;
  // A quadratic through the center produces tangent-aligned, seamless corners.
  return Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    return [
      (1 - t) ** 2 * start[0] + t ** 2 * end[0],
      (1 - t) ** 2 * start[1] + t ** 2 * end[1],
    ] as Point;
  });
}

function hull(points: Point[]): Point[] {
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a: Point, b: Point, c: Point) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const half = (items: Point[]) => {
    const result: Point[] = [];
    for (const point of items) {
      while (
        result.length >= 2 &&
        cross(result[result.length - 2], result[result.length - 1], point) <= 0
      )
        result.pop();
      result.push(point);
    }
    return result.slice(0, -1);
  };
  return [...half(sorted), ...half(sorted.slice().reverse())];
}

/** Each zone has its own paved footprint. Distinct zones never share a center hub. */
export function zonePolygon(tile: ITile, index: number): Point[] {
  const zone = tile.costcoZones[index];
  if (!zone) return [];
  const edges = zone.segments.filter(
    (segment): segment is Direction => segment !== "center",
  );
  if (edges.length === 4)
    return [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ];
  const points: Point[] = [];
  for (const edge of edges) {
    const [x, y] = PORTALS[edge];
    const tangent: Point = [
      y === 0 ? 0 : SHOP_WIDTH / 2,
      x === 0 ? 0 : SHOP_WIDTH / 2,
    ];
    points.push(
      [x + tangent[0], y + tangent[1]],
      [x - tangent[0], y - tangent[1]],
    );
    if (!zone.segments.includes("center")) {
      points.push(
        [x * 0.56 + tangent[0], y * 0.56 + tangent[1]],
        [x * 0.56 - tangent[0], y * 0.56 - tangent[1]],
      );
    }
  }
  if (zone.segments.includes("center")) {
    points.push([-0.19, -0.19], [0.19, -0.19], [0.19, 0.19], [-0.19, 0.19]);
  }
  return hull(points);
}

export function insidePolygon([x, y]: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/** Anchors sit on their feature, not on a centroid that may fall inside another feature. */
export function featureAnchor(tile: ITile, feature: ClaimableFeature): Point {
  const index = Number(feature.identifier?.split("_")[1] ?? 0);
  if (feature.type === "road")
    return roadPath(tile.roadConnections[index] ?? ["center"])[12];
  if (feature.type === "field")
    return CORNERS[tile.fieldSegments[index]?.corners[0]] ?? [0, 0];
  if (feature.type === "costco") {
    const zone = tile.costcoZones[index];
    const first =
      PORTALS[
        zone?.segments.find((segment) => segment !== "center") ?? "center"
      ];
    return [first[0] * 0.78, first[1] * 0.78];
  }
  return [0, 0];
}

/** Stored claims contain a direction/corner, whereas claim buttons use feature indexes. */
export function resolveClaim(
  tile: ITile,
  position: Position,
  claim: FeatureClaim,
): ClaimableFeature | undefined {
  const [key, segment] = claim.edge.split(":");
  if (key !== positionKey(position)) return undefined;
  if (claim.type === "mcdonalds") return { type: "mcdonalds" };
  const index =
    claim.type === "road"
      ? tile.roadConnections.findIndex((connection) =>
          connection.includes(segment),
        )
      : claim.type === "costco"
        ? tile.costcoZones.findIndex((zone) =>
            zone.segments.some((part) => part === segment),
          )
        : claim.type === "field"
          ? tile.fieldSegments.findIndex((field) =>
              field.corners.some((corner) => corner === segment),
            )
          : -1;
  if (index < 0) return undefined;
  return {
    type: claim.type as ClaimableFeature["type"],
    identifier: `${claim.type}_${index}`,
  };
}

/** Recompute from each state notification: the engine mutates the board in place. */
export function boardSnapshot(state: GameState) {
  const canPlace =
    state.phase === GamePhase.PLACE_TILE &&
    !state.isGameOver &&
    !state.players[state.currentPlayerIndex]?.isAI;
  return {
    tiles: [...state.board.getAllTiles().values()],
    claims: state.board.getFeatureClaims(),
    legal:
      canPlace && state.currentTile
        ? state.board
            .getPlacementCandidates()
            .filter((position) =>
              state.board.canPlace(state.currentTile!, position),
            )
        : [],
    canPlace,
  };
}
