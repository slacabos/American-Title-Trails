import React, { useState, useEffect } from "react";
import { PlayerDefinition } from "../types";

interface GameSetupProps {
  onStartGame: (players: PlayerDefinition[]) => void;
}

const palette = ["#ff595e", "#1982c4", "#ffca3a", "#6a4c93", "#43aa8b"];

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(3);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerDefinition[]>([]);

  useEffect(() => {
    const configs: PlayerDefinition[] = [];
    for (let i = 0; i < playerCount; i++) {
      configs.push({
        name: i === 0 ? "You" : `Player ${i + 1}`,
        id: `player-${i + 1}`,
        isAI: i > 0,
        color: palette[i],
      });
    }
    setPlayerConfigs(configs);
  }, [playerCount]);

  const updatePlayerConfig = (
    index: number,
    field: keyof PlayerDefinition,
    value: string | boolean
  ) => {
    const newConfigs = [...playerConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setPlayerConfigs(newConfigs);
  };

  const handleStartGame = () => {
    const validatedPlayers = playerConfigs.map((config, index) => ({
      ...config,
      name: config.name.trim() || `Player ${index + 1}`,
      id: `player-${index + 1}`,
      color: palette[index],
    }));
    onStartGame(validatedPlayers);
  };

  return (
    <>
      <div className="board-panel">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "400px",
            fontSize: "2rem",
            opacity: 0.3,
          }}
        >
          🎮 Ready to Play!
        </div>
        <div className="hint">
          Configure your game settings and click Start Game.
        </div>
      </div>

      <aside className="sidebar">
        <h1>American Tile Trails</h1>
        <p className="tagline">
          McDonalds abbeys, Costco castles, and cross-country roads.
        </p>

        <section className="game-setup">
          <h2>Game Setup</h2>
          <div className="setup-controls">
            <div className="control-group">
              <label htmlFor="playerCount">Number of players (2-5):</label>
              <select
                id="playerCount"
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value, 10))}
              >
                <option value="2">2 Players</option>
                <option value="3">3 Players</option>
                <option value="4">4 Players</option>
                <option value="5">5 Players</option>
              </select>
            </div>

            <div className="player-config">
              {playerConfigs.map((config, index) => (
                <div key={index} className="player-setup">
                  <div
                    className="player-color-indicator"
                    style={{ backgroundColor: config.color }}
                  />
                  <label>P{index + 1}:</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) =>
                      updatePlayerConfig(index, "name", e.target.value)
                    }
                    placeholder={`Player ${index + 1}`}
                  />
                  <select
                    value={config.isAI ? "ai" : "human"}
                    onChange={(e) =>
                      updatePlayerConfig(index, "isAI", e.target.value === "ai")
                    }
                  >
                    <option value="human">Human</option>
                    <option value="ai">AI</option>
                  </select>
                </div>
              ))}
            </div>

            <button className="start-button" onClick={handleStartGame}>
              Start Game
            </button>
          </div>
        </section>
      </aside>
    </>
  );
};

export default GameSetup;
