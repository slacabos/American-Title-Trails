import useTranslations from "@/hooks/useTranslations";
import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import {
  PlayerDefinition,
  Position,
  TerrainType,
  GameState,
  ClaimableFeature,
  CompletedFeature,
} from "../types";
import { Game, GamePhase } from "../game";
import { BoardView, BoardStatus, ViewToggle } from "./BoardView";
import { readCameraView, saveCameraView, type CameraView } from "@/rendering/cameraView";
import {
  activatesOnEnter,
  arrowDirection,
  directionKey,
  isTypingTarget,
  nearestLegal,
  nextLegal,
} from "@/rendering/keyboard";
import { boardSnapshot, samePosition } from "@/rendering/tileLayout";
import HelpModal from "./HelpModal";
import GameOverPanel from "./GameOverPanel";
import iconUrl from "@/assets/icon.png";
import { GAME_RULES } from "../constants/gameRules";
import Scoreboard from "./hud/Scoreboard";
import TileDock from "./hud/TileDock";
import ActivityLog, { type LogEntry } from "./hud/ActivityLog";
import TimeToggle from "./hud/TimeToggle";
import useTimeOfDay from "@/hooks/useTimeOfDay";
import { CircleQuestionMark, Keyboard, Menu, RotateCcw } from "lucide-react";
import { clearSavedGame, restoreGame, saveGame, type SavedGame } from "@/persistence/savedGame";

const sameFeature = (a: ClaimableFeature, b?: ClaimableFeature) =>
  !!b && a.type === b.type && a.identifier === b.identifier;

const logTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

