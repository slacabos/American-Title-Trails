import type { ITile } from "@/interfaces/ITile";
import { TILE_COLORS } from "@/constants/colors";
import { Point, rotatePoint, zonePolygon } from "./tileLayout";
import { paintRiver, restaurantPosition, tileRoadPath } from "./riverLayout";
import { warehouseFootprint } from "./warehouseLayout";

/** Classic view uses the same water, bank and building footprints as 3D. */
export function renderRiverTile(ctx: CanvasRenderingContext2D, tile: ITile, size: number): void {
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(size, size);
  ctx.fillStyle = TILE_COLORS.field;
  ctx.fillRect(-0.5, -0.5, 1, 1);
  const path = (points: Point[], close = false) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    if (close) ctx.closePath();
  };
  tile.costcoZones.forEach((_, i) => {
    path(zonePolygon(tile, i), true);
    ctx.fillStyle = TILE_COLORS.costco;
    ctx.fill();
  });
  paintRiver(ctx, tile);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const connection of tile.roadConnections) {
    const road = tileRoadPath(tile, connection);
    for (const [color, width] of [["#ddd8bd", 0.235], [TILE_COLORS.road, 0.2]] as const) {
      path(road);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    path(road);
    ctx.strokeStyle = "#f2d786";
    ctx.lineWidth = 0.006;
    ctx.setLineDash([0.035, 0.025]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  tile.costcoZones.forEach((_, i) => {
    const footprint = warehouseFootprint(tile, i);
    path(footprint, true);
    ctx.fillStyle = "#dce1d7";
    ctx.fill();
    ctx.strokeStyle = "#c5493f";
    ctx.lineWidth = 0.012;
    ctx.stroke();
    const center = footprint.reduce<Point>((sum, point) => [sum[0] + point[0] / footprint.length, sum[1] + point[1] / footprint.length], [0, 0]);
    ctx.save();
    ctx.translate(...center);
    ctx.rotate(tile.orientation * Math.PI / 2);
    ctx.fillStyle = "#c5493f";
    ctx.font = "bold 0.055px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("COSTCO", 0, 0.018);
    ctx.restore();
  });
  if (tile.hasMcDonalds) {
    const [x, z] = restaurantPosition(tile);
    ctx.save();
    ctx.translate(x, z);
    ctx.rotate(tile.orientation * Math.PI / 2);
    ctx.fillStyle = "#b8b9a6";
    ctx.fillRect(-0.18, -0.12, 0.36, 0.26);
    ctx.fillStyle = TILE_COLORS.mcdonalds;
    ctx.fillRect(-0.14, -0.085, 0.28, 0.17);
    ctx.fillStyle = "#c64032";
    ctx.font = "bold 0.12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("M", 0, 0.045);
    ctx.restore();
  }
  // The garden is scenery, not an additional claimable feature.
  if (tile.id === "river-garden-bend") {
    const [x, z] = rotatePoint([-0.25, -0.25], tile.orientation);
    ctx.fillStyle = "#cab670";
    ctx.fillRect(x - 0.06, z - 0.04, 0.12, 0.08);
  }
  ctx.restore();
}
