import { Tile } from "../tile";
import { CostcoSegment } from "../types";

// Tile rendering constants
export const TILE_SIZE = 64; // Base tile size in pixels
export const ROAD_COLOR = "#8B4513"; // Brown for roads
export const COSTCO_COLOR = "#4169E1"; // Royal blue for Costco
export const MCDONALDS_COLOR = "#FFD700"; // Gold for McDonalds
export const FIELD_COLOR = "#90EE90"; // Light green for fields

/**
 * Main function to render a tile to a canvas context
 */
export const renderTileToCanvas = (
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  size: number
) => {
  // Clear and draw background
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, size, size);

  // Add a subtle border
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, size, size);

  // Draw roads
  tile.roadConnections.forEach((connection: string[]) => {
    for (let i = 0; i < connection.length - 1; i++) {
      drawRoad(ctx, connection[i], connection[i + 1], size);
    }
  });

  // Draw Costco zones
  tile.costcoZones.forEach((zone: CostcoSegment) => {
    drawCostcoZone(ctx, zone, size);
  });

  // Draw McDonalds
  if (tile.center === "mcdonalds") {
    drawMcDonalds(ctx, size);
  }
};

/**
 * Draw a road segment between two connection points
 */
const drawRoad = (
  ctx: CanvasRenderingContext2D,
  from: string,
  to: string,
  size: number
) => {
  const roadWidth = size * 0.2;
  const center = size / 2;

  ctx.fillStyle = ROAD_COLOR;
  ctx.strokeStyle = "#654321";
  ctx.lineWidth = 1;

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

  // Draw road between connection points
  ctx.beginPath();
  ctx.moveTo(start.x - roadWidth / 2, start.y);
  ctx.lineTo(end.x - roadWidth / 2, end.y);
  ctx.lineTo(end.x + roadWidth / 2, end.y);
  ctx.lineTo(start.x + roadWidth / 2, start.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

/**
 * Draw a Costco zone with support for different shapes
 */
const drawCostcoZone = (
  ctx: CanvasRenderingContext2D,
  zone: CostcoSegment,
  size: number
) => {
  ctx.fillStyle = COSTCO_COLOR;
  ctx.strokeStyle = "#1E40AF";
  ctx.lineWidth = 1;

  // Draw based on zone shape and segments
  ctx.beginPath();

  if (zone.shape === "curved") {
    drawCurvedCostcoZone(ctx, zone, size);
  } else if (zone.shape === "complex") {
    drawComplexCostcoZone(ctx, zone, size);
  } else {
    // Default straight shape
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
 * Draw a straight Costco zone (quadrants and sides)
 */
const drawStraightCostcoZone = (
  ctx: CanvasRenderingContext2D,
  zone: CostcoSegment,
  size: number
) => {
  const center = size / 2;
  const quarter = size / 4;
  const directions = zone.segments;

  if (directions.includes("north") && directions.includes("east")) {
    // Northeast quadrant
    ctx.rect(center, 0, center, center);
  } else if (directions.includes("north") && directions.includes("west")) {
    // Northwest quadrant
    ctx.rect(0, 0, center, center);
  } else if (directions.includes("south") && directions.includes("east")) {
    // Southeast quadrant
    ctx.rect(center, center, center, center);
  } else if (directions.includes("south") && directions.includes("west")) {
    // Southwest quadrant
    ctx.rect(0, center, center, center);
  } else {
    // Full side or center
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
 * Draw a curved Costco zone (for corner connections)
 */
const drawCurvedCostcoZone = (
  ctx: CanvasRenderingContext2D,
  zone: CostcoSegment,
  size: number
) => {
  const center = size / 2;
  const directions = zone.segments;

  // Create curved boundaries for corner connections
  if (directions.includes("north") && directions.includes("east")) {
    // Curved northeast corner
    ctx.moveTo(center, 0);
    ctx.quadraticCurveTo(size, 0, size, center);
    ctx.lineTo(center, center);
    ctx.closePath();
  } else if (directions.includes("north") && directions.includes("west")) {
    // Curved northwest corner
    ctx.moveTo(0, center);
    ctx.quadraticCurveTo(0, 0, center, 0);
    ctx.lineTo(center, center);
    ctx.closePath();
  } else if (directions.includes("south") && directions.includes("east")) {
    // Curved southeast corner
    ctx.moveTo(size, center);
    ctx.quadraticCurveTo(size, size, center, size);
    ctx.lineTo(center, center);
    ctx.closePath();
  } else if (directions.includes("south") && directions.includes("west")) {
    // Curved southwest corner
    ctx.moveTo(center, size);
    ctx.quadraticCurveTo(0, size, 0, center);
    ctx.lineTo(center, center);
    ctx.closePath();
  }
};

/**
 * Draw a complex Costco zone (irregular shapes)
 */
const drawComplexCostcoZone = (
  ctx: CanvasRenderingContext2D,
  zone: CostcoSegment,
  size: number
) => {
  const center = size / 2;
  const quarter = size / 4;
  const directions = zone.segments;

  // Complex shape covering multiple areas
  if (directions.includes("center")) {
    ctx.rect(quarter, quarter, center, center);
  }

  // Add connecting areas
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
 * Draw a pennant on a Costco zone
 */
const drawPennant = (
  ctx: CanvasRenderingContext2D,
  zone: CostcoSegment,
  size: number
) => {
  const center = size / 2;
  const pennantSize = size * 0.15;

  // Find the best position for the pennant based on zone segments
  let pennantX = center;
  let pennantY = center;

  if (zone.segments.includes("north")) {
    pennantY = size * 0.25;
  }
  if (zone.segments.includes("south")) {
    pennantY = size * 0.75;
  }
  if (zone.segments.includes("east")) {
    pennantX = size * 0.75;
  }
  if (zone.segments.includes("west")) {
    pennantX = size * 0.25;
  }

  // Draw pennant as a small triangle flag
  ctx.fillStyle = "#FFD700"; // Gold color for pennant
  ctx.strokeStyle = "#FFA500";
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
 * Draw a McDonalds abbey in the center
 */
const drawMcDonalds = (ctx: CanvasRenderingContext2D, size: number) => {
  const center = size / 2;
  const radius = size * 0.15;

  ctx.fillStyle = MCDONALDS_COLOR;
  ctx.strokeStyle = "#DAA520";
  ctx.lineWidth = 2;

  // Draw McDonalds as a star/special symbol
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Add "M" text
  ctx.fillStyle = "#B8860B";
  ctx.font = `bold ${size * 0.2}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M", center, center);
};
