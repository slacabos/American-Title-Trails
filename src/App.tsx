import React, { useState } from "react";
import GameSetup from "./components/GameSetup";
import GameBoard from "./components/GameBoard";
import ErrorBoundary from "./components/ErrorBoundary";
import { PlayerDefinition } from "./types";
import { clearSavedGame, readSavedGame, restoreGame, type SavedGame } from "./persistence/savedGame";

/** A save worth offering: one that still replays. */
const readResumableGame = (): SavedGame | undefined => {
  const save = readSavedGame();
  return save && restoreGame(save) ? save : undefined;
};

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<PlayerDefinition[]>([]);
  const [resume, setResume] = useState<SavedGame>();
  const [savedGame, setSavedGame] = useState(readResumableGame);

  const handleStartGame = (playerList: PlayerDefinition[]) => {
    // Only a new game replaces the save; returning to setup keeps it.
    clearSavedGame();
    setSavedGame(undefined);
    setPlayers(playerList);
    setResume(undefined);
    setGameStarted(true);
  };

  const handleResumeGame = (save: SavedGame) => {
    setPlayers(save.players);
    setResume(save);
    setGameStarted(true);
  };

  const handleDiscardSave = () => {
    clearSavedGame();
    setSavedGame(undefined);
  };

  const handleResetGame = () => {
    setGameStarted(false);
    setPlayers([]);
    setResume(undefined);
    setSavedGame(readResumableGame());
  };

  return (
    <div className="app-shell">
      {gameStarted ? (
        <main className="game-stage-shell">
          <ErrorBoundary onReset={handleResetGame}>
            <GameBoard players={players} resume={resume} onReset={handleResetGame} />
          </ErrorBoundary>
        </main>
      ) : (
        <main className="setup-screen">
          <GameSetup
            onStartGame={handleStartGame}
            savedGame={savedGame}
            onResumeGame={handleResumeGame}
            onDiscardSave={handleDiscardSave}
          />
        </main>
      )}
    </div>
  );
};

export default App;
