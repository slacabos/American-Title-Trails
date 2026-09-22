import React, { useState } from "react";
import GameSetup from "./components/GameSetup";
import GameBoard from "./components/GameBoard";
import ErrorBoundary from "./components/ErrorBoundary";
import { PlayerDefinition } from "./types";

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<PlayerDefinition[]>([]);

  const handleStartGame = (playerList: PlayerDefinition[]) => {
    setPlayers(playerList);
    setGameStarted(true);
  };

  const handleResetGame = () => {
    setGameStarted(false);
    setPlayers([]);
  };

  return (
    <div className="app-shell min-h-screen flex flex-col">
      <main className="game-layout">
        {gameStarted ? (
          <ErrorBoundary onReset={handleResetGame}>
            <GameBoard players={players} onReset={handleResetGame} />
          </ErrorBoundary>
        ) : (
          <GameSetup onStartGame={handleStartGame} />
        )}
      </main>

      {gameStarted && (
        <footer className="bg-card backdrop-blur-sm border-t border-border p-4 flex items-center justify-center gap-4">
          <img
            src="/src/assets/icon.png"
            alt="American Tile Trails Game Icon"
            className="w-8 h-8 rounded-md"
          />
          <div className="text-center">
            <h1 className="text-sm text-accent font-game mb-1">
              American Tile Trails
            </h1>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
