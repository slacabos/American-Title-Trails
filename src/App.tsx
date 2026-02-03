import React, { useState } from "react";
import GameSetup from "./components/GameSetup";
import GameBoard from "./components/GameBoard";
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
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 grid grid-cols-[minmax(640px,1fr)_360px] gap-8 p-6 w-full min-w-fit max-w-[1200px] mx-auto">
        {gameStarted ? (
          <GameBoard players={players} onReset={handleResetGame} />
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
