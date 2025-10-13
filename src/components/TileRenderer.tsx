import React, { useRef, useEffect } from "react";
import { Tile } from "../tile";
import { renderTileToCanvas } from "../utils/tileRendering";

interface TileRendererProps {
  tile: Tile;
  size?: number;
  rotation?: number;
  showPreview?: boolean;
  className?: string;
}

const TILE_SIZE = 64; // Base tile size in pixels

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

    // Clear canvas and render tile using shared utility with fill style for legacy compatibility
    ctx.clearRect(0, 0, size, size);
    renderTileToCanvas(ctx, tile, size, { roadStyle: "fill" });

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
