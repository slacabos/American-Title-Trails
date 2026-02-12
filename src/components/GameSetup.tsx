import React, { useState, useEffect } from "react";
import { PlayerDefinition, AIDifficulty } from "../types";
import HelpModal from "./HelpModal";
import PlayerConfigRow from "./PlayerConfigRow";
import GameSetupSidebar from "./GameSetupSidebar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useTranslations from "@/hooks/useTranslations";
import { PLAYER_COLORS } from "@/constants/colors";

interface GameSetupProps {
  onStartGame: (players: PlayerDefinition[]) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const { t } = useTranslations();
  const [playerCount, setPlayerCount] = useState(3);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerDefinition[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const configs: PlayerDefinition[] = [];
    for (let i = 0; i < playerCount; i++) {
      configs.push({
        name:
          i === 0
            ? t("setup.defaultPlayerName")
            : t("setup.defaultPlayerNameTemplate", { number: i + 1 }),
        id: `player-${i + 1}`,
        isAI: i > 0,
        aiDifficulty: i > 0 ? "medium" : undefined,
        color: PLAYER_COLORS[i],
      });
    }
    setPlayerConfigs(configs);
  }, [playerCount, t]);

  const updatePlayerConfig = (
    index: number,
    field: keyof PlayerDefinition,
    value: string | boolean | AIDifficulty
  ) => {
    const newConfigs = [...playerConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };

    // When toggling to AI, set default difficulty; when toggling to human, clear it
    if (field === "isAI") {
      newConfigs[index].aiDifficulty = value ? "medium" : undefined;

      // Update name when toggling player type
      const currentName = newConfigs[index].name;
      const humanDefault = t("setup.defaultPlayerName"); // "You"
      const playerDefault = t("setup.defaultPlayerNameTemplate", { number: index + 1 });
      const aiDefault = t("setup.aiPlayerNameTemplate", { number: index + 1 });

      if (value) {
        // Switching to AI - update name if it's the human default or empty
        if (currentName === humanDefault || currentName.trim() === "") {
          newConfigs[index].name = aiDefault;
        }
      } else {
        // Switching to Human - restore "You" for first player if using default names
        if (index === 0 && (currentName === aiDefault || currentName === playerDefault)) {
          newConfigs[index].name = humanDefault;
        }
      }
    }

    setPlayerConfigs(newConfigs);
  };

  const handleStartGame = () => {
    const validatedPlayers = playerConfigs.map((config, index) => ({
      ...config,
      name:
        config.name.trim() ||
        t("setup.defaultPlayerNameTemplate", { number: index + 1 }),
      id: `player-${index + 1}`,
      color: PLAYER_COLORS[index],
    }));
    onStartGame(validatedPlayers);
  };

  return (
    <>
      <div className="relative bg-card backdrop-blur-sm border border-border rounded-2xl p-6 shadow-2xl flex flex-col">
        <div className="flex flex-col justify-center p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-accent font-game">
              🎮 {t("setup.gameSetup")}
            </h2>
            <p className="text-center text-muted-foreground mb-8 font-game text-xxs">
              {t("setup.configureHint")}
            </p>
          </div>

          <div className="flex flex-col gap-6 max-w-lg mx-auto">
            <div className="control-group space-y-2">
              <Label
                htmlFor="playerCount"
                className="text-white text-base font-medium"
              >
                {t("setup.numberOfPlayers")}
              </Label>
              <Select
                value={playerCount.toString()}
                onValueChange={(value) => setPlayerCount(parseInt(value, 10))}
              >
                <SelectTrigger
                  id="playerCount"
                  className="w-full h-12 text-base font-game"
                >
                  <SelectValue placeholder={t("setup.selectNumberOfPlayers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">{t("setup.playersCount.2")}</SelectItem>
                  <SelectItem value="3">{t("setup.playersCount.3")}</SelectItem>
                  <SelectItem value="4">{t("setup.playersCount.4")}</SelectItem>
                  <SelectItem value="5">{t("setup.playersCount.5")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3 my-4">
              <Label className="text-white text-base font-medium font-game text-xxs">
                {t("setup.players")}
              </Label>
              {playerConfigs.map((config, index) => (
                <PlayerConfigRow
                  key={index}
                  config={config}
                  index={index}
                  onUpdate={updatePlayerConfig}
                />
              ))}
            </div>

            <Button
              onClick={handleStartGame}
              variant="default"
              className="w-full font-semibold py-4 px-6 text-lg mt-8 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {t("setup.startGame")}
            </Button>
          </div>
        </div>
      </div>

      <GameSetupSidebar onShowHelp={() => setShowHelp(true)} />

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
};

export default GameSetup;
