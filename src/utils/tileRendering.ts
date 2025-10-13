import { Tile } from "../tile";
import { CostcoSegment } from "../types";
import { TILE_COLORS } from "../constants/colors";

// Tile rendering constants
const ROAD_COLOR = TILE_COLORS.road;
const FIELD_COLOR = TILE_COLORS.field;
const COSTCO_COLOR = TILE_COLORS.costco;
const MCDONALDS_COLOR = TILE_COLORS.mcdonalds;
const PENNANT_SIZE_RATIO = 0.15;
const PENNANT_GOLD_COLOR = TILE_COLORS.pennantGold;
const PENNANT_ORANGE_COLOR = TILE_COLORS.pennantOrange;
const QUARTER_POSITION = 0.25;
const THREE_QUARTER_POSITION = 0.75;

export interface RoadRenderOptions {
  style: "stroke" | "fill";
  width: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
}

/**
 * Renders a complete tile to a canvas context
 */
export const renderTileToCanvas = (
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  size: number,
  options: { roadStyle?: "stroke" | "fill" } = {}
) => {
  // Clear and draw background
  drawTileBackground(ctx, size);

  // Add a subtle border
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, size, size);

  // Draw roads with specified style
  const roadStyle = options.roadStyle || "stroke";
  tile.roadConnections.forEach((connection) => {
    for (let i = 0; i < connection.length - 1; i++) {
      drawRoad(ctx, connection[i], connection[i + 1], size, {
        style: roadStyle,
        width: size * 0.2,
        lineCap: "round",
        lineJoin: "round",
      });
    }
  });

  // Draw center road if present (before other center features)
  if (tile.center === "road") {
    drawCenterRoad(ctx, size);

    // For cloverleaf tiles, redraw road connections on top for visibility
    if (roadStyle === "fill") {
      tile.roadConnections.forEach((connection) => {
        for (let i = 0; i < connection.length - 1; i++) {
          drawRoad(ctx, connection[i], connection[i + 1], size, {
            style: roadStyle,
            width: size * 0.2,
          });
        }
      });
    }
  }

  // Draw Costco zones
  tile.costcoZones.forEach((zone) => {
    drawCostcoZone(ctx, zone, size);
  });

  // Draw McDonalds
  if (tile.center === "mcdonalds") {
    drawMcDonalds(ctx, size);
  }
};

/**
 * Draws tile background
 */
export const drawTileBackground = (
  ctx: CanvasRenderingContext2D,
  size: number
) => {
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, size, size);
};

/**
 * Draws a road segment between two points with configurable style
 */
