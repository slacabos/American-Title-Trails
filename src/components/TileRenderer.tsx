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
  zone: Tile["costcoZones"][number],
  size: number
) => {
  if (!zone.polygon.length) {
    return;
  }

  const points = zone.polygon.map((point) => ({
    x: point.x * size,
    y: point.y * size,
  }));

  ctx.fillStyle = COSTCO_COLOR;
  ctx.strokeStyle = "#1E90FF";
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.lineJoin = "round";

  drawSmoothPolygon(ctx, points);
  ctx.fill();
  ctx.stroke();

  if (zone.pennants && zone.pennants > 0) {
    drawPennants(ctx, points, zone.pennants, size);
  }
};

const drawSmoothPolygon = (
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>
) => {
  if (points.length < 2) return;

  const first = points[0];
  const last = points[points.length - 1];
  const start = {
    x: (first.x + last.x) / 2,
    y: (first.y + last.y) / 2,
  };

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const midpoint = {
      x: (current.x + next.x) / 2,
      y: (current.y + next.y) / 2,
    };
    ctx.quadraticCurveTo(current.x, current.y, midpoint.x, midpoint.y);
  }

  ctx.closePath();
};

const drawPennants = (
  ctx: CanvasRenderingContext2D,
  polygon: Array<{ x: number; y: number }>,
  count: number,
  size: number
) => {
  const centroid = polygon.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );

  centroid.x /= polygon.length;
  centroid.y /= polygon.length;

  const pennantHeight = size * 0.18;
  const pennantWidth = size * 0.12;
  const spacing = pennantWidth * 1.2;

  ctx.save();
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = Math.max(1, size * 0.015);

  for (let i = 0; i < count; i += 1) {
    const offset = (i - (count - 1) / 2) * spacing;
    ctx.beginPath();
    ctx.moveTo(centroid.x + offset, centroid.y - pennantHeight / 2);
    ctx.lineTo(centroid.x + offset, centroid.y + pennantHeight / 2);
    ctx.lineTo(centroid.x + offset + pennantWidth, centroid.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
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
