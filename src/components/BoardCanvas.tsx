import React, { useRef, useEffect, useState, useCallback } from "react";
import type { ITile, IBoard } from "../interfaces";
import { Position, TileRecord, GameState } from "../types";
import { featureAnchor, resolveClaim, zonePolygon } from "@/rendering/tileLayout";
import { UI_COLORS } from "../constants/colors";
import { renderTileToCanvas } from "../utils/tileRendering";
import type { CompletedCostco } from "@/rendering/completedCostcos";

// Both renderers resolve the engine's stored direction/corner claims identically.
const renderFollowerDots = (
  ctx: CanvasRenderingContext2D, record: TileRecord, x: number, y: number,
  size: number, gameState: GameState, board: IBoard
) => {
  board.getFeatureClaims().forEach((claim) => {
    const feature = resolveClaim(record.tile, record.position, claim);
    if (!feature) return;
    const anchor = featureAnchor(record.tile, feature);
    claim.players.forEach((id, index) => {
      const player = gameState.players.find((candidate) => candidate.id === id);
      if (!player) return;
      const px = x + (anchor[0] + 0.5 + index * 0.085) * size;
      const py = y + (anchor[1] + 0.5) * size;
      ctx.fillStyle = player.color;
      ctx.strokeStyle = "#fff6da";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (claim.followerType === "farmer") ctx.rect(px - size * 0.065, py - size * 0.035, size * 0.13, size * 0.07);
      else ctx.arc(px, py, Math.max(3, size * 0.065), 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    });
  });
};

interface BoardCanvasProps {
  board: IBoard;
  currentTile?: ITile;
  onTilePlace?: (position: Position) => void;
  tileSize?: number;
  showGrid?: boolean;
  showValidPlacements?: boolean;
  gameState?: GameState;
  completedCostcos?: CompletedCostco[];
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
const GRID_COLOR = UI_COLORS.muted;
const VALID_PLACEMENT_COLOR = "rgba(0, 255, 0, 0.3)";

export const BoardCanvas: React.FC<BoardCanvasProps> = ({
  board,
  currentTile,
  onTilePlace,
  tileSize = 64,
  showGrid = true,
  showValidPlacements = true,
  gameState,
  completedCostcos = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialCenterRef = useRef(false);
  const canvasStateRef = useRef<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: INITIAL_SCALE,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  });
  const tileCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: INITIAL_SCALE,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  });

  // Keep ref in sync with state
  useEffect(() => {
    canvasStateRef.current = canvasState;
  }, [canvasState]);

  const [validPlacements, setValidPlacements] = useState<Position[]>([]);

  // Clear tile cache when tileSize changes
  useEffect(() => {
    tileCacheRef.current.clear();
  }, [tileSize]);

  // Get or create a cached tile canvas
  const getCachedTile = useCallback(
    (tile: ITile): HTMLCanvasElement => {
      const cacheKey = `${tile.id}_${tile.orientation}_${tileSize}`;
      const cached = tileCacheRef.current.get(cacheKey);
      if (cached) return cached;

      const tileCanvas = document.createElement("canvas");
      tileCanvas.width = tileSize;
      tileCanvas.height = tileSize;
      const tileCtx = tileCanvas.getContext("2d");
      if (tileCtx) {
        renderTileToCanvas(tileCtx, tile, tileSize);
      }
      tileCacheRef.current.set(cacheKey, tileCanvas);
      return tileCanvas;
    },
    [tileSize]
  );

  // Auto-fit: zoom and center to keep all tiles visible with 2-tile padding.
  // Refit once the canvas has its real size, since it can mount at 300x150.
  const tileCount = board.getAllTiles().size;
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (tileCount === 0 || canvasSize.width === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bounds = board.getBounds();
    const paddedWidth = (bounds.maxX - bounds.minX + 1 + 4) * tileSize;
    const paddedHeight = (bounds.maxY - bounds.minY + 1 + 4) * tileSize;

    const fitScale = Math.min(
      canvas.width / paddedWidth,
      canvas.height / paddedHeight
    );
    const newScale = Math.max(MIN_SCALE, Math.min(INITIAL_SCALE, fitScale));

    const scaledTileSize = tileSize * newScale;
    const boardPixelWidth = (bounds.maxX - bounds.minX + 1 + 4) * scaledTileSize;
    const boardPixelHeight = (bounds.maxY - bounds.minY + 1 + 4) * scaledTileSize;

    const offsetX = (canvas.width - boardPixelWidth) / 2 - (bounds.minX - 2) * scaledTileSize;
    const offsetY = (canvas.height - boardPixelHeight) / 2 - (bounds.minY - 2) * scaledTileSize;

    setCanvasState((prev) => ({
      ...prev,
      scale: newScale,
      offsetX,
      offsetY,
    }));
  }, [tileCount, board, tileSize, canvasSize]);

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
    board.getAllTiles().forEach((record) => {
      const { x, y } = boardToScreen(record.position.x, record.position.y);

      // Only render if tile is visible
      if (
        x + scaledTileSize >= 0 &&
        x <= width &&
        y + scaledTileSize >= 0 &&
        y <= height
      ) {
        // Use cached tile canvas
        const tileCanvas = getCachedTile(record.tile);
        ctx.drawImage(tileCanvas, x, y, scaledTileSize, scaledTileSize);

      }
    });

    // A warm tint unites the paved areas of a finished store, while a single
    // check mark identifies the whole connected Costco rather than each tile.
    completedCostcos.forEach(completed => {
      ctx.save();
      ctx.fillStyle = "rgba(245, 187, 57, 0.27)";
      for (const { record, index } of completed.zones) {
        const polygon = zonePolygon(record.tile, index);
        if (polygon.length < 3) continue;
        const { x, y } = boardToScreen(record.position.x, record.position.y);
        ctx.beginPath();
        polygon.forEach(([px, py], i) => {
          const screenX = x + (px + 0.5) * scaledTileSize;
          const screenY = y + (py + 0.5) * scaledTileSize;
          if (i === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        });
        ctx.closePath();
        ctx.fill();
      }
      const { x, y } = boardToScreen(completed.center.x, completed.center.y);
      const cx = x + scaledTileSize / 2;
      const cy = y + scaledTileSize / 2;
      const radius = Math.max(8, scaledTileSize * 0.17);
      ctx.shadowColor = "rgba(67, 44, 15, 0.55)";
      ctx.shadowBlur = radius * 0.6;
      ctx.fillStyle = "#f4bf4f";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#5f421b";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#3b2a12";
      ctx.font = `bold ${Math.round(radius * 1.45)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✓", cx, cy + 1);
      ctx.restore();
    });

    if (gameState) board.getAllTiles().forEach(record => {
      const { x, y } = boardToScreen(record.position.x, record.position.y);
      if (x + scaledTileSize >= 0 && x <= width && y + scaledTileSize >= 0 && y <= height) {
        renderFollowerDots(ctx, record, x, y, scaledTileSize, gameState, board);
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

    // Draw hover indicator with tile preview
    if (canvasState.hoverPosition && currentTile) {
      const { x, y } = boardToScreen(
        canvasState.hoverPosition.x,
        canvasState.hoverPosition.y
      );

      if (board.canPlace(currentTile, canvasState.hoverPosition)) {
        // Render tile preview at reduced opacity
        const previewCanvas = getCachedTile(currentTile);
        ctx.globalAlpha = 0.6;
        ctx.drawImage(previewCanvas, x, y, scaledTileSize, scaledTileSize);
        ctx.globalAlpha = 1.0;

        // Draw blue outline
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
    gameState,
    completedCostcos,
    getCachedTile,
  ]);

  // Handle canvas resize
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    setCanvasSize((prev) =>
      prev.width === rect.width && prev.height === rect.height
        ? prev
        : { width: rect.width, height: rect.height }
    );

    // Center the board on initial render
    if (!initialCenterRef.current) {
      initialCenterRef.current = true;
      const scaledTileSize = tileSize * INITIAL_SCALE;
      setCanvasState((prev) => ({
        ...prev,
        offsetX: rect.width / 2 - scaledTileSize / 2,
        offsetY: rect.height / 2 - scaledTileSize / 2,
      }));
    }

    renderBoard();
  }, [renderBoard, tileSize]);

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

  // Set up native wheel event listener to prevent page scrolling (register once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const state = canvasStateRef.current;
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, state.scale * scaleFactor)
      );

      // Zoom towards mouse position
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleRatio = newScale / state.scale;
      const newOffsetX = mouseX - (mouseX - state.offsetX) * scaleRatio;
      const newOffsetY = mouseY - (mouseY - state.offsetY) * scaleRatio;

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
  }, []);

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
      className="board-canvas-container w-full h-full relative overflow-hidden"
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

      {/* Same pill position and styling as the 3D camera controls */}
      <div className="board-pill" data-testid="board-2d-info">
        <span className="board-pill-status">
          Zoom {Math.round(canvasState.scale * 100)}% · Tiles {board.getAllTiles().size}
          {currentTile && ` · ${validPlacements.length} places to build`}
        </span>
      </div>
    </div>
  );
};

export default BoardCanvas;
