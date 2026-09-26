import type { ITile } from "@/interfaces/ITile";
import { canonicalTile, Point, PORTALS, roadPath, rotatePoint } from "./tileLayout";

export const RIVER_WIDTH = 0.17;
export const hasRiverBridge = (tile: ITile): boolean =>
  ["river-costco-bridge", "river-mcdonalds", "river-road-bridge"].includes(tile.id);

/** Paths use the same exact edge portals in both renderers. */
export function riverPath(tile: ITile): Point[] {
  if (!tile.river) return [];
  const base = canonicalTile(tile);
  const edges = base.river!.edges;
  let points: Point[];
  if (base.river!.kind === "source") {
    points = Array.from({ length: 25 }, (_, i) => [0.015 * Math.sin((Math.PI * i) / 24) ** 2, 0.5 - (i / 24) * 0.4]);
  } else if (base.river!.kind === "lake") {
    points = [
      [0, -0.5],
      [0, -0.33],
      [-0.08, -0.2],
      [-0.12, -0.06],
    ];
  } else {
    points = roadPath(edges).map(([x, z], i) => {
      const straight = edges[0] === "north" && edges[1] === "south";
      const bend = straight
        ? (base.id === "river-meander" ? 0.085 : 0.035) *
          Math.sin((i / 24) * Math.PI * 2) *
          Math.sin((i / 24) * Math.PI) ** 2
        : 0;
      return [x + bend, z];
    });
  }
  return points.map((point) => rotatePoint(point, tile.orientation));
}

export function restaurantPosition(tile: ITile): Point {
  const point: Point =
    tile.id === "river-lake" ? [0.24, 0.28] : tile.id === "river-mcdonalds" ? [0, -0.31] : [-0.07, -0.075];
  return rotatePoint(point, tile.orientation);
}

export function tileRoadPath(tile: ITile, connection: string[]): Point[] {
  if ((tile.id === "river-costco-bridge" || tile.id === "river-mcdonalds") && connection.includes("center")) {
    const edge = connection.find((edge) => edge !== "center")!;
    const [x, z] = PORTALS[edge];
    return Array.from({ length: 25 }, (_, i) => {
      const distance = 1 - (i / 24) * 1.62;
      return [x * distance, z * distance];
    });
  }
  return roadPath(connection);
}

export function nearRiver(tile: ITile, point: Point, margin = 0): boolean {
  if (!tile.river) return false;
  const basePoint = rotatePoint(point, -tile.orientation);
  if (
    tile.river.kind === "lake" &&
    Math.hypot((basePoint[0] + 0.12) / 0.24, (basePoint[1] + 0.04) / 0.24) < 1 + margin / 0.24
  )
    return true;
  return riverPath(tile).some((p) => Math.hypot(point[0] - p[0], point[1] - p[1]) < RIVER_WIDTH / 2 + margin);
}

/** Paint water last beneath raised bridges. Coordinates are tile-centered units. */
export function paintRiver(ctx: CanvasRenderingContext2D, tile: ITile): void {
  if (!tile.river) return;
  const points = riverPath(tile);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);
  for (const [color, width] of [
    ["#d9c995", RIVER_WIDTH + 0.055],
    ["#9ac9c2", RIVER_WIDTH + 0.024],
    ["#4aa2bd", RIVER_WIDTH],
    ["#71c1d3", RIVER_WIDTH * 0.65],
  ] as const) {
    ctx.beginPath();
    points.forEach(([x, z], i) => (i ? ctx.lineTo(x, z) : ctx.moveTo(x, z)));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    if (tile.river.kind === "lake") {
      const center = rotatePoint([-0.12, -0.04], tile.orientation);
      ctx.beginPath();
      ctx.arc(center[0], center[1], 0.14 + width / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Water depth for the animated shader: black on land, brightening from the
 * bank (≈0.1) to the middle of the channel (1). Same footprint as the painted
 * water, so the shader lands exactly on it.
 */
export function paintWaterDepth(ctx: CanvasRenderingContext2D, tile: ITile): void {
  if (!tile.river) return;
  const points = riverPath(tile);
  const lake = tile.river.kind === "lake" ? rotatePoint([-0.12, -0.04], tile.orientation) : undefined;
  const steps = 10;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < steps; i++) {
    const width = RIVER_WIDTH * (1 - i / steps);
    const grey = Math.round((255 * (i + 1)) / steps);
    ctx.strokeStyle = ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach(([x, z], j) => (j ? ctx.lineTo(x, z) : ctx.moveTo(x, z)));
    ctx.stroke();
    if (lake) {
      ctx.beginPath();
      ctx.arc(lake[0], lake[1], 0.14 + width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
