import React, { lazy, Suspense, useCallback, useMemo, useState } from "react";
import type { ClaimableFeature, GameState, Position } from "@/types";
import { GamePhase } from "@/types";
import type { ITile } from "@/interfaces/ITile";
import BoardCanvas from "./BoardCanvas";
import TileRenderer from "./TileRenderer";
import type { RenderMode } from "@/rendering/renderMode";
import { useTranslations } from "@/hooks/useTranslations";
import { completedCostcos } from "@/rendering/completedCostcos";
import { TriangleAlert, X } from "lucide-react";

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
    fallback: React.ReactNode;
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
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface BoardViewProps {
  state: GameState;
  mode: RenderMode;
  onTilePlace: (position: Position) => void;
  onUnavailable: () => void;
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

/** The board itself: the 3D tabletop, or the 2D canvas as its fallback. */
export function BoardView({
  state,
  mode,
  onTilePlace,
  onUnavailable,
  highlightedFeature,
  night = false,
}: BoardViewProps) {
  const { t } = useTranslations();
  const canPlace =
    state.phase === GamePhase.PLACE_TILE &&
    !state.isGameOver &&
    !state.players[state.currentPlayerIndex]?.isAI;
  const finishedCostcos = useCompletedCostcos(state);
  const flat = (
    <BoardCanvas
      board={state.board}
      gameState={state}
      currentTile={canPlace ? state.currentTile : undefined}
      onTilePlace={canPlace ? onTilePlace : undefined}
      showValidPlacements={canPlace}
      completedCostcos={finishedCostcos}
    />
  );
  return (
    <div className="board-viewport">
      {mode === "3d" ? (
        <GraphicsBoundary onUnavailable={onUnavailable} fallback={flat}>
          <Suspense
            fallback={
              <div className="tabletop-loading" role="status">
                {t("board.loading")}
              </div>
            }
          >
            <BoardScene
              state={state}
              onTilePlace={onTilePlace}
              onUnavailable={onUnavailable}
              highlightedFeature={highlightedFeature}
              completedCostcos={finishedCostcos}
              night={night}
            />
          </Suspense>
        </GraphicsBoundary>
      ) : (
        flat
      )}
    </div>
  );
}

export function ViewToggle({
  mode,
  onModeChange,
}: {
  mode: RenderMode;
  onModeChange: (mode: RenderMode) => void;
}) {
  const { t } = useTranslations();
  return (
    <div className="board-view-switch" role="group" aria-label={t("board.view")}>
      {(["3d", "2d"] as const).map((view) => (
        <button
          key={view}
          type="button"
          aria-pressed={mode === view}
          onClick={() => onModeChange(view)}
        >
          {t(`board.${view}`)}
        </button>
      ))}
    </div>
  );
}

/** Draw stage and Costco progress, plus the 3D-unavailable notice. */
export function BoardStatus({
  state,
  unavailable,
  onDismissUnavailable,
  className = "",
}: {
  state: GameState;
  unavailable?: boolean;
  onDismissUnavailable?: () => void;
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
      {unavailable && (
        <div className="board-status-notice" role="status">
          <TriangleAlert size={14} aria-hidden="true" />
          <span>{t("board.unavailable")}</span>
          {onDismissUnavailable && (
            <button type="button" aria-label={t("board.dismiss")} onClick={onDismissUnavailable}>
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SceneryTilePreview({ tile, night }: { tile?: ITile; night?: boolean }) {
  const [unavailable, setUnavailable] = useState(false);
  const onUnavailable = useCallback(() => setUnavailable(true), []);
  const flat = tile ? <TileRenderer tile={tile} size={128} /> : null;
  // A preview failure should never change the healthy board's render mode.
  if (unavailable) return flat;
  return (
    <GraphicsBoundary fallback={flat} onUnavailable={onUnavailable}>
      <Suspense fallback={flat}>
        <TilePreviewScene tile={tile} onUnavailable={onUnavailable} night={night} />
      </Suspense>
    </GraphicsBoundary>
  );
}

export function CurrentTilePreview({
  tile,
  mode,
  night = false,
}: {
  tile?: ITile;
  mode: RenderMode;
  night?: boolean;
}) {
  // Keep the canvas and its library alive during the claim phase. Recreating
  // WebGL contexts every turn can exhaust the device's graphics resources.
  return (
    <div hidden={!tile}>
      {mode === "3d" ? (
        <SceneryTilePreview tile={tile} night={night} />
      ) : tile ? (
        <TileRenderer tile={tile} size={128} />
      ) : null}
    </div>
  );
}
