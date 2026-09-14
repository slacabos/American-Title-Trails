import React, { lazy, Suspense } from "react";
import type { ClaimableFeature, GameState, Position } from "@/types";
import { GamePhase } from "@/types";
import type { ITile } from "@/interfaces/ITile";
import BoardCanvas from "./BoardCanvas";
import TileRenderer from "./TileRenderer";
import type { RenderMode } from "@/rendering/renderMode";
import { useTranslations } from "@/hooks/useTranslations";

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
  const flat = (
    <BoardCanvas
      board={state.board}
      gameState={state}
      currentTile={canPlace ? state.currentTile : undefined}
      onTilePlace={canPlace ? onTilePlace : undefined}
      showValidPlacements={canPlace}
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

export function CurrentTilePreview({
  tile,
  mode,
  onUnavailable,
}: {
  tile: ITile;
  mode: RenderMode;
  onUnavailable: () => void;
}) {
  const flat = <TileRenderer tile={tile} size={128} />;
  return mode === "3d" ? (
    <GraphicsBoundary fallback={flat} onUnavailable={onUnavailable}>
      <Suspense fallback={flat}>
        <TilePreviewScene tile={tile} onUnavailable={onUnavailable} />
      </Suspense>
    </GraphicsBoundary>
  ) : (
    flat
  );
}
