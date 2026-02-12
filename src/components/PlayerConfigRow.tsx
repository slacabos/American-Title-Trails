import React from "react";
import { PlayerDefinition, AIDifficulty } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useTranslations from "@/hooks/useTranslations";

export interface PlayerConfigRowProps {
  config: PlayerDefinition;
  index: number;
  onUpdate: (
    index: number,
    field: keyof PlayerDefinition,
    value: string | boolean | AIDifficulty
  ) => void;
}

const PlayerConfigRow: React.FC<PlayerConfigRowProps> = ({
  config,
  index,
  onUpdate,
}) => {
  const { t } = useTranslations();

  return (
    <div
      className="flex items-center gap-3 bg-muted/10 p-2 rounded-lg border border-accent/20 transition-all duration-200 hover:bg-muted/15 hover:border-accent/30"
    >
      <div
        className="w-5 h-5 rounded-full border-2 border-game-text inline-block"
        style={{ backgroundColor: config.color }}
      />
      <Label className="text-white min-w-[50px] text-sm font-game text-xxs">
        {t("setup.playerPrefix")}
        {index + 1}:
      </Label>
      <Input
        type="text"
        value={config.name}
        onChange={(e) => onUpdate(index, "name", e.target.value)}
        placeholder={`${t("setup.playerPlaceholder")} ${index + 1}`}
        className="flex-1 h-10"
      />
      <Select
        value={config.isAI ? "ai" : "human"}
        onValueChange={(value) => onUpdate(index, "isAI", value === "ai")}
      >
        <SelectTrigger className="w-24 h-10 font-game text-xxs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="human">
            {t("setup.playerTypes.human")}
          </SelectItem>
          <SelectItem value="ai">
            {t("setup.playerTypes.ai")}
          </SelectItem>
        </SelectContent>
      </Select>
      {config.isAI && (
        <Select
          value={config.aiDifficulty || "medium"}
          onValueChange={(value) =>
            onUpdate(index, "aiDifficulty", value as AIDifficulty)
          }
        >
          <SelectTrigger className="w-24 h-10 font-game text-xxs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">
              {t("setup.aiDifficulty.easy")}
            </SelectItem>
            <SelectItem value="medium">
              {t("setup.aiDifficulty.medium")}
            </SelectItem>
            <SelectItem value="hard">
              {t("setup.aiDifficulty.hard")}
            </SelectItem>
            <SelectItem value="expert">
              {t("setup.aiDifficulty.expert")}
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default PlayerConfigRow;
