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

const palette = ["#ff595e", "#1982c4", "#ffca3a", "#6a4c93", "#43aa8b"];

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
      <div className="relative bg-card backdrop-blur-sm border border-border rounded-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex flex-col justify-center min-h-[500px] p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-accent font-game">
              🎮 Game Setup
            </h2>
            <p className="text-center text-muted-foreground mb-8 font-game text-xxs">
              Configure your game settings to get started
            </p>
          </div>

          <div className="flex flex-col gap-6 max-w-lg mx-auto">
            <div className="control-group space-y-2">
              <Label
                htmlFor="playerCount"
                className="text-white text-base font-medium"
              >
                Number of players (2-5):
              </Label>
              <Select
                value={playerCount.toString()}
                onValueChange={(value) => setPlayerCount(parseInt(value, 10))}
              >
                <SelectTrigger
                  id="playerCount"
                  className="w-full h-12 text-base font-game"
                >
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

            <div className="flex flex-col gap-3 my-4">
              <Label className="text-white text-base font-medium font-game text-xxs">
                Players:
              </Label>
              {playerConfigs.map((config, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-muted/10 p-2 rounded-lg border border-accent/20 transition-all duration-200 hover:bg-muted/15 hover:border-accent/30"
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 border-game-text inline-block"
                    style={{ backgroundColor: config.color }}
                  />
                  <Label className="text-white min-w-[50px] text-sm font-game text-xxs">
                    P{index + 1}:
                  </Label>
                  <Input
                    type="text"
                    value={config.name}
                    onChange={(e) =>
                      updatePlayerConfig(index, "name", e.target.value)
                    }
                    placeholder={`Player ${index + 1}`}
                    className="flex-1 h-10"
                  />
                  <Select
                    value={config.isAI ? "ai" : "human"}
                    onValueChange={(value) =>
                      updatePlayerConfig(index, "isAI", value === "ai")
                    }
                  >
                    <SelectTrigger className="w-24 h-10 font-game text-xxs">
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 text-lg mt-8 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              🚀 Start Game
            </Button>
          </div>
        </div>
      </div>

      <aside className="relative bg-card backdrop-blur-md border-2 border-accent/30 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
        <h1 className="m-0 text-xl text-accent font-game">
          American Tile Trails
        </h1>
        <img
          src="/src/assets/icon.png"
          alt="American Tile Trails Game Icon"
          className="w-full mx-auto my-2 block rounded-lg shadow-game-sm"
        />
        <p className="m-0 text-xxs opacity-80 leading-tight font-game">
          McDonalds abbeys, Costco castles, and cross-country roads.
        </p>

        <div className="mt-auto pt-4 border-t border-accent/20">
          <Button
            onClick={() => setShowHelp(true)}
            variant="outline"
            className="w-full font-game text-xxs"
          >
            📖 How to Play
          </Button>
        </div>
      </aside>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
};

export default GameSetup;
