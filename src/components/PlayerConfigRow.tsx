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
      className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-lg border border-border bg-parchment p-2"
    >
      <div
        className="w-4 h-4 rounded-full shrink-0 inline-block shadow-[0_0_0_2px_#fff]"
        style={{ backgroundColor: config.color }}
      />
      <Label className="min-w-[28px] text-sm font-semibold text-muted-foreground">
        {t("setup.playerPrefix")}
        {index + 1}:
      </Label>
      <Input
        type="text"
        value={config.name}
        onChange={(e) => onUpdate(index, "name", e.target.value)}
        placeholder={`${t("setup.playerPlaceholder")} ${index + 1}`}
        className="flex-1 min-w-[140px] h-10 bg-white"
      />
      <Select
        value={config.isAI ? "ai" : "human"}
        onValueChange={(value) => onUpdate(index, "isAI", value === "ai")}
      >
        <SelectTrigger className="w-28 h-10">
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
          <SelectTrigger className="w-28 h-10">
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
