import React, { useState, useEffect } from "react";
import { PlayerDefinition, AIDifficulty } from "../types";
import HelpModal from "./HelpModal";
import PlayerConfigRow from "./PlayerConfigRow";
import iconUrl from "@/assets/icon.png";
import { CircleQuestionMark, Waves } from "lucide-react";
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
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        <header className="flex items-center gap-4 p-6 pb-5 bg-muted/60 border-b border-border">
          <img
            src={iconUrl}
            alt={t("app.gameIcon")}
            className="h-16 w-16 rounded-xl shadow-md shrink-0"
          />
          <div className="min-w-0">
            <h1 className="m-0 brand-wordmark text-sm sm:text-base text-forest">
              {t("app.title")}
            </h1>
            <p className="m-0 mt-2 text-sm text-muted-foreground">
              {t("app.tagline")}
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-6 p-6">
          <h2 className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("setup.gameSetup")}
          </h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="playerCount" className="text-sm font-semibold">
              {t("setup.numberOfPlayers")}
            </Label>
            <Select
              value={playerCount.toString()}
              onValueChange={(value) => setPlayerCount(parseInt(value, 10))}
            >
              <SelectTrigger id="playerCount" className="h-11">
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

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold">{t("setup.players")}</Label>
            {playerConfigs.map((config, index) => (
              <PlayerConfigRow
                key={index}
                config={config}
                index={index}
                onUpdate={updatePlayerConfig}
              />
            ))}
          </div>

          <p className="m-0 flex gap-2 rounded-lg bg-muted/70 p-3 text-sm text-muted-foreground">
            <Waves size={18} className="shrink-0 mt-0.5 text-forest" aria-hidden="true" />
            {t("setup.riverOpening")}
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              className="sm:w-auto"
              onClick={() => setShowHelp(true)}
            >
              <CircleQuestionMark aria-hidden="true" />
              {t("setup.howToPlay")}
            </Button>
            <Button onClick={handleStartGame} size="lg" className="sm:flex-1">
              {t("setup.startGame")}
            </Button>
          </div>
        </div>
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
};

export default GameSetup;
