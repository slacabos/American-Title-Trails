import React, { useRef, useEffect, useState, useCallback } from "react";
import type { ITile, IBoard } from "../interfaces";
import { Position } from "../types";
import { UI_COLORS } from "../constants/colors";
import { renderTileToCanvas } from "../utils/tileRendering";

// Helper function to render follower dots on claimed features
const renderFollowerDots = (
  ctx: CanvasRenderingContext2D,
  record: any,
  x: number,
  y: number,
  scaledTileSize: number,
  gameState: any,
  board: IBoard
) => {
  const featureClaims = board.getFeatureClaims();
  const positionKey = `${record.position.x},${record.position.y}`;

  // Find claims for this tile
  const tileClaims = featureClaims.filter((claim) =>
    claim.edge.startsWith(positionKey)
  );

  tileClaims.forEach((claim) => {
    // Get player info for the claiming player
    const player = gameState.players.find((p: any) =>
      claim.players.includes(p.id)
    );
    if (!player) return;

    // Determine dot position based on feature type and identifier
    const dotPosition = getFollowerDotPosition(claim, scaledTileSize, record);

    // Draw the follower
    ctx.fillStyle = player.color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    const dotX = x + dotPosition.x;
    const dotY = y + dotPosition.y;

    // Farmers (field claims) are rendered as rectangles (lying down)
    // Standard followers are rendered as circles
    if (claim.followerType === "farmer") {
      const rectWidth = Math.max(8, scaledTileSize * 0.12);
      const rectHeight = Math.max(4, scaledTileSize * 0.06);

      ctx.beginPath();
      ctx.rect(dotX - rectWidth / 2, dotY - rectHeight / 2, rectWidth, rectHeight);
      ctx.fill();
      ctx.stroke();
    } else {
      const dotRadius = Math.max(3, scaledTileSize * 0.08);

      ctx.beginPath();
      ctx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  });
};

// Helper function to determine follower dot position based on feature type
const getFollowerDotPosition = (
  claim: any,
  tileSize: number,
  record: any
): { x: number; y: number } => {
  // Define segment positions on the tile (5 segments: N, E, S, W, Center)
  const segmentPositions: { [key: string]: { x: number; y: number } } = {
    north: { x: tileSize / 2, y: tileSize * 0.15 }, // Top edge
    east: { x: tileSize * 0.85, y: tileSize / 2 }, // Right edge
    south: { x: tileSize / 2, y: tileSize * 0.85 }, // Bottom edge
    west: { x: tileSize * 0.15, y: tileSize / 2 }, // Left edge
    center: { x: tileSize / 2, y: tileSize / 2 }, // Center
  };

  // Define corner positions for field segments
  const cornerPositions: { [key: string]: { x: number; y: number } } = {
    nw: { x: tileSize * 0.15, y: tileSize * 0.15 }, // Top-left corner
    ne: { x: tileSize * 0.85, y: tileSize * 0.15 }, // Top-right corner
    sw: { x: tileSize * 0.15, y: tileSize * 0.85 }, // Bottom-left corner
    se: { x: tileSize * 0.85, y: tileSize * 0.85 }, // Bottom-right corner
  };

  // Extract identifier from edge (format: "x,y:identifier" or just "x,y")
  const parts = claim.edge.split(":");
  const identifier = parts.length > 1 ? parts[1] : "";
  const tile = record.tile;

  if (claim.type === "road") {
    const roadIndex = parseInt(identifier.replace("road_", "")) || 0;

    if (tile.roadConnections && tile.roadConnections[roadIndex]) {
      const roadConnection = tile.roadConnections[roadIndex];

      // Calculate average position of all segments in this road connection
      let totalX = 0;
      let totalY = 0;
      let validSegments = 0;

      roadConnection.forEach((segment: string) => {
        if (segmentPositions[segment]) {
          totalX += segmentPositions[segment].x;
          totalY += segmentPositions[segment].y;
          validSegments++;
        }
      });

      if (validSegments > 0) {
        return {
          x: totalX / validSegments,
          y: totalY / validSegments,
        };
      }
    }

    // Fallback: use first available road segment position
    return segmentPositions["center"];
  } else if (claim.type === "costco") {
    const costcoIndex = parseInt(identifier.replace("costco_", "")) || 0;

    if (tile.costcoZones && tile.costcoZones[costcoIndex]) {
      const zone = tile.costcoZones[costcoIndex];

      // Calculate average position of all segments in this Costco zone
      let totalX = 0;
      let totalY = 0;
      let validSegments = 0;

      zone.segments.forEach((segment: string) => {
        if (segmentPositions[segment]) {
          totalX += segmentPositions[segment].x;
          totalY += segmentPositions[segment].y;
          validSegments++;
        }
      });

      if (validSegments > 0) {
        return {
          x: totalX / validSegments,
          y: totalY / validSegments,
        };
      }
    }

    // Fallback: use center position
    return segmentPositions["center"];
  } else if (claim.type === "field") {
    // For fields, the identifier is a corner (nw, ne, sw, se)
    // Find the field segment that contains this corner
    if (tile.fieldSegments) {
      const fieldSegment = tile.fieldSegments.find((fs: any) =>
        fs.corners.includes(identifier)
      );

      if (fieldSegment) {
        // Calculate centroid of all corners in this field segment
        let totalX = 0;
        let totalY = 0;
        let validCorners = 0;

        fieldSegment.corners.forEach((corner: string) => {
          if (cornerPositions[corner]) {
            totalX += cornerPositions[corner].x;
            totalY += cornerPositions[corner].y;
            validCorners++;
          }
        });

        if (validCorners > 0) {
          return {
            x: totalX / validCorners,
            y: totalY / validCorners,
          };
        }
      }
    }

    // Fallback: use the corner position directly
    if (cornerPositions[identifier]) {
      return cornerPositions[identifier];
    }

    return segmentPositions["center"];
  } else if (claim.type === "mcdonalds") {
    // McDonald's is always at center
    return segmentPositions["center"];
  }

  // Default position
  return segmentPositions["center"];
};

interface BoardCanvasProps {
  board: IBoard;
  currentTile?: ITile;
  onTilePlace?: (position: Position) => void;
  tileSize?: number;
  showGrid?: boolean;
  showValidPlacements?: boolean;
  gameState?: any; // Game state for accessing feature claims and player info
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
const HOVER_COLOR = "rgba(0, 0, 255, 0.2)";

export const BoardCanvas: React.FC<BoardCanvasProps> = ({
  board,
  currentTile,
  onTilePlace,
  tileSize = 64,
  showGrid = true,
  showValidPlacements = true,
  gameState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialCenterRef = useRef(false);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: INITIAL_SCALE,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  });

  const [validPlacements, setValidPlacements] = useState<Position[]>([]);

  // Auto-fit: zoom and center to keep all tiles visible with 2-tile padding
  const tileCount = board.getAllTiles().size;
  useEffect(() => {
    if (tileCount === 0) return;
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
  }, [tileCount, board, tileSize]);

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
        // Create a temporary canvas for the tile
        const tileCanvas = document.createElement("canvas");
        tileCanvas.width = tileSize;
        tileCanvas.height = tileSize;
        const tileCtx = tileCanvas.getContext("2d");

        if (tileCtx) {
          // Render the actual tile with its features using curved roads
          renderTileToCanvas(tileCtx, record.tile, tileSize);

          // Draw the tile to main canvas
          ctx.drawImage(tileCanvas, x, y, scaledTileSize, scaledTileSize);

          // Draw follower dots for claimed features
          if (gameState) {
            renderFollowerDots(
              ctx,
              record,
              x,
              y,
              scaledTileSize,
              gameState,
              board
            );
          }
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
    gameState,
  ]);

  // Handle canvas resize
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

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
        <div>Tiles: {board.getAllTiles().size}</div>
        {currentTile && <div>Valid placements: {validPlacements.length}</div>}
      </div>
    </div>
  );
};

export default BoardCanvas;
