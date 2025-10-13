import React, { useRef, useEffect } from "react";
import { Tile } from "../tile";
import { TILE_COLORS } from "../constants/colors";

interface TileRendererProps {
  tile: Tile;
  size?: number;
  rotation?: number;
  showPreview?: boolean;
  className?: string;
}

const TILE_SIZE = 64; // Base tile size in pixels
const ROAD_COLOR = TILE_COLORS.road;
const COSTCO_COLOR = TILE_COLORS.costco;
const MCDONALDS_COLOR = TILE_COLORS.mcdonalds;
const FIELD_COLOR = TILE_COLORS.field;

const drawTileBackground = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, size, size);
};

const drawRoad = (
  ctx: CanvasRenderingContext2D,
  from: string,
  to: string,
  size: number
) => {
  const roadWidth = size * 0.2;
  const center = size / 2;

  ctx.fillStyle = ROAD_COLOR;
  ctx.strokeStyle = ROAD_COLOR;
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
      case "center":
        return { x: center, y: center };
      default:
        return { x: center, y: center };
    }
  };

  const start = getConnectionPoint(from);
  const end = getConnectionPoint(to);

  // Draw road segment
  ctx.beginPath();

  if (from === "center" || to === "center") {
    // Road to/from center - properly handle horizontal and vertical roads
    const isHorizontal = start.y === end.y;
    const isVertical = start.x === end.x;

    if (isHorizontal) {
      // Horizontal road - apply width to Y axis
      ctx.moveTo(start.x, start.y - roadWidth / 2);
      ctx.lineTo(end.x, end.y - roadWidth / 2);
      ctx.lineTo(end.x, end.y + roadWidth / 2);
      ctx.lineTo(start.x, start.y + roadWidth / 2);
    } else if (isVertical) {
      // Vertical road - apply width to X axis
      ctx.moveTo(start.x - roadWidth / 2, start.y);
      ctx.lineTo(end.x - roadWidth / 2, end.y);
      ctx.lineTo(end.x + roadWidth / 2, end.y);
      ctx.lineTo(start.x + roadWidth / 2, start.y);
    } else {
      // Diagonal road - use the existing perpendicular calculation
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const perpAngle = angle + Math.PI / 2;
      const dx = (Math.cos(perpAngle) * roadWidth) / 2;
      const dy = (Math.sin(perpAngle) * roadWidth) / 2;

      ctx.moveTo(start.x + dx, start.y + dy);
      ctx.lineTo(end.x + dx, end.y + dy);
      ctx.lineTo(end.x - dx, end.y - dy);
      ctx.lineTo(start.x - dx, start.y - dy);
    }
  } else {
    // Direct road connection
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const perpAngle = angle + Math.PI / 2;

    const dx = (Math.cos(perpAngle) * roadWidth) / 2;
    const dy = (Math.sin(perpAngle) * roadWidth) / 2;

    ctx.moveTo(start.x + dx, start.y + dy);
    ctx.lineTo(end.x + dx, end.y + dy);
    ctx.lineTo(end.x - dx, end.y - dy);
    ctx.lineTo(start.x - dx, start.y - dy);
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

const drawCostcoZone = (
  ctx: CanvasRenderingContext2D,
  zone: import("../types").CostcoSegment,
  size: number
) => {
  const directions = zone.segments;
  ctx.fillStyle = COSTCO_COLOR;
  ctx.strokeStyle = COSTCO_COLOR;
  ctx.lineWidth = 2;

  const center = size / 2;
  const quarter = size / 4;

  // Simple Costco zone representation
  ctx.beginPath();

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
  }

  ctx.fill();
  ctx.stroke();
};

const drawCurves = (
  ctx: CanvasRenderingContext2D,
  size: number,
  tile: Tile
) => {
  const roadWidth = size * 0.2;

  ctx.fillStyle = ROAD_COLOR;
  ctx.strokeStyle = ROAD_COLOR;
  ctx.lineWidth = 1;

  // Check for curved road patterns using the public edgeAt method
  const hasRoads = {
    north: tile.edgeAt("north") === "road",
    south: tile.edgeAt("south") === "road",
    east: tile.edgeAt("east") === "road",
    west: tile.edgeAt("west") === "road",
  };

  // Draw curves for adjacent road connections (90-degree turns)
  if (hasRoads.north && hasRoads.east && !hasRoads.south && !hasRoads.west) {
    // North-East curve
    drawCurve(ctx, size, "north", "east", roadWidth);
  }
  if (hasRoads.east && hasRoads.south && !hasRoads.west && !hasRoads.north) {
    // East-South curve
    drawCurve(ctx, size, "east", "south", roadWidth);
  }
  if (hasRoads.south && hasRoads.west && !hasRoads.north && !hasRoads.east) {
    // South-West curve
    drawCurve(ctx, size, "south", "west", roadWidth);
  }
  if (hasRoads.west && hasRoads.north && !hasRoads.east && !hasRoads.south) {
    // West-North curve
    drawCurve(ctx, size, "west", "north", roadWidth);
  }
};

