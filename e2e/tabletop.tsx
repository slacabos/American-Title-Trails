import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { _roots } from "@react-three/fiber";
import { Vector3 } from "three";
import { Game } from "../src/game";
import { GamePhase, Position } from "../src/types";
import { BoardView, CurrentTilePreview } from "../src/components/BoardView";
import { boardSnapshot } from "../src/rendering/tileLayout";
import {
  readRenderMode,
  RenderMode,
  saveRenderMode,
} from "../src/rendering/renderMode";
import "../src/index.css";

const params = new URLSearchParams(location.search);
const game = new Game(
  [
    { id: "p1", name: "One", color: "#437eaf", isAI: params.has("full") },
    { id: "p2", name: "Two", color: "#d76543", isAI: params.has("full") },
  ],
  { seed: Number(params.get("seed") ?? 17) },
);
if (params.has("full")) {
  for (let step = 0; step < 500 && !game.getState().isGameOver; step++)
    game.processAITurn();
}
function Harness() {
  const [state, setState] = useState(game.getState());
  const [mode, setMode] = useState<RenderMode>(readRenderMode);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    game.setStateChangeListener(setState);
  }, []);
  const fallback = useCallback(() => {
    setMode("2d");
    setUnavailable(true);
  }, []);
  return (
    <div className="game-layout">
      <div className="game-board-panel">
        <BoardView
          state={state}
          mode={mode}
          onModeChange={(value) => {
            setMode(value);
            saveRenderMode(value);
          }}
          onUnavailable={fallback}
          unavailable={unavailable}
          onTilePlace={(position) => game.placeTile(position)}
        />
      </div>
      <aside>
        <CurrentTilePreview tile={state.currentTile} mode={mode} />
        <button onClick={() => game.rotateTileClockwise()}>Rotate tile</button>
        {state.phase === GamePhase.CLAIM_FEATURE && (
          <>
            {game.getClaimableFeaturesForCurrentTurn().map((feature) => (
              <button
                key={`${feature.type}-${feature.identifier}`}
                onClick={() =>
                  game.claimFeature(feature.type, feature.identifier)
                }
              >
                Claim {feature.type} {feature.identifier}
              </button>
            ))}
            <button onClick={() => game.skipClaim()}>Skip claim</button>
          </>
        )}
        <div data-testid="tile-count">{state.board.getAllTiles().size}</div>
        <div data-testid="phase">{state.phase}</div>
      </aside>
    </div>
  );
}

// Test-only driver. This entrypoint is excluded from the production build.
Object.assign(window, {
  tabletopTest: {
    state: () => {
      const state = game.getState();
      return {
        count: state.board.getAllTiles().size,
        phase: state.phase,
        orientation: state.currentTile?.orientation,
        legal: boardSnapshot(state).legal,
        scores: state.players.map((p) => p.score),
        claims: state.board.getFeatureClaims(),
        over: state.isGameOver,
      };
    },
    point: (position: Position) => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        '[data-testid="board-3d"] canvas',
      )!;
      const state = _roots.get(canvas)!.store.getState();
      const point = new Vector3(position.x, 0, position.y).project(
        state.camera,
      );
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + ((point.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - point.y) / 2) * rect.height,
      };
    },
    stats: () => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        '[data-testid="board-3d"] canvas',
      )!;
      const state = _roots.get(canvas)!.store.getState();
      return {
        calls: state.gl.info.render.calls,
        triangles: state.gl.info.render.triangles,
        frame: state.gl.info.render.frame,
        geometries: state.gl.info.memory.geometries,
        textures: state.gl.info.memory.textures,
        zoom: state.camera.zoom,
        camera: state.camera.position.toArray(),
      };
    },
    previewFrame: () => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        '.tabletop-tile-preview canvas',
      )!;
      return _roots.get(canvas)!.store.getState().gl.info.render.frame;
    },
    losePreviewContext: () => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        '.tabletop-tile-preview canvas',
      )!;
      _roots.get(canvas)!.store.getState().gl.getContext()
        .getExtension("WEBGL_lose_context")!.loseContext();
    },
    loseContext: () => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        '[data-testid="board-3d"] canvas',
      )!;
      _roots
        .get(canvas)!
        .store.getState()
        .gl.getContext()
        .getExtension("WEBGL_lose_context")!
        .loseContext();
    },
  },
});
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Harness />
  </React.StrictMode>,
);
