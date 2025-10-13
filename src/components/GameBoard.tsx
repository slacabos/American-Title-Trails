import React, { useState, useEffect, useCallback } from "react";
import { PlayerDefinition, Position, TerrainType } from "../types";
import { Game, GamePhase } from "../game";
import BoardCanvas from "./BoardCanvas";
import TileRenderer from "./TileRenderer";
import HelpModal from "./HelpModal";
import { Button } from "@/components/ui/button";

interface GameBoardProps {
  players: PlayerDefinition[];
  onReset: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ players, onReset }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [claimableFeatures, setClaimableFeatures] = useState<
    Array<{ type: TerrainType; identifier?: string }>
  >([]);

  // Initialize game
  useEffect(() => {
    try {
      const gameInstance = new Game(players);
      setGame(gameInstance);

      // Set up state change listener
      gameInstance.setStateChangeListener((state) => {
        setGameState(state);
        updateClaimableFeatures(gameInstance, state);
      });

      // Get initial state
      setGameState(gameInstance.getState());
      updateClaimableFeatures(gameInstance, gameInstance.getState());

      addLog("Game started!");
    } catch (error) {
      console.error("Failed to initialize game:", error);
      addLog("Failed to start game. Please try again.");
    }
  }, [players]);

  // Handle AI turns
  useEffect(() => {
    if (
      game &&
      gameState &&
      gameState.players[gameState.currentPlayerIndex]?.isAI
    ) {
      const timer = setTimeout(() => {
        game.processAITurn();
      }, 1000); // 1 second delay for AI moves

      return () => clearTimeout(timer);
    }
  }, [game, gameState?.currentPlayerIndex, gameState?.phase]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLogs((prev) => [`${timestamp} — ${message}`, ...prev.slice(0, 19)]);
  }, []);

  const updateClaimableFeatures = (_gameInstance: Game, state: any) => {
    if (state.phase === GamePhase.CLAIM_FEATURE && state.currentTile) {
      // Get features that can be claimed on the last placed tile
      const features: Array<{ type: TerrainType; identifier?: string }> = [];

      // Check road connections
      state.currentTile.roadConnections.forEach((_: any, index: number) => {
        features.push({ type: "road", identifier: `road_${index}` });
      });

      // Check Costco zones
      state.currentTile.costcoZones.forEach((_: any, index: number) => {
        features.push({ type: "costco", identifier: `costco_${index}` });
      });

      // Check McDonalds
      if (state.currentTile.center === "mcdonalds") {
        features.push({ type: "mcdonalds" });
      }

      setClaimableFeatures(features);
    } else {
      setClaimableFeatures([]);
    }
  };

  const handleTilePlace = (position: Position) => {
    if (!game || !gameState) return;

    const result = game.placeTile(position);
    if (result.success) {
      addLog(
        `${
          gameState.players[gameState.currentPlayerIndex].name
        } placed tile at (${position.x}, ${position.y})`
      );
      if (result.completedFeatures.length > 0) {
        addLog(`${result.completedFeatures.length} features completed!`);
      }
    } else {
      addLog(`Failed to place tile: ${result.message}`);
    }
  };

  const handleRotateTile = () => {
    if (game && game.canRotateTile()) {
      game.rotateTile();
      addLog("Tile rotated");
    }
  };

  const handleClaimFeature = (type: TerrainType, identifier?: string) => {
    if (!game) return;

    const success = game.claimFeature(type, identifier);
    if (success) {
      addLog(
        `${
          gameState.players[gameState.currentPlayerIndex].name
        } claimed ${type}${identifier ? ` (${identifier})` : ""}`
      );
    } else {
      addLog("Failed to claim feature");
    }
  };

  const handleSkipClaim = () => {
    if (!game) return;

    game.skipClaim();
    addLog(
      `${gameState.players[gameState.currentPlayerIndex].name} skipped claiming`
    );
  };

  if (!game || !gameState) {
    return (
      <div className="grid grid-cols-[minmax(640px,1fr)_360px] gap-6 p-8 w-full min-w-fit max-w-[1200px]">
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-center h-96">
            Loading game...
          </div>
        </div>
      </div>
    );
  }

  const tileStats = game.getTileStats();

  return (
    <>
      <div className="relative bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <BoardCanvas
          board={gameState.board}
          currentTile={gameState.currentTile}
          onTilePlace={handleTilePlace}
          showValidPlacements={gameState.phase === GamePhase.PLACE_TILE}
        />

        {gameState.phase === GamePhase.CLAIM_FEATURE && (
          <div className="mt-3 p-3 bg-game-accent/10 rounded-lg border border-game-accent/20">
            <h3 className="m-0 mb-2 text-xs text-game-accent font-game">
              Claim a Feature
            </h3>
            <p className="text-xs opacity-80 mb-3 leading-tight font-game">
              💡 Place a follower to score points when features complete. You
              have{" "}
              {gameState.players[gameState.currentPlayerIndex]?.followers || 0}{" "}
              followers remaining.
            </p>
            <div className="flex flex-col gap-2">
              {claimableFeatures.map((feature, index) => (
                <Button
                  key={index}
                  onClick={() =>
                    handleClaimFeature(feature.type, feature.identifier)
                  }
                  className="bg-btn-secondary hover:bg-btn-secondary-hover text-game-text font-game text-xxs"
                >
                  Claim {feature.type}
                  {feature.identifier && ` (${feature.identifier})`}
                </Button>
              ))}
              <Button
                onClick={handleSkipClaim}
                variant="outline"
                className="font-game text-xxs"
              >
                Skip Claiming
              </Button>
            </div>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p>Winner: {gameState.winner}</p>
            <Button
              onClick={onReset}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Play Again
            </Button>
          </div>
        )}
      </div>

      <aside className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
        <h1 className="m-0 text-xl text-game-accent font-game">
          American Tile Trails
        </h1>
        <img
          src="/src/assets/icon.png"
          alt="American Tile Trails Game Icon"
          className="w-full mx-auto my-2 block rounded-lg shadow-game-sm"
        />
        <p className="m-0 text-xxs opacity-80 leading-tight font-game">
          TypeScript + React Edition
        </p>

        <section>
          <h2 className="m-0 mb-3 text-sm text-game-accent font-game">
            Current Tile
          </h2>
          {gameState.currentTile ? (
            <div className="bg-game-bg-primary/30 rounded-xl p-4 flex flex-col items-center gap-3">
              <TileRenderer
                tile={gameState.currentTile}
                size={96}
                className="preview-tile border-2 border-game-blue bg-game-bg-primary"
              />
              <div className="text-center text-xxs leading-tight font-game">
                <strong>{gameState.currentTile.name}</strong>
                <div className="opacity-80 mt-1">
                  Phase: {gameState.phase.replace("_", " ")}
                </div>
              </div>
              {gameState.phase === GamePhase.PLACE_TILE && (
                <div className="flex flex-col gap-2 w-full mt-2">
                  <Button
                    onClick={handleRotateTile}
                    disabled={!gameState.currentTile}
                    className="w-full bg-btn-primary hover:bg-btn-primary-hover disabled:opacity-50 disabled:cursor-not-allowed border-0 rounded-md text-game-text px-4 py-2 font-game text-xxs cursor-pointer transition-all duration-200"
                  >
                    🔄 Rotate Tile
                  </Button>
                  <div className="text-xs opacity-70 text-center leading-tight mt-1 font-game">
                    💡 Click green areas to place • Wheel to zoom • Drag to pan
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-xxs opacity-60 font-game">
              No current tile
            </div>
          )}
        </section>

        <section className="bg-game-bg-primary/30 rounded-xl p-4 flex flex-col gap-3">
          <h2 className="m-0 text-sm text-game-accent font-game">
            Game Controls
          </h2>
          <Button
            onClick={onReset}
            variant="outline"
            className="mb-2 font-game text-xxs"
          >
            New Game
          </Button>
          <Button
            onClick={() => setShowHelp(true)}
            variant="outline"
            className="font-game text-xxs"
          >
            📖 Show Help
          </Button>
          <div className="text-xxs text-center p-2 bg-game-bg-primary/50 rounded-md leading-tight font-game">
            <div>Turn: {gameState.turnNumber}</div>
            <div>
              Tiles: {tileStats.placed}/{tileStats.total}
            </div>
            <div>Remaining: {tileStats.remaining}</div>
          </div>
        </section>

        {showHelp && (
          <section className="bg-game-bg-primary/30 rounded-xl p-4">
            <h2 className="m-0 mb-3 text-sm text-game-accent font-game">
              Quick Guide
            </h2>
            <div>
              <h3>🎯 How to Play</h3>
              <ol>
                <li>
                  <strong>Place Tile:</strong> Click green areas on board
                </li>
                <li>
                  <strong>Rotate:</strong> Use "Rotate Tile" button
                </li>
                <li>
                  <strong>Claim:</strong> Optional - claim roads, Costcos,
                  McDonalds
                </li>
                <li>
                  <strong>Score:</strong> Get points when features complete
                </li>
              </ol>

              <h3>📊 Scoring</h3>
              <ul>
                <li>
                  <strong>Roads:</strong> 1 point per tile
                </li>
                <li>
                  <strong>Costcos:</strong> 2 points per tile
                </li>
                <li>
                  <strong>McDonalds:</strong> 9 points (when surrounded)
                </li>
              </ul>

              <h3>🎮 Controls</h3>
              <ul>
                <li>
                  <strong>Zoom:</strong> Mouse wheel
                </li>
                <li>
                  <strong>Pan:</strong> Click and drag board
                </li>
                <li>
                  <strong>Place:</strong> Click valid (green) positions
                </li>
              </ul>

              <div className="help-footer">
                <small>
                  📖{" "}
                  <a
                    href="./GAMEPLAY_INSTRUCTIONS.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Complete Instructions
                  </a>
                </small>
              </div>
            </div>
          </section>
        )}

        <section className="bg-game-bg-primary/30 rounded-xl p-4">
          <h2 className="m-0 mb-3 text-sm text-game-accent font-game">
            Players & Scores
          </h2>
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            {gameState.players.map((player: any, index: number) => (
              <li
                key={player.id}
                className="flex items-center gap-2 p-2 rounded-md border-l-2"
                style={{
                  backgroundColor: `${player.color}15`,
                  borderLeftColor: player.color,
                }}
              >
                <span className="text-xs w-4 font-game">
                  {index === gameState.currentPlayerIndex ? "▶" : ""}
                </span>
                <div className="flex-1 flex flex-col gap-1">
                  <strong className="text-xxs font-game">
                    {player.name}
                    {player.isAI ? " 🤖" : ""}
                  </strong>
                  <span className="text-xs opacity-80 font-game">
                    {player.score} pts • {player.followers} followers
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-game-bg-primary/30 rounded-xl p-4">
          <h2 className="m-0 mb-3 text-sm text-game-accent font-game">
            Activity Log
          </h2>
          <ul className="list-none m-0 p-0 flex flex-col gap-1 max-h-48 overflow-y-auto">
            {logs.map((log, index) => (
              <li
                key={index}
                className="text-xs leading-tight py-1 opacity-80 border-b border-slate-100/10 last:border-b-0 font-game"
              >
                {log}
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
};

export default GameBoard;
