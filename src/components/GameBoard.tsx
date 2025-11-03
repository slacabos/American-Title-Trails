import React, { useState, useEffect, useCallback } from "react";
import { PlayerDefinition, Position, GameState, ClaimableFeature } from "../types";
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
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [claimableFeatures, setClaimableFeatures] = useState<ClaimableFeature[]>([]);

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

  const updateClaimableFeatures = (gameInstance: Game, state: GameState | null) => {
    if (!state || state.phase !== GamePhase.CLAIM_FEATURE) {
      setClaimableFeatures([]);
      return;
    }

    // Use the game's method to get claimable features
    const features = gameInstance.getClaimableFeatures();
    setClaimableFeatures(features);
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

  const handleClaimFeature = (feature: ClaimableFeature) => {
    if (!game || !gameState) return;

    const success = game.claimFeature(feature.type, feature.identifier);
    if (success) {
      const featureName = feature.label || feature.type;
      addLog(
        `${
          gameState.players[gameState.currentPlayerIndex].name
        } claimed ${featureName}`
      );
    } else {
      addLog("Failed to claim feature");
    }
  };

  const handleSkipClaim = () => {
    if (!game || !gameState) return;

    game.skipClaim();
    addLog(
      `${gameState.players[gameState.currentPlayerIndex].name} skipped claiming`
    );
  };

  if (!game || !gameState) {
    return (
      <div className="layout">
        <div className="board-panel">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "400px",
            }}
          >
            Loading game...
          </div>
        </div>
      </div>
    );
  }

  const tileStats = game.getTileStats();

  return (
    <div className="layout">
      <div className="board-panel">
        <BoardCanvas
          board={gameState.board}
          currentTile={gameState.currentTile}
          onTilePlace={handleTilePlace}
          showValidPlacements={gameState.phase === GamePhase.PLACE_TILE}
        />

        {gameState.phase === GamePhase.CLAIM_FEATURE && (
          <div className="claim-controls">
            <h3>Claim a Feature</h3>
            <p className="claim-hint">
              💡 Place a follower to score points when features complete. You
              have{" "}
              {gameState.players[gameState.currentPlayerIndex]?.followers || 0}{" "}
              followers remaining.
            </p>
            {gameState.players[gameState.currentPlayerIndex]?.followers > 0 ? (
              claimableFeatures.length > 0 ? (
                <div className="feature-buttons">
                  {claimableFeatures.map((feature, index) => (
                    <Button
                      key={index}
                      onClick={() => handleClaimFeature(feature)}
                      className={`feature-button feature-${feature.type} bg-blue-600 hover:bg-blue-700 text-white`}
                    >
                      {feature.label || `Claim ${feature.type}`}
                    </Button>
                  ))}
                  <Button
                    onClick={handleSkipClaim}
                    variant="outline"
                    className="skip-button"
                  >
                    Skip Claiming
                  </Button>
                </div>
              ) : (
                <div className="feature-buttons">
                  <p className="no-features-message">
                    No features available to claim on this tile.
                  </p>
                  <Button
                    onClick={handleSkipClaim}
                    variant="outline"
                    className="skip-button"
                  >
                    Continue
                  </Button>
                </div>
              )
            ) : (
              <div className="feature-buttons">
                <p className="no-features-message">
                  You have no followers left to place.
                </p>
                <Button
                  onClick={handleSkipClaim}
                  variant="outline"
                  className="skip-button"
                >
                  Continue
                </Button>
              </div>
            )}
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

      <aside className="sidebar">
        <h1>American Tile Trails</h1>
        <img
          src="/src/assets/icon.png"
          alt="American Tile Trails Game Icon"
          className="game-icon"
        />
        <p className="tagline">TypeScript + React Edition</p>

        <section className="current-tile">
          <h2>Current Tile</h2>
          {gameState.currentTile ? (
            <div className="tile-preview">
              <TileRenderer
                tile={gameState.currentTile}
                size={96}
                className="preview-tile"
              />
              <div className="tile-details">
                <strong>{gameState.currentTile.name}</strong>
                <div className="phase-info">
                  Phase: {gameState.phase.replace("_", " ")}
                </div>
              </div>
              {gameState.phase === GamePhase.PLACE_TILE && (
                <div className="tile-controls">
                  <Button
                    onClick={handleRotateTile}
                    disabled={!gameState.currentTile}
                    className="rotate-button bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    🔄 Rotate Tile
                  </Button>
                  <div className="control-hint">
                    💡 Click green areas to place • Wheel to zoom • Drag to pan
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-tile">No current tile</div>
          )}
        </section>

        <section className="game-controls">
          <h2>Game Controls</h2>
          <Button onClick={onReset} variant="outline" className="mb-2">
            New Game
          </Button>
          <Button onClick={() => setShowHelp(true)} variant="outline">
            📖 Show Help
          </Button>
          <div className="game-stats">
            <div>Turn: {gameState.turnNumber}</div>
            <div>
              Tiles: {tileStats.placed}/{tileStats.total}
            </div>
            <div>Remaining: {tileStats.remaining}</div>
          </div>
        </section>

        {showHelp && (
          <section className="help-section">
            <h2>Quick Guide</h2>
            <div className="help-content">
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

        <section className="scoreboard">
          <h2>Players & Scores</h2>
          <ul className="score-list">
            {gameState.players.map((player: any, index: number) => (
              <li
                key={player.id}
                className={`score-entry ${
                  index === gameState.currentPlayerIndex ? "current-player" : ""
                }`}
                style={
                  { "--player-color": player.color } as React.CSSProperties
                }
              >
                <span className="turn-marker">
                  {index === gameState.currentPlayerIndex ? "▶" : ""}
                </span>
                <div className="details">
                  <strong>
                    {player.name}
                    {player.isAI ? " 🤖" : ""}
                  </strong>
                  <span>
                    {player.score} pts • {player.followers} followers
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="log">
          <h2>Activity Log</h2>
          <ul className="log-entries">
            {logs.map((log, index) => (
              <li key={index}>{log}</li>
            ))}
          </ul>
        </section>
      </aside>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

export default GameBoard;