interface GameBoardProps {
  players: PlayerDefinition[];
  /** A saved game to continue instead of starting a new one. */
  resume?: SavedGame;
  onReset: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ players, resume, onReset }) => {
  const { t } = useTranslations();
  // Every game has a seed, so its moves can be saved and replayed.
  const [seed] = useState(() => resume?.seed ?? newSeed());
  // One game per mount: App remounts this component for every new game. A
  // constructor or replay error reaches the surrounding ErrorBoundary.
  const [game, setGame] = useState(() => {
    if (!resume) return new Game(players, { seed });
    const restored = restoreGame(resume);
    if (!restored) throw new Error("The saved game could not be restored");
    return restored;
  });
  const [gameState, setGameState] = useState<GameState>(() => game.getState());
  // A resumed log continues after the saved entries' ids.
  const firstLogId = resume ? Math.max(0, ...resume.log.map((entry) => entry.id)) + 1 : 0;
  const logIdRef = useRef(firstLogId + 1);
  const [logs, setLogs] = useState<LogEntry[]>(() => [
    { id: firstLogId, time: logTime(), message: t(resume ? "messages.gameResumed" : "messages.gameStarted") },
    ...(resume?.log.slice(0, 19) ?? []),
  ]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { night, toggle: toggleNight } = useTimeOfDay();
  const stageRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [view, setView] = useState<CameraView>(readCameraView);
  const [graphicsUnavailable, setGraphicsUnavailable] = useState(false);
  const [highlightedFeature, setHighlightedFeature] = useState<ClaimableFeature>();
  const handleGraphicsUnavailable = useCallback(() => setGraphicsUnavailable(true), []);
  const handleViewChange = (next: CameraView) => {
    setView(next);
    saveCameraView(next);
  };
  const [isGameOverCollapsed, setIsGameOverCollapsed] = useState(false);

  useEffect(() => {
    game.setStateChangeListener((state) => {
      // Claiming/skipping unmounts the hovered or focused button without
      // necessarily firing mouseleave/blur. Never carry its selection forward.
      setHighlightedFeature(undefined);
      setGameState(state);
    });
  }, [game]);

  // Save after every move; a finished game has nothing left to resume.
  useEffect(() => {
    if (gameState.isGameOver) {
      clearSavedGame();
      return;
    }
    const actions = game.getActions();
    if (actions.length === 0) return;
    saveGame({
      seed,
      players: resume?.players ?? players,
      actions: [...actions],
      log: logs,
      turnNumber: gameState.turnNumber,
    });
  }, [game, gameState, logs, seed, players, resume]);

  // Each state change is a fresh snapshot, so this recomputes once per change.
  const claimableFeatures = useMemo(
    () => gameState.phase === GamePhase.CLAIM_FEATURE ? game.getClaimableFeaturesForCurrentTurn() : [],
    [game, gameState],
  );

  // Handle AI turns - trigger on relevant state changes only
  const currentPlayerIndex = gameState.currentPlayerIndex;
  const phase = gameState.phase;
  const isGameOver = gameState.isGameOver;
  const currentPlayerIsAI = gameState.players[currentPlayerIndex]?.isAI;

  const addLog = useCallback((message: string) => {
    const id = logIdRef.current++;
    setLogs((prev) => [
      { id, time: logTime(), message },
      ...prev.slice(0, 19),
    ]);
  }, []);

  const logCompletions = useCallback((features: CompletedFeature[]) => {
    features.filter(feature => feature.type === "costco").forEach(feature =>
      addLog(t("messages.costcoCompleted", { points: feature.points }))
    );
    const others = features.filter(feature => feature.type !== "costco").length;
    if (others) addLog(t("messages.featuresCompleted", { count: others }));
  }, [addLog, t]);

  useEffect(() => {
    if (!currentPlayerIsAI || isGameOver) return;
    const timer = setTimeout(() => {
      const playerName = game.getCurrentPlayer().name;
      const action = game.processAITurn();
      if (action?.type === "placed" && action.result.success) {
        logCompletions(action.result.completedFeatures);
      } else if (action?.type === "claimed") {
        addLog(t("messages.claimedFeature", {
          playerName,
          type: action.feature.type,
          identifier: action.feature.displayName ? ` (${action.feature.displayName})` : "",
        }));
      }
    }, GAME_RULES.AI_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [game, currentPlayerIsAI, currentPlayerIndex, phase, isGameOver, addLog, logCompletions, t]);

  const handleTilePlace = (position: Position) => {
    if (gameState.phase !== GamePhase.PLACE_TILE || gameState.isGameOver || gameState.players[gameState.currentPlayerIndex]?.isAI) return;

    const result = game.placeTile(position);
    if (result.success) {
      addLog(t("messages.placedTile", {
        playerName: gameState.players[gameState.currentPlayerIndex].name,
        x: position.x,
        y: position.y,
      }));
      logCompletions(result.completedFeatures);
    } else {
      addLog(t("messages.failedToPlace", {
        message: result.message?.startsWith("river") ? t(`messages.${result.message}`) : result.message,
      }));
    }
  };

  const handleRotateClockwise = () => {
    if (game.canRotateTile()) {
      game.rotateTileClockwise();
    }
  };

  const handleRotateCounterClockwise = () => {
    if (game.canRotateTile()) {
      game.rotateTileCounterClockwise();
    }
  };

  const handleClaimFeature = (type: TerrainType, identifier?: string) => {
    const displayName = claimableFeatures.find(feature => feature.type === type && feature.identifier === identifier)?.displayName;
    const success = game.claimFeature(type, identifier);
    if (success) {
      addLog(t("messages.claimedFeature", {
        playerName: gameState.players[gameState.currentPlayerIndex].name,
        type,
        identifier: displayName ? ` (${displayName})` : "",
      }));
    } else {
      addLog(t("messages.failedToClaim"));
    }
  };

  // A human may lift their tile back into hand until they claim or skip.
  const actions = game.getActions();
  const lastAction = actions[actions.length - 1];
  const canTakeBack =
    phase === GamePhase.CLAIM_FEATURE && !currentPlayerIsAI && !isGameOver && lastAction?.type === "place";

  const handleTakeBack = () => {
    if (!canTakeBack || lastAction?.type !== "place") return;
    const previous = Game.replay(resume?.players ?? players, seed, actions.slice(0, -1));
    if (!previous) return;
    // Hand the tile back turned the way it was placed.
    previous.rotateTile(lastAction.orientation);
    setHighlightedFeature(undefined);
    setGame(previous);
    setGameState(previous.getState());
    addLog(t("messages.tookBackTile", {
      playerName: gameState.players[gameState.currentPlayerIndex].name,
    }));
  };

  const handleSkipClaim = () => {
    game.skipClaim();
    addLog(t("messages.skippedClaiming", {
      playerName: gameState.players[gameState.currentPlayerIndex].name,
    }));
  };

  // Keyboard placement cursor. Like the board's hover, it belongs to one turn.
  // When a rotation makes its spot illegal it snaps to the nearest legal one.
  const turnKey = `${gameState.turnNumber}:${phase}:${currentPlayerIndex}`;
  const legal = useMemo(() => boardSnapshot(gameState).legal, [gameState]);
  const [cursorAt, setCursorAt] = useState<{ turn: string; position: Position }>();
  const cursor = cursorAt?.turn !== turnKey
    ? undefined
    : legal.some((spot) => samePosition(spot, cursorAt.position))
      ? cursorAt.position
      : nearestLegal(legal, cursorAt.position);

  // Keyboard shortcuts. The listener is attached once and always runs the
  // latest handler, which closes over this render's state.
  const onKeyDown = useRef<(event: KeyboardEvent) => void>(() => {});
  useLayoutEffect(() => {
    onKeyDown.current = (e: KeyboardEvent) => {
      const typing = isTypingTarget(e);
      if (e.key === "?") {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement))
          setShowHelp((prev) => !prev);
        return;
      }
      if (typing) return;
      const human = !currentPlayerIsAI && !isGameOver;
      const placing = human && phase === GamePhase.PLACE_TILE;
      const claiming = human && phase === GamePhase.CLAIM_FEATURE;
      const modified = e.ctrlKey || e.metaKey || e.altKey;

      // Arrows and WASD move the cursor or the claim choice. With Shift they
      // pan the camera, which the board scene handles.
      const direction = directionKey(e.key);
      if (direction) {
        if (modified || e.shiftKey) return;
        if (placing && legal.length) {
          e.preventDefault();
          const position = cursor
            ? nextLegal(cursor, legal, arrowDirection(direction, view))
            : nearestLegal(legal, gameState.lastPlacedPosition)!;
          setCursorAt({ turn: turnKey, position });
        } else if (claiming && claimableFeatures.length && (direction === "ArrowUp" || direction === "ArrowDown")) {
          e.preventDefault();
          const count = claimableFeatures.length;
          const index = claimableFeatures.findIndex((feature) => sameFeature(feature, highlightedFeature));
          const step = direction === "ArrowDown" ? 1 : -1;
          const next = index < 0 ? (step > 0 ? 0 : count - 1) : (index + step + count) % count;
          setHighlightedFeature(claimableFeatures[next]);
        }
        return;
      }

      if ((e.key === "Enter" || e.key === " ") && !modified) {
        // A focused button keeps its own Enter/Space.
        if (activatesOnEnter(e)) return;
        if (placing && cursor) {
          e.preventDefault();
          handleTilePlace(cursor);
        } else if (claiming && highlightedFeature) {
          e.preventDefault();
          handleClaimFeature(highlightedFeature.type, highlightedFeature.identifier);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "z") {
        if (canTakeBack) {
          e.preventDefault();
          handleTakeBack();
        }
        return;
      }

      if (modified) return;
      if (/^[1-9]$/.test(e.key)) {
        const feature = claiming ? claimableFeatures[Number(e.key) - 1] : undefined;
        if (feature) handleClaimFeature(feature.type, feature.identifier);
        return;
      }

      switch (e.key.toLowerCase()) {
        case "e":
          handleRotateClockwise();
          break;
        case "q":
          handleRotateCounterClockwise();
          break;
        case "x":
          if (claiming) handleSkipClaim();
          break;
        case "u":
          if (canTakeBack) handleTakeBack();
          break;
        case "n":
          toggleNight();
          break;
        case "v":
          handleViewChange(view === "drone" ? "tabletop" : "drone");
          break;
        case "escape":
          setMenuOpen(false);
          setCursorAt(undefined);
          break;
      }
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // On phones the dock is a bottom sheet; the board shrinks to sit above it.
  useEffect(() => {
    const stage = stageRef.current;
    const dock = dockRef.current;
    if (!stage || !dock) return;
    const observer = new ResizeObserver(() => {
      stage.style.setProperty("--dock-height", `${dock.offsetHeight}px`);
    });
    observer.observe(dock);
    return () => observer.disconnect();
  }, []);

  // Close the menu on any click outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      if (!(event.target as Element).closest?.(".hud-menu")) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  const tileStats = game.getTileStats();

  return (
    <div className="game-stage" ref={stageRef}>
      <BoardView
        state={gameState}
        view={view}
        onTilePlace={handleTilePlace}
        onUnavailable={handleGraphicsUnavailable}
        unavailable={graphicsUnavailable}
        onRetry={() => setGraphicsUnavailable(false)}
        highlightedFeature={highlightedFeature}
        cursor={cursor}
        night={night}
      />

      <div className="hud">
        <div className="hud-top">
          <div className="hud-top-left">
            <div className="hud-panel brand-chip">
              <img src={iconUrl} alt={t("app.gameIcon")} />
              <span className="brand-wordmark">{t("app.title")}</span>
            </div>
            <BoardStatus
              className="hud-panel"
              state={gameState}
            />
          </div>
          <div className="hud-top-right">
            <ViewToggle view={view} onViewChange={handleViewChange} />
            <TimeToggle night={night} onToggle={toggleNight} />
            <button
              type="button"
              className="hud-icon-button"
              aria-label={t("hud.help")}
              title={t("hud.help")}
              onClick={() => setShowHelp(true)}
            >
              <CircleQuestionMark size={18} aria-hidden="true" />
            </button>
            <div className="hud-menu">
              <button
                type="button"
                className="hud-icon-button"
                aria-label={t("hud.menu")}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <Menu size={18} aria-hidden="true" />
              </button>
              {menuOpen && (
                <div className="hud-panel hud-menu-list" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onReset();
                    }}
                  >
                    <RotateCcw size={15} aria-hidden="true" />
                    {t("hud.newGame")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowHelp(true);
                    }}
                  >
                    <CircleQuestionMark size={15} aria-hidden="true" />
                    {t("hud.help")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowHelp(true);
                    }}
                  >
                    <Keyboard size={15} aria-hidden="true" />
                    {t("hud.shortcuts")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Scoreboard
          className="hud-score"
          players={gameState.players}
          currentPlayerIndex={gameState.currentPlayerIndex}
          board={gameState.board}
          turnNumber={gameState.turnNumber}
          tileStats={tileStats}
          isGameOver={gameState.isGameOver}
        />

        <ActivityLog className="hud-log" entries={logs} />

        <div className="hud-dock">
          <TileDock
            ref={dockRef}
            state={gameState}
            claimableFeatures={claimableFeatures}
            onRotateClockwise={handleRotateClockwise}
            onRotateCounterClockwise={handleRotateCounterClockwise}
            onClaim={handleClaimFeature}
            onSkip={handleSkipClaim}
            onTakeBack={canTakeBack ? handleTakeBack : undefined}
            onHighlight={setHighlightedFeature}
            highlighted={highlightedFeature}
            night={night}
          />
        </div>
      </div>

      {gameState.isGameOver && (
        <div className="hud-gameover" data-collapsed={isGameOverCollapsed}>
          <GameOverPanel
            players={gameState.players}
            winner={gameState.winner}
            scoreBreakdown={gameState.scoreBreakdown}
            onReset={onReset}
            collapsed={isGameOverCollapsed}
            onToggle={() => setIsGameOverCollapsed((prev) => !prev)}
          />
        </div>
      )}

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

export default GameBoard;
