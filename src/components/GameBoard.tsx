import useTranslations from "@/hooks/useTranslations";
import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { readRenderMode, saveRenderMode, RenderMode } from "@/rendering/renderMode";
import HelpModal from "./HelpModal";
import GameOverPanel from "./GameOverPanel";
import iconUrl from "@/assets/icon.png";
import { GAME_RULES } from "../constants/gameRules";
import Scoreboard from "./hud/Scoreboard";
import TileDock from "./hud/TileDock";
import ActivityLog, { type LogEntry } from "./hud/ActivityLog";
import { CircleQuestionMark, Menu, RotateCcw } from "lucide-react";

interface GameBoardProps {
  players: PlayerDefinition[];
  onReset: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ players, onReset }) => {
  const { t } = useTranslations();
  const [game, setGame] = useState<Game | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameRef = useRef<Game | null>(null);
  const logIdRef = useRef(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [renderMode, setRenderMode] = useState<RenderMode>(readRenderMode);
  const [graphicsUnavailable, setGraphicsUnavailable] = useState(false);
  const [highlightedFeature, setHighlightedFeature] = useState<ClaimableFeature>();
  const handleGraphicsUnavailable = useCallback(() => {
    setGraphicsUnavailable(true);
    setRenderMode("2d");
  }, []);
  const handleRenderMode = (mode: RenderMode) => {
    setRenderMode(mode);
    setGraphicsUnavailable(false);
    saveRenderMode(mode);
  };
  const [isGameOverCollapsed, setIsGameOverCollapsed] = useState(false);
  const [claimableFeatures, setClaimableFeatures] = useState<
    ClaimableFeature[]
  >([]);

  // Initialize game
  useEffect(() => {
    try {
      const gameInstance = new Game(players);
      gameRef.current = gameInstance;
      setGame(gameInstance);

      // Set up state change listener
      gameInstance.setStateChangeListener((state) => {
        setGameState(state);
        updateClaimableFeatures(gameInstance, state);
      });

      // Get initial state
      setGameState(gameInstance.getState());
      updateClaimableFeatures(gameInstance, gameInstance.getState());

      addLog(t("messages.gameStarted"));
    } catch (error) {
      console.error(t("messages.failedToInitialize"), error);
      addLog(t("messages.failedToStart"));
    }
  }, [players]);

  // Handle AI turns - trigger on relevant state changes only
  const currentPlayerIndex = gameState?.currentPlayerIndex;
  const phase = gameState?.phase;
  const isGameOver = gameState?.isGameOver;
  const currentPlayerIsAI = gameState?.players?.[currentPlayerIndex ?? 0]?.isAI;

  useEffect(() => {
    if (gameState?.isGameOver) {
      setIsGameOverCollapsed(false);
    }
  }, [gameState?.isGameOver]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const id = logIdRef.current++;
    setLogs((prev) => [
      { id, time: timestamp, message },
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
    if (!gameRef.current || !currentPlayerIsAI || isGameOver) return;
    const timer = setTimeout(() => {
      const currentGame = gameRef.current;
      if (!currentGame) return;
      const playerName = currentGame.getCurrentPlayer().name;
      const action = currentGame.processAITurn();
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
  }, [currentPlayerIsAI, currentPlayerIndex, phase, isGameOver, addLog, logCompletions, t]);

  const updateClaimableFeatures = useCallback(
    (gameInstance: Game, state: GameState) => {
      // Claiming/skipping unmounts the hovered or focused button without
      // necessarily firing mouseleave/blur. Never carry its selection forward.
      setHighlightedFeature(undefined);
      if (state.phase === GamePhase.CLAIM_FEATURE) {
        const features = gameInstance.getClaimableFeaturesForCurrentTurn();
        setClaimableFeatures(features);
      } else {
        setClaimableFeatures([]);
      }
    },
    []
  );

  const handleTilePlace = (position: Position) => {
    if (!game || !gameState || gameState.phase !== GamePhase.PLACE_TILE || gameState.isGameOver || gameState.players[gameState.currentPlayerIndex]?.isAI) return;

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
    if (game && game.canRotateTile()) {
      game.rotateTileClockwise();
    }
  };

  const handleRotateCounterClockwise = () => {
    if (game && game.canRotateTile()) {
      game.rotateTileCounterClockwise();
    }
  };

  const handleClaimFeature = (type: TerrainType, identifier?: string) => {
    if (!game || !gameState) return;

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

  const handleSkipClaim = () => {
    if (!game || !gameState) return;

    game.skipClaim();
    addLog(t("messages.skippedClaiming", {
      playerName: gameState.players[gameState.currentPlayerIndex].name,
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const g = gameRef.current;
      if (!g) return;

      switch (e.key) {
        case "r":
        case "R":
          if (g.canRotateTile()) {
            if (e.shiftKey || e.key === "R") g.rotateTileCounterClockwise();
            else g.rotateTileClockwise();
          }
          break;
        case "s":
        case "S":
          if (phase === GamePhase.CLAIM_FEATURE && !currentPlayerIsAI) {
            addLog(t("messages.skippedClaiming", { playerName: g.getCurrentPlayer().name }));
            g.skipClaim();
          }
          break;
        case "?":
          setShowHelp((prev) => !prev);
          break;
        case "Escape":
          setMenuOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addLog, phase, currentPlayerIsAI, t]);

  const hasState = gameState !== null;
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
  }, [game, hasState]);

  // Close the menu on any click outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      if (!(event.target as Element).closest?.(".hud-menu")) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  if (!game || !gameState) {
    return (
      <div className="game-stage grid place-items-center text-ink" role="status">
        {t("game.loading")}
      </div>
    );
  }

  const tileStats = game.getTileStats();

  return (
    <div className="game-stage" ref={stageRef}>
      <BoardView
        state={gameState}
        mode={renderMode}
        onTilePlace={handleTilePlace}
        onUnavailable={handleGraphicsUnavailable}
        highlightedFeature={highlightedFeature}
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
              unavailable={graphicsUnavailable}
              onDismissUnavailable={() => setGraphicsUnavailable(false)}
            />
          </div>
          <div className="hud-top-right">
            <ViewToggle mode={renderMode} onModeChange={handleRenderMode} />
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
            mode={renderMode}
            claimableFeatures={claimableFeatures}
            onRotateClockwise={handleRotateClockwise}
            onRotateCounterClockwise={handleRotateCounterClockwise}
            onClaim={handleClaimFeature}
            onSkip={handleSkipClaim}
            onHighlight={setHighlightedFeature}
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
