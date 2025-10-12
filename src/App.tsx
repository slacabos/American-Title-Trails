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
    <div className="layout">
      {gameStarted ? (
        <GameBoard players={players} onReset={handleResetGame} />
      ) : (
        <GameSetup onStartGame={handleStartGame} />
      )}
    </div>
  );
};

export default App;
