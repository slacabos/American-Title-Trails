import React, { useRef, useEffect } from "react";
import { Tile } from "../tile";

interface TileRendererProps {
  tile: Tile;
  size?: number;
  rotation?: number;
  showPreview?: boolean;
  className?: string;
}

const TILE_SIZE = 64; // Base tile size in pixels
const ROAD_COLOR = "#8B4513"; // Brown for roads
const COSTCO_COLOR = "#4169E1"; // Royal blue for Costco
const MCDONALDS_COLOR = "#FFD700"; // Gold for McDonalds
const FIELD_COLOR = "#90EE90"; // Light green for fields

const drawTileBackground = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, size, size);

  // Add a subtle border
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, size, size);
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
    // Road to/from center
    ctx.moveTo(start.x - roadWidth / 2, start.y);
    ctx.lineTo(end.x - roadWidth / 2, end.y);
    ctx.lineTo(end.x + roadWidth / 2, end.y);
    ctx.lineTo(start.x + roadWidth / 2, start.y);
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
  ctx.strokeStyle = "#1E90FF";
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

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Apply rotation
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);

    // Clear and draw background
    ctx.clearRect(0, 0, size, size);
    drawTileBackground(ctx, size);

    // Draw roads
    tile.roadConnections.forEach((connection) => {
      for (let i = 0; i < connection.length - 1; i++) {
        drawRoad(ctx, connection[i], connection[i + 1], size);
      }
    });

    // Draw Costco zones
    tile.costcoZones.forEach((zone) => {
      drawCostcoZone(ctx, zone, size);
    });

    // Draw McDonalds
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
    <canvas
      ref={canvasRef}
      className={`tile-renderer ${className}`}
      style={{
        display: "block",
        imageRendering: "pixelated",
      }}
    />
  );
};

export default TileRenderer;
