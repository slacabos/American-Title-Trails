import React, { useState, useEffect } from "react";
import { PlayerDefinition } from "../types";
import HelpModal from "./HelpModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GameSetupProps {
  onStartGame: (players: PlayerDefinition[]) => void;
}

import theme from "@/theme/colors";
const palette = theme.PALETTE;

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(3);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerDefinition[]>([]);
  const [showHelp, setShowHelp] = useState(false);

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
        <img
          src="/src/assets/icon.png"
          alt="American Tile Trails Game Icon"
          className="game-icon"
        />
        <p className="tagline">
          McDonalds abbeys, Costco castles, and cross-country roads.
        </p>

        <section className="game-setup">
          <h2>Game Setup</h2>
          <div className="setup-controls">
            <div className="control-group">
              <Label htmlFor="playerCount" className="text-white">
                Number of players (2-5):
              </Label>
              <Select
                value={playerCount.toString()}
                onValueChange={(value) => setPlayerCount(parseInt(value, 10))}
              >
                <SelectTrigger id="playerCount" className="w-full">
                  <SelectValue placeholder="Select number of players" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="3">3 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                  <SelectItem value="5">5 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="player-config">
              {playerConfigs.map((config, index) => (
                <div key={index} className="player-setup">
                  <div
                    className="player-color-indicator"
                    style={{ backgroundColor: config.color }}
                  />
                  <Label className="text-white">P{index + 1}:</Label>
                  <Input
                    type="text"
                    value={config.name}
                    onChange={(e) =>
                      updatePlayerConfig(index, "name", e.target.value)
                    }
                    placeholder={`Player ${index + 1}`}
                    className="flex-1"
                  />
                  <Select
                    value={config.isAI ? "ai" : "human"}
                    onValueChange={(value) =>
                      updatePlayerConfig(index, "isAI", value === "ai")
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="human">Human</SelectItem>
                      <SelectItem value="ai">AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <Button
              onClick={handleStartGame}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 text-lg"
            >
              Start Game
            </Button>

            <Button
              onClick={() => setShowHelp(true)}
              variant="outline"
              className="w-full mt-4"
            >
              📖 How to Play
            </Button>
          </div>
        </section>
      </aside>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
};

export default GameSetup;
