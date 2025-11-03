import React, { useRef, useEffect } from "react";
import { Tile } from "../tile";
import { renderTileToCanvas, TILE_SIZE } from "../lib/tileRendering";

interface TileRendererProps {
  tile: Tile;
  size?: number;
  rotation?: number;
  showPreview?: boolean;
  className?: string;
}

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

    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Use shared rendering function
    renderTileToCanvas(ctx, tile, size);

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
