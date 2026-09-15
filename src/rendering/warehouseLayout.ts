import type { ITile } from "@/interfaces/ITile";
import type { Direction, TileRecord } from "@/types";
import { DELTAS, DIRECTIONS, OPPOSITE } from "@/directions";
import {
  canonicalTile, hull, Point, PORTALS, positionKey, roadPath, rotatePoint,
  sceneryKey, zonePolygon,
} from "./tileLayout";

export const WAREHOUSE_WIDTH = 0.38;
export const WAREHOUSE_ROOF_Y = 0.17;
export interface WarehouseWall {
  a: Point;
  b: Point;
  normal: Point;
  length: number;
  portal?: Direction;
}
export interface WarehouseSection {
  key: string;
  position: TileRecord["position"];
  roof: Point[];
  paving: Point[];
  walls: WarehouseWall[];
  curbs: WarehouseWall[];
  roads: Point[];
  joined: Direction[];
}

/** An entrance must face open space, rather than an enclosed roof courtyard. */
function facesOutside(wall: WarehouseWall, sections: WarehouseSection[]): boolean {
  const p: Point = [(wall.a[0] + wall.b[0]) / 2 + wall.normal[0] * 0.002,
    (wall.a[1] + wall.b[1]) / 2 + wall.normal[1] * 0.002];
  const [rx, rz] = wall.normal;
  return !sections.some(({ roof }) => roof.some((a, i) => {
    const b = roof[(i + 1) % roof.length];
    const sx = b[0] - a[0], sz = b[1] - a[1];
    const cross = rx * sz - rz * sx;
    if (Math.abs(cross) < 1e-8) return false;
    const dx = a[0] - p[0], dz = a[1] - p[1];
    const distance = (dx * sz - dz * sx) / cross;
    const along = (dx * rz - dz * rx) / cross;
    return distance > 0 && along >= 0 && along <= 1;
  }));
}
export interface WarehouseComplex {
  key: string;
  sections: WarehouseSection[];
  entrance: WarehouseWall;
  loadingBay?: WarehouseWall;
}

/** The model depends on placed topology, never claims, hover, or the drawn tile. */
export function warehouseLayoutKey(records: TileRecord[]): string {
  return JSON.stringify(records.filter(({ tile }) => tile.costcoZones.length)
    .map(({ tile, position }) => [positionKey(position), tile.orientation, sceneryKey(tile)])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}

/** A tile contributes a warehouse section which reaches every store portal. */
export function warehouseFootprint(tile: ITile, index: number): Point[] {
  const base = canonicalTile(tile);
  const zone = base.costcoZones[index];
  if (!zone) return [];
  const points: Point[] = [];
  for (const edge of zone.segments) {
    if (edge === "center") continue;
    const [x, z] = PORTALS[edge];
    const tx = z ? WAREHOUSE_WIDTH / 2 : 0;
    const tz = x ? WAREHOUSE_WIDTH / 2 : 0;
    points.push([x + tx, z + tz], [x - tx, z - tz]);
    if (!zone.segments.includes("center")) {
      points.push([x * 0.66 + tx, z * 0.66 + tz], [x * 0.66 - tx, z * 0.66 - tz]);
    }
  }
  if (zone.segments.includes("center")) {
    // Leave the gas canopy and its driveway outside the warehouse footprint.
    const center: Point = base.id === "costco-road" ? [0.14, -0.14] : [0, 0];
    const radius = base.id === "costco-road" ? 0.075 : 0.13;
    for (const x of [-radius, radius])
      for (const z of [-radius, radius]) points.push([center[0] + x, center[1] + z]);
  }
  return hull(points).map((point) => rotatePoint(point, tile.orientation));
}

function perimeter(polygon: Point[], joined: Direction[], position: TileRecord["position"]): WarehouseWall[] {
  return polygon.flatMap((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    const portal = DIRECTIONS.find((edge) => {
      const [x, z] = PORTALS[edge];
      return x ? a[0] === x && b[0] === x : a[1] === z && b[1] === z;
    });
    if (portal && joined.includes(portal)) return [];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const length = Math.hypot(dx, dz);
    return [{
      a: [a[0] + position.x, a[1] + position.y] as Point,
      b: [b[0] + position.x, b[1] + position.y] as Point,
      normal: [dz / length, -dx / length] as Point,
      length, portal,
    }];
  });
}

/** Join only matching Costco zones across neighboring tile edges. */
export function warehouseLayout(records: TileRecord[]): WarehouseComplex[] {
  const nodes = records.flatMap((record) => record.tile.costcoZones.map((zone, index) => ({
    ...record, zone, index, key: `${positionKey(record.position)}:${zone.id}`,
  }))).sort((a, b) => a.key.localeCompare(b.key));
  const portals = new Map<string, string>();
  for (const node of nodes)
    for (const edge of node.zone.segments)
      if (edge !== "center") portals.set(`${positionKey(node.position)}:${edge}`, node.key);
  const links = new Map<string, string[]>();
  const sections = new Map<string, WarehouseSection>();
  for (const node of nodes) {
    const joined: Direction[] = [];
    const neighbors: string[] = [];
    for (const edge of node.zone.segments) {
      if (edge === "center") continue;
      const delta = DELTAS[edge];
      const neighbor = portals.get(`${positionKey({ x: node.position.x + delta.x, y: node.position.y + delta.y })}:${OPPOSITE[edge]}`);
      if (neighbor) { joined.push(edge); neighbors.push(neighbor); }
    }
    const roof = warehouseFootprint(node.tile, node.index);
    const paving = zonePolygon(node.tile, node.index);
    const world = ([x, z]: Point): Point => [x + node.position.x, z + node.position.y];
    links.set(node.key, neighbors);
    sections.set(node.key, {
      key: node.key, position: node.position, joined, roof: roof.map(world), paving: paving.map(world),
      walls: perimeter(roof, joined, node.position),
      curbs: perimeter(paving, joined, node.position),
      roads: node.tile.roadConnections.flatMap(roadPath).map(world),
    });
  }
  const visited = new Set<string>();
  const result: WarehouseComplex[] = [];
  for (const node of nodes) {
    if (visited.has(node.key)) continue;
    const group: WarehouseSection[] = [];
    const pending = [node.key];
    while (pending.length) {
      const key = pending.pop()!;
      if (visited.has(key)) continue;
      visited.add(key);
      group.push(sections.get(key)!);
      pending.push(...links.get(key)!);
    }
    const walls = group.flatMap((section) => section.walls).filter((wall) => facesOutside(wall, group));
    const frontage = walls.filter((wall) => !wall.portal && wall.length > 0.2);
    const candidates = frontage.length ? frontage : walls;
    const entrance = candidates.slice().sort((a, b) =>
      (b.normal[0] + b.normal[1]) * 2 + b.length - ((a.normal[0] + a.normal[1]) * 2 + a.length),
    )[0];
    const loadingBay = group.length > 1 ? frontage.filter((wall) => wall !== entrance && wall.length > 0.3)
      .sort((a, b) => (a.normal[0] + a.normal[1]) - (b.normal[0] + b.normal[1]) || b.length - a.length)[0] : undefined;
    result.push({ key: node.key, sections: group, entrance, loadingBay });
  }
  return result;
}
