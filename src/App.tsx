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
    <div className="app-shell">
      {gameStarted ? (
        <main className="game-stage-shell">
          <ErrorBoundary onReset={handleResetGame}>
            <GameBoard players={players} onReset={handleResetGame} />
          </ErrorBoundary>
        </main>
      ) : (
        <main className="setup-screen">
          <GameSetup onStartGame={handleStartGame} />
        </main>
      )}
    </div>
  );
};

export default App;
