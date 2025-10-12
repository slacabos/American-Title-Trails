import React, { useRef, useEffect, useState, useCallback } from "react";
import { Board } from "../board";
import { Tile } from "../tile";
import { Position } from "../types";

// Tile rendering constants (same as TileRenderer)
const ROAD_COLOR = "#8B4513"; // Brown for roads
const COSTCO_COLOR = "#4169E1"; // Royal blue for Costco
const MCDONALDS_COLOR = "#FFD700"; // Gold for McDonalds
const FIELD_COLOR = "#90EE90"; // Light green for fields

// Helper function to render a tile to a canvas context
const renderTileToCanvas = (
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

const drawCostcoZone = (
  ctx: CanvasRenderingContext2D,
  directions: string[],
  size: number
) => {
  const center = size / 2;
  const quarter = size / 4;

  ctx.fillStyle = COSTCO_COLOR;
  ctx.strokeStyle = "#1E40AF";
  ctx.lineWidth = 1;

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

interface BoardCanvasProps {
  board: Board;
  currentTile?: Tile;
  onTilePlace?: (position: Position) => void;
  tileSize?: number;
  showGrid?: boolean;
  showValidPlacements?: boolean;
}

interface CanvasState {
  offsetX: number;
  offsetY: number;
  scale: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  hoverPosition?: Position;
}

const INITIAL_SCALE = 1;
const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const GRID_COLOR = "#ddd";
const VALID_PLACEMENT_COLOR = "rgba(0, 255, 0, 0.3)";
const HOVER_COLOR = "rgba(0, 0, 255, 0.2)";

export const BoardCanvas: React.FC<BoardCanvasProps> = ({
  board,
  currentTile,
  onTilePlace,
  tileSize = 64,
  showGrid = true,
  showValidPlacements = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: INITIAL_SCALE,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  });

  const [validPlacements, setValidPlacements] = useState<Position[]>([]);

  // Update valid placements when board or current tile changes
  useEffect(() => {
    if (currentTile) {
      setValidPlacements(board.getPlacementCandidates());
    } else {
      setValidPlacements([]);
    }
  }, [board, currentTile]);

  // Convert screen coordinates to board coordinates
  const screenToBoard = useCallback(
    (screenX: number, screenY: number): Position => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const canvasX = screenX - rect.left;
      const canvasY = screenY - rect.top;

      const scaledTileSize = tileSize * canvasState.scale;
      const boardX = Math.floor(
        (canvasX - canvasState.offsetX) / scaledTileSize
      );
      const boardY = Math.floor(
        (canvasY - canvasState.offsetY) / scaledTileSize
      );

      return { x: boardX, y: boardY };
    },
    [canvasState, tileSize]
  );

  // Convert board coordinates to screen coordinates
  const boardToScreen = useCallback(
    (boardX: number, boardY: number): { x: number; y: number } => {
      const scaledTileSize = tileSize * canvasState.scale;
      return {
        x: boardX * scaledTileSize + canvasState.offsetX,
        y: boardY * scaledTileSize + canvasState.offsetY,
      };
    },
    [canvasState, tileSize]
  );

  // Render the board
  const renderBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const scaledTileSize = tileSize * canvasState.scale;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid if enabled
    if (showGrid && canvasState.scale > 0.5) {
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;

      // Calculate grid bounds
      const startX = Math.floor(-canvasState.offsetX / scaledTileSize) - 1;
      const endX =
        Math.ceil((width - canvasState.offsetX) / scaledTileSize) + 1;
      const startY = Math.floor(-canvasState.offsetY / scaledTileSize) - 1;
      const endY =
        Math.ceil((height - canvasState.offsetY) / scaledTileSize) + 1;

      // Draw vertical lines
      for (let x = startX; x <= endX; x++) {
        const screenX = x * scaledTileSize + canvasState.offsetX;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, height);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = startY; y <= endY; y++) {
        const screenY = y * scaledTileSize + canvasState.offsetY;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(width, screenY);
        ctx.stroke();
      }
    }

    // Draw placed tiles
    board.tiles.forEach((record) => {
      const { x, y } = boardToScreen(record.position.x, record.position.y);

      // Only render if tile is visible
      if (
        x + scaledTileSize >= 0 &&
        x <= width &&
        y + scaledTileSize >= 0 &&
        y <= height
      ) {
        // Create a temporary canvas for the tile
        const tileCanvas = document.createElement("canvas");
        tileCanvas.width = tileSize;
        tileCanvas.height = tileSize;
        const tileCtx = tileCanvas.getContext("2d");

        if (tileCtx) {
          // Render the actual tile with its features
          renderTileToCanvas(tileCtx, record.tile, tileSize);

          // Draw the tile to main canvas
          ctx.drawImage(tileCanvas, x, y, scaledTileSize, scaledTileSize);
        }
      }
    });

    // Draw valid placement indicators
    if (showValidPlacements && currentTile) {
      ctx.fillStyle = VALID_PLACEMENT_COLOR;
      validPlacements.forEach((position) => {
        if (currentTile && board.canPlace(currentTile, position)) {
          const { x, y } = boardToScreen(position.x, position.y);
          ctx.fillRect(x, y, scaledTileSize, scaledTileSize);
        }
      });
    }

    // Draw hover indicator
    if (canvasState.hoverPosition && currentTile) {
      const { x, y } = boardToScreen(
        canvasState.hoverPosition.x,
        canvasState.hoverPosition.y
      );

      if (board.canPlace(currentTile, canvasState.hoverPosition)) {
        ctx.fillStyle = HOVER_COLOR;
        ctx.fillRect(x, y, scaledTileSize, scaledTileSize);

        // Draw preview of current tile
        ctx.strokeStyle = "#00f";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, scaledTileSize, scaledTileSize);
      }
    }
  }, [
    board,
    canvasState,
    tileSize,
    currentTile,
    validPlacements,
    showGrid,
    showValidPlacements,
    boardToScreen,
  ]);

  // Handle canvas resize
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    renderBoard();
  }, [renderBoard]);

  // Set up resize observer
  useEffect(() => {
    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [resizeCanvas]);

  // Re-render when state changes
  useEffect(() => {
    renderBoard();
  }, [renderBoard]);

  // Set up native wheel event listener to prevent page scrolling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, canvasState.scale * scaleFactor)
      );

      // Zoom towards mouse position
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleRatio = newScale / canvasState.scale;
      const newOffsetX = mouseX - (mouseX - canvasState.offsetX) * scaleRatio;
      const newOffsetY = mouseY - (mouseY - canvasState.offsetY) * scaleRatio;

      setCanvasState((prev) => ({
        ...prev,
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      }));
    };

    canvas.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleNativeWheel);
    };
  }, [canvasState.scale, canvasState.offsetX, canvasState.offsetY]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    const position = screenToBoard(e.clientX, e.clientY);

    if (e.button === 0 && currentTile && onTilePlace) {
      // Left click - place tile
      if (board.canPlace(currentTile, position)) {
        onTilePlace(position);
        return;
      }
    }

    // Start dragging
    setCanvasState((prev) => ({
      ...prev,
      isDragging: true,
      dragStart: { x: e.clientX, y: e.clientY },
    }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const position = screenToBoard(e.clientX, e.clientY);

    if (canvasState.isDragging) {
      // Handle dragging
      const deltaX = e.clientX - canvasState.dragStart.x;
      const deltaY = e.clientY - canvasState.dragStart.y;

      setCanvasState((prev) => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
        dragStart: { x: e.clientX, y: e.clientY },
      }));
    } else {
      // Update hover position
      setCanvasState((prev) => ({
        ...prev,
        hoverPosition: position,
      }));
    }
  };

  const handleMouseUp = () => {
    setCanvasState((prev) => ({
      ...prev,
      isDragging: false,
    }));
  };

  const handleMouseLeave = () => {
    setCanvasState((prev) => ({
      ...prev,
      isDragging: false,
      hoverPosition: undefined,
    }));
  };

  return (
    <div
      ref={containerRef}
      className="board-canvas-container"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: canvasState.isDragging
            ? "grabbing"
            : currentTile &&
              canvasState.hoverPosition &&
              board.canPlace(currentTile, canvasState.hoverPosition)
            ? "pointer"
            : "grab",
        }}
      />

      {/* Controls overlay */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(13, 27, 42, 0.9)",
          color: "#f1faee",
          padding: "8px",
          borderRadius: "4px",
          fontSize: "12px",
          border: "1px solid rgba(69, 123, 157, 0.5)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div>Zoom: {Math.round(canvasState.scale * 100)}%</div>
        <div>Tiles: {board.tiles.size}</div>
        {currentTile && <div>Valid placements: {validPlacements.length}</div>}
      </div>
    </div>
  );
};

export default BoardCanvas;