export const drawRoad = (
  ctx: CanvasRenderingContext2D,
  from: string,
  to: string,
  size: number,
  options: RoadRenderOptions
) => {
  const { style, width, lineCap = "round", lineJoin = "round" } = options;
  const center = size / 2;

  ctx.fillStyle = ROAD_COLOR;
  ctx.strokeStyle = ROAD_COLOR;

  if (style === "stroke") {
    ctx.lineWidth = width;
    ctx.lineCap = lineCap;
    ctx.lineJoin = lineJoin;
  } else {
    ctx.lineWidth = 1;
  }

  const getConnectionPoint = (direction: string) => {
    switch (direction) {
      case "north":
        return { x: center, y: 0 };
      case "south":
        return { x: center, y: size };
      case "east":
        return { x: size, y: center };
      case "west":
        return { x: 0, y: center };
      default:
        return { x: center, y: center };
    }
  };

  const start = getConnectionPoint(from);
  const end = getConnectionPoint(to);

  if (style === "stroke") {
    // Modern stroke-based rendering for curved roads
    const isCornerConnection =
      (from === "north" && to === "east") ||
      (from === "east" && to === "north") ||
      (from === "north" && to === "west") ||
      (from === "west" && to === "north") ||
      (from === "south" && to === "east") ||
      (from === "east" && to === "south") ||
      (from === "south" && to === "west") ||
      (from === "west" && to === "south");

    ctx.beginPath();

    if (isCornerConnection) {
      // Draw curved road for corner connections
      const controlX =
        from.includes("north") || from.includes("south") ? start.x : end.x;
      const controlY =
        from.includes("east") || from.includes("west") ? start.y : end.y;

      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
    } else {
      // Draw straight road for opposite or center connections
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
    }

    ctx.stroke();
  } else {
    // Legacy fill-based rendering for TileRenderer compatibility
    ctx.beginPath();

    if (from === "center" || to === "center") {
      // Road to/from center - properly handle horizontal and vertical roads
      const isHorizontal = start.y === end.y;
      const isVertical = start.x === end.x;

      if (isHorizontal) {
        ctx.moveTo(start.x, start.y - width / 2);
        ctx.lineTo(end.x, end.y - width / 2);
        ctx.lineTo(end.x, end.y + width / 2);
        ctx.lineTo(start.x, start.y + width / 2);
      } else if (isVertical) {
        ctx.moveTo(start.x - width / 2, start.y);
        ctx.lineTo(end.x - width / 2, end.y);
        ctx.lineTo(end.x + width / 2, end.y);
        ctx.lineTo(start.x + width / 2, start.y);
      } else {
        // Diagonal road
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const perpAngle = angle + Math.PI / 2;
        const dx = (Math.cos(perpAngle) * width) / 2;
        const dy = (Math.sin(perpAngle) * width) / 2;

        ctx.moveTo(start.x + dx, start.y + dy);
        ctx.lineTo(end.x + dx, end.y + dy);
        ctx.lineTo(end.x - dx, end.y - dy);
        ctx.lineTo(start.x - dx, start.y - dy);
      }
    } else {
      // Direct road connection
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const perpAngle = angle + Math.PI / 2;
      const dx = (Math.cos(perpAngle) * width) / 2;
      const dy = (Math.sin(perpAngle) * width) / 2;

      ctx.moveTo(start.x + dx, start.y + dy);
      ctx.lineTo(end.x + dx, end.y + dy);
      ctx.lineTo(end.x - dx, end.y - dy);
      ctx.lineTo(start.x - dx, start.y - dy);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
};

/**
 * Draws center road as a circle
 */
export const drawCenterRoad = (ctx: CanvasRenderingContext2D, size: number) => {
  const center = size / 2;
  const roadRadius = size * 0.15; // Smaller radius so connections are visible

  ctx.fillStyle = ROAD_COLOR;
  ctx.strokeStyle = ROAD_COLOR;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(center, center, roadRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
};

/**
 * Draws a Costco zone with full feature set
 */
export const drawCostcoZone = (
  ctx: CanvasRenderingContext2D,
  zone: CostcoSegment,
  size: number
) => {
  ctx.fillStyle = COSTCO_COLOR;
  ctx.strokeStyle = COSTCO_COLOR;
  ctx.lineWidth = 1;

  ctx.beginPath();

  if (zone.shape === "curved") {
    drawCurvedCostcoZone(ctx, zone, size);
  } else if (zone.shape === "complex") {
    drawComplexCostcoZone(ctx, zone, size);
  } else {
    drawStraightCostcoZone(ctx, zone, size);
  }

  ctx.fill();
  ctx.stroke();

  // Draw pennant if present
  if (zone.hasPennant) {
    drawPennant(ctx, zone, size);
  }
};

/**
 * Draws straight Costco zones
 */
export const drawStraightCostcoZone = (
  ctx: CanvasRenderingContext2D,
  zone: CostcoSegment,
  size: number
) => {
  const center = size / 2;
  const quarter = size / 4;
  const directions = zone.segments;

  if (directions.includes("north") && directions.includes("east")) {
    ctx.rect(center, 0, center, center);
  } else if (directions.includes("north") && directions.includes("west")) {
    ctx.rect(0, 0, center, center);
  } else if (directions.includes("south") && directions.includes("east")) {
    ctx.rect(center, center, center, center);
  } else if (directions.includes("south") && directions.includes("west")) {
    ctx.rect(0, center, center, center);
  } else {
    if (directions.includes("north")) {
      ctx.rect(quarter, 0, center, quarter);
    }
    if (directions.includes("south")) {
      ctx.rect(quarter, size - quarter, center, quarter);
    }
    if (directions.includes("east")) {
      ctx.rect(size - quarter, quarter, quarter, center);
    }
    if (directions.includes("west")) {
      ctx.rect(0, quarter, quarter, center);
    }
    if (directions.includes("center")) {
      ctx.rect(quarter, quarter, center, center);
    }
  }
};

/**
 * Draws curved Costco zones
 */
export const drawCurvedCostcoZone = (
  ctx: CanvasRenderingContext2D,
  zone: CostcoSegment,
  size: number
) => {
  const center = size / 2;
  const directions = zone.segments;

  if (directions.includes("north") && directions.includes("east")) {
    ctx.moveTo(center, 0);
    ctx.quadraticCurveTo(size, 0, size, center);
    ctx.lineTo(center, center);
    ctx.closePath();
  } else if (directions.includes("north") && directions.includes("west")) {
    ctx.moveTo(0, center);
    ctx.quadraticCurveTo(0, 0, center, 0);
    ctx.lineTo(center, center);
    ctx.closePath();
  } else if (directions.includes("south") && directions.includes("east")) {
    ctx.moveTo(size, center);
    ctx.quadraticCurveTo(size, size, center, size);
    ctx.lineTo(center, center);
    ctx.closePath();
  } else if (directions.includes("south") && directions.includes("west")) {
    ctx.moveTo(center, size);
    ctx.quadraticCurveTo(0, size, 0, center);
    ctx.lineTo(center, center);
    ctx.closePath();
  }
};

/**
 * Draws complex Costco zones
 */
export const drawComplexCostcoZone = (
  ctx: CanvasRenderingContext2D,
  zone: CostcoSegment,
  size: number
) => {
  const center = size / 2;
  const quarter = size / 4;
  const directions = zone.segments;

  if (directions.includes("center")) {
    ctx.rect(quarter, quarter, center, center);
  }

  directions.forEach((direction) => {
    switch (direction) {
      case "north":
        ctx.rect(quarter, 0, center, quarter + center / 4);
        break;
      case "south":
        ctx.rect(
          quarter,
          size - quarter - center / 4,
          center,
          quarter + center / 4
        );
        break;
      case "east":
        ctx.rect(
          size - quarter - center / 4,
          quarter,
          quarter + center / 4,
          center
        );
        break;
      case "west":
        ctx.rect(0, quarter, quarter + center / 4, center);
        break;
    }
  });
};

/**
 * Draws pennant on Costco zones
 */
export const drawPennant = (
  ctx: CanvasRenderingContext2D,
  zone: CostcoSegment,
  size: number
) => {
  const center = size / 2;
  const pennantSize = size * PENNANT_SIZE_RATIO;
  let pennantX = center;
  let pennantY = center;

  const directions = zone.segments.filter((s) => s !== "center");

  if (directions.length === 1) {
    const direction = directions[0];
    switch (direction) {
      case "north":
        pennantY = size * QUARTER_POSITION;
        break;
      case "south":
        pennantY = size * THREE_QUARTER_POSITION;
        break;
      case "east":
        pennantX = size * THREE_QUARTER_POSITION;
        break;
      case "west":
        pennantX = size * QUARTER_POSITION;
        break;
    }
  } else if (directions.length > 1) {
    let avgX = 0;
    let avgY = 0;
    let count = 0;

    directions.forEach((direction) => {
      switch (direction) {
        case "north":
          avgY += QUARTER_POSITION;
          count++;
          break;
        case "south":
          avgY += THREE_QUARTER_POSITION;
          count++;
          break;
        case "east":
          avgX += THREE_QUARTER_POSITION;
          count++;
          break;
        case "west":
          avgX += QUARTER_POSITION;
          count++;
          break;
      }
    });

    if (count > 0) {
      pennantX = avgX > 0 ? size * (avgX / count) : center;
      pennantY = avgY > 0 ? size * (avgY / count) : center;
    }
  }

  ctx.fillStyle = PENNANT_GOLD_COLOR;
  ctx.strokeStyle = PENNANT_ORANGE_COLOR;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(pennantX - pennantSize / 2, pennantY - pennantSize / 2);
  ctx.lineTo(pennantX + pennantSize / 2, pennantY);
  ctx.lineTo(pennantX - pennantSize / 2, pennantY + pennantSize / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

/**
 * Draws McDonald's restaurant
 */
export const drawMcDonalds = (ctx: CanvasRenderingContext2D, size: number) => {
  const center = size / 2;
  const radius = size * 0.15;

  ctx.fillStyle = MCDONALDS_COLOR;
  ctx.strokeStyle = MCDONALDS_COLOR;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Add "M" text
  ctx.fillStyle = MCDONALDS_COLOR;
  ctx.font = `bold ${size * 0.2}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M", center, center);
};