const drawCurve = (
  ctx: CanvasRenderingContext2D,
  size: number,
  from: string,
  to: string,
  roadWidth: number
) => {
  ctx.beginPath();

  // Determine curve parameters based on directions
  // The curve should be positioned at the corner where the roads meet
  if (from === "north" && to === "east") {
    // North to East curve - arc from top-right corner
    const centerX = size;
    const centerY = 0;
    const radius = size / 2;
    const startAngle = Math.PI; // Start from west
    const endAngle = Math.PI / 2; // End at south

    // Outer arc (larger radius)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle, true);
    // Inner arc (smaller radius)
    ctx.arc(centerX, centerY, radius - roadWidth, endAngle, startAngle, false);
  } else if (from === "east" && to === "south") {
    // East to South curve - arc from bottom-right corner
    const centerX = size;
    const centerY = size;
    const radius = size / 2;
    const startAngle = Math.PI; // Start from west
    const endAngle = (3 * Math.PI) / 2; // End at north

    ctx.arc(centerX, centerY, radius, startAngle, endAngle, true);
    ctx.arc(centerX, centerY, radius - roadWidth, endAngle, startAngle, false);
  } else if (from === "south" && to === "west") {
    // South to West curve - arc from bottom-left corner
    const centerX = 0;
    const centerY = size;
    const radius = size / 2;
    const startAngle = 0; // Start from east
    const endAngle = (3 * Math.PI) / 2; // End at north

    ctx.arc(centerX, centerY, radius, startAngle, endAngle, true);
    ctx.arc(centerX, centerY, radius - roadWidth, endAngle, startAngle, false);
  } else if (from === "west" && to === "north") {
    // West to North curve - arc from top-left corner
    const centerX = 0;
    const centerY = 0;
    const radius = size / 2;
    const startAngle = Math.PI / 2; // Start from south
    const endAngle = 0; // End at east

    ctx.arc(centerX, centerY, radius, startAngle, endAngle, true);
    ctx.arc(centerX, centerY, radius - roadWidth, endAngle, startAngle, false);
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

const drawCenterRoad = (ctx: CanvasRenderingContext2D, size: number) => {
  const center = size / 2;
  const roadRadius = size * 0.15; // Smaller center road area so connections are visible

  ctx.fillStyle = ROAD_COLOR;
  ctx.strokeStyle = ROAD_COLOR;
  ctx.lineWidth = 1;

  // Draw center road as a circle
  ctx.beginPath();
  ctx.arc(center, center, roadRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
};

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

export const TileRenderer: React.FC<TileRendererProps> = ({
  tile,
  size = TILE_SIZE,
  rotation = 0,
  showPreview = false,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get device pixel ratio for hi-DPI displays
    const dpr = window.devicePixelRatio || 1;

    // Set the actual canvas size in memory (scaled up for hi-DPI)
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Set the display size (CSS size)
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    // Scale the drawing context so everything draws at the higher resolution
    ctx.scale(dpr, dpr);

    // Enable anti-aliasing for smoother rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Apply rotation
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);

    // Clear and draw background
    ctx.clearRect(0, 0, size, size);
    drawTileBackground(ctx, size);

    // Check if this is a curved road tile (only 2 adjacent edges have roads)
    const roadEdges = ["north", "east", "south", "west"].filter(
      (dir) => tile.edgeAt(dir as any) === "road"
    );
    const isCurvedRoad =
      (roadEdges.length === 2 &&
        Math.abs(
          ["north", "east", "south", "west"].indexOf(roadEdges[0]) -
            ["north", "east", "south", "west"].indexOf(roadEdges[1])
        ) === 1) ||
      (roadEdges.includes("north") && roadEdges.includes("west"));

    if (isCurvedRoad) {
      // Draw curves for curved road tiles
      drawCurves(ctx, size, tile);
    } else {
      // Draw straight roads for non-curved tiles (including cloverleaf)
      tile.roadConnections.forEach((connection) => {
        for (let i = 0; i < connection.length - 1; i++) {
          drawRoad(ctx, connection[i], connection[i + 1], size);
        }
      });
    }

    // For cloverleaf tiles (center is road), draw center road first, then draw roads on top
    if (tile.center === "road") {
      drawCenterRoad(ctx, size);

      // Redraw road connections on top of center road for cloverleaf visibility
      tile.roadConnections.forEach((connection) => {
        for (let i = 0; i < connection.length - 1; i++) {
          drawRoad(ctx, connection[i], connection[i + 1], size);
        }
      });
    }

    // Draw Costco zones
    tile.costcoZones.forEach((zone) => {
      drawCostcoZone(ctx, zone, size);
    });

    // Draw other center features (road is handled above)
    if (tile.center === "mcdonalds") {
      drawMcDonalds(ctx, size);
    }

    // Add preview overlay if needed
    if (showPreview) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(0, 0, size, size);
    }

    ctx.restore();
  }, [tile, size, rotation, showPreview]);

  return (
    <div
      className={`tile-renderer-container ${className}`}
      style={{
        display: "inline-block",
        border: "2px solid #333",
        borderRadius: "12px",
        overflow: "hidden",
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <canvas
        ref={canvasRef}
        className="tile-renderer"
        style={{
          display: "block",
          imageRendering: "pixelated",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default TileRenderer;
