import React, { lazy, Suspense, useCallback, useMemo, useState } from "react";
import type { ClaimableFeature, GameState, Position } from "@/types";
import type { ITile } from "@/interfaces/ITile";
import { CAMERA_VIEWS, type CameraView } from "@/rendering/cameraView";
import { useTranslations } from "@/hooks/useTranslations";
import { completedCostcos } from "@/rendering/completedCostcos";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const BoardScene = lazy(() =>
  import("./three/BoardScene").then((module) => ({
    default: module.BoardScene,
  })),
);
const TilePreviewScene = lazy(() =>
  import("./three/BoardScene").then((module) => ({
    default: module.TilePreviewScene,
  })),
);
/** Renderer failures must not propagate to the game-reset boundary. */
export class GraphicsBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onUnavailable: () => void;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error("3D renderer unavailable:", error);
    this.props.onUnavailable();
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}

interface BoardViewProps {
  state: GameState;
  view: CameraView;
  onTilePlace: (position: Position) => void;
  /** Called when the 3D renderer fails or loses its context. */
  onUnavailable: () => void;
  unavailable: boolean;
  /** Called before the canvas is remounted after a failure. */
  onRetry: () => void;
  highlightedFeature?: ClaimableFeature;
  night?: boolean;
}

function useCompletedCostcos(state: GameState) {
  const tileCount = state.board.getAllTiles().size;
  return useMemo(
    () => tileCount ? completedCostcos(state.board) : [],
    [state.board, tileCount],
  );
}

/** Shown in place of the board when 3D graphics cannot run. */
function GraphicsUnavailable({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslations();
  return (
    <div className="board-unavailable" role="status">
      <TriangleAlert size={28} aria-hidden="true" />
      <h2>{t("board.unavailableTitle")}</h2>
      <p>{t("board.unavailable")}</p>
      <Button onClick={onRetry}>{t("board.retry")}</Button>
    </div>
  );
}

/** The 3D board, or a retry panel when graphics are unavailable. */
export function BoardView({
  state,
  view,
  onTilePlace,
  onUnavailable,
  unavailable,
  onRetry,
  highlightedFeature,
  night = false,
}: BoardViewProps) {
  const { t } = useTranslations();
  const finishedCostcos = useCompletedCostcos(state);
  // A new key remounts the boundary and canvas, which asks for a fresh context.
  const [attempt, setAttempt] = useState(0);
  const retry = () => {
    setAttempt((count) => count + 1);
    onRetry();
  };
  return (
    <div className="board-viewport">
      {unavailable ? (
        <GraphicsUnavailable onRetry={retry} />
      ) : (
        <GraphicsBoundary key={attempt} onUnavailable={onUnavailable}>
          <Suspense
            fallback={
              <div className="tabletop-loading" role="status">
                {t("board.loading")}
              </div>
            }
          >
            <BoardScene
              state={state}
              view={view}
              onTilePlace={onTilePlace}
              onUnavailable={onUnavailable}
              highlightedFeature={highlightedFeature}
              completedCostcos={finishedCostcos}
              night={night}
            />
          </Suspense>
        </GraphicsBoundary>
      )}
    </div>
  );
}

export function ViewToggle({
  view,
  onViewChange,
}: {
  view: CameraView;
  onViewChange: (view: CameraView) => void;
}) {
  const { t } = useTranslations();
  return (
    <div className="board-view-switch" role="group" aria-label={t("board.view")}>
      {CAMERA_VIEWS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={view === option}
          onClick={() => onViewChange(option)}
        >
          {t(option === "drone" ? "board.droneView" : "board.tabletopView")}
        </button>
      ))}
    </div>
  );
}

/** Draw stage and Costco progress. */
export function BoardStatus({
  state,
  className = "",
}: {
  state: GameState;
  className?: string;
}) {
  const { t } = useTranslations();
  const [rulesOpen, setRulesOpen] = useState(false);
  const finishedCostcos = useCompletedCostcos(state);
  const justCompletedCostcos = state.lastCompletedFeatures?.filter(feature => feature.type === "costco") ?? [];
  const river = state.drawStage === "river";
  return (
    <div className={`board-status ${className}`}>
      <div data-testid="draw-stage" aria-live="polite">
        {river ? t("board.riverOpening", {
          remaining: state.tileDeck.filter(tile => tile.river).length + (state.currentTile?.river ? 1 : 0),
        }) : t("board.landStage")}
        {river && (
          <button
            type="button"
            className="board-status-toggle"
            aria-expanded={rulesOpen}
            onClick={() => setRulesOpen(open => !open)}
          >
            {t(rulesOpen ? "board.hideRules" : "board.showRules")}
          </button>
        )}
      </div>
      {river && (
        <div className="board-status-sub" data-collapsible="true" data-open={rulesOpen}>
          {t("board.riverHint")}
        </div>
      )}
      <div className="board-status-sub" aria-live="polite">
        {justCompletedCostcos.length > 0
          ? t(
            justCompletedCostcos.length === 1
              ? "board.costcoJustCompletedOne"
              : "board.costcoJustCompletedMany",
            { count: justCompletedCostcos.length },
          )
          : t(
            finishedCostcos.length ? "board.costcoCompleteCount" : "board.costcoNone",
            { count: finishedCostcos.length },
          )}
      </div>
    </div>
  );
}

function SceneryTilePreview({ tile, night }: { tile?: ITile; night?: boolean }) {
  const [unavailable, setUnavailable] = useState(false);
  const onUnavailable = useCallback(() => setUnavailable(true), []);
  // A preview failure hides only the preview; the board and the tile name stay.
  if (unavailable) return null;
  return (
    <GraphicsBoundary onUnavailable={onUnavailable}>
      <Suspense fallback={null}>
        <TilePreviewScene tile={tile} onUnavailable={onUnavailable} night={night} />
      </Suspense>
    </GraphicsBoundary>
  );
}

export function CurrentTilePreview({
  tile,
  night = false,
}: {
  tile?: ITile;
  night?: boolean;
}) {
  // Keep the canvas and its library alive during the claim phase. Recreating
  // WebGL contexts every turn can exhaust the device's graphics resources.
  return (
    <div hidden={!tile}>
      <SceneryTilePreview tile={tile} night={night} />
    </div>
  );
}
