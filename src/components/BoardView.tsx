import React, { lazy, Suspense, useCallback, useMemo, useState } from "react";
import type { ClaimableFeature, GameState, Position } from "@/types";
import { GamePhase } from "@/types";
import type { ITile } from "@/interfaces/ITile";
import BoardCanvas from "./BoardCanvas";
import TileRenderer from "./TileRenderer";
import type { RenderMode } from "@/rendering/renderMode";
import { useTranslations } from "@/hooks/useTranslations";
import { completedCostcos } from "@/rendering/completedCostcos";

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
  onModeChange: (mode: RenderMode) => void;
  onTilePlace: (position: Position) => void;
  onUnavailable: () => void;
  unavailable: boolean;
  highlightedFeature?: ClaimableFeature;
}

export function BoardView({
  state,
  mode,
  onModeChange,
  onTilePlace,
  onUnavailable,
  unavailable,
  highlightedFeature,
}: BoardViewProps) {
  const { t } = useTranslations();
  const canPlace =
    state.phase === GamePhase.PLACE_TILE &&
    !state.isGameOver &&
    !state.players[state.currentPlayerIndex]?.isAI;
  const tileCount = state.board.getAllTiles().size;
  const finishedCostcos = useMemo(
    () => tileCount ? completedCostcos(state.board) : [],
    [state.board, tileCount],
  );
  const justCompletedCostcos = state.lastCompletedFeatures?.filter(feature => feature.type === "costco") ?? [];
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
    <>
      <div className="board-view-header">
        <div>
          <span className="board-view-eyebrow">{t("board.eyebrow")}</span>
          <h2>{t("board.title")}</h2>
        </div>
        <div
          className="board-view-switch"
          role="group"
          aria-label={t("board.view")}
        >
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
      </div>
      <p className="board-controls-hint" data-testid="draw-stage" aria-live="polite">
        {state.drawStage === "river" ? t("board.riverOpening", {
          remaining: state.tileDeck.filter(tile => tile.river).length + (state.currentTile?.river ? 1 : 0),
        }) : t("board.landStage")}
      </p>
      {state.drawStage === "river" && <p className="board-controls-hint">{t("board.riverHint")}</p>}
      <p className="board-controls-hint" aria-live="polite">
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
      </p>
      {unavailable && (
        <p className="board-graphics-notice" role="status">
          {t("board.unavailable")}
        </p>
      )}
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
              />
            </Suspense>
          </GraphicsBoundary>
        ) : (
          flat
        )}
      </div>
      <p className="board-controls-hint">
        {t(mode === "3d" ? "board.hint3d" : "board.hint2d")}
      </p>
    </>
  );
}

function SceneryTilePreview({ tile }: { tile?: ITile }) {
  const [unavailable, setUnavailable] = useState(false);
  const onUnavailable = useCallback(() => setUnavailable(true), []);
  const flat = tile ? <TileRenderer tile={tile} size={128} /> : null;
  // A preview failure should never change the healthy board's render mode.
  if (unavailable) return flat;
  return (
    <GraphicsBoundary fallback={flat} onUnavailable={onUnavailable}>
      <Suspense fallback={flat}>
        <TilePreviewScene tile={tile} onUnavailable={onUnavailable} />
      </Suspense>
    </GraphicsBoundary>
  );
}

export function CurrentTilePreview({
  tile,
  mode,
}: {
  tile?: ITile;
  mode: RenderMode;
}) {
  // Keep the canvas and its library alive during the claim phase. Recreating
  // WebGL contexts every turn can exhaust the device's graphics resources.
  return (
    <div hidden={!tile}>
      {mode === "3d" ? (
        <SceneryTilePreview tile={tile} />
      ) : tile ? (
        <TileRenderer tile={tile} size={128} />
      ) : null}
    </div>
  );
}
