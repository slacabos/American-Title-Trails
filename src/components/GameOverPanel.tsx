import React from "react";
import type { PlayerState, ScoreBreakdown } from "../types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Crown } from "lucide-react";
import useTranslations from "@/hooks/useTranslations";

const SCORE_CATEGORY_ORDER = [
  "completed_road",
  "completed_costco",
  "completed_mcdonalds",
  "incomplete_costco",
  "incomplete_road",
  "incomplete_mcdonalds",
  "farmers",
] as const;

const SCORE_CATEGORY_LABELS: Record<(typeof SCORE_CATEGORY_ORDER)[number], string> =
  {
    completed_road: "Completed Roads",
    completed_costco: "Completed Costcos",
    completed_mcdonalds: "Completed McDonald's",
    incomplete_costco: "Incomplete Costcos",
    incomplete_road: "Incomplete Roads",
    incomplete_mcdonalds: "Incomplete McDonald's",
    farmers: "Farmers",
  };

interface GameOverPanelProps {
  players: PlayerState[];
  winner?: string;
  scoreBreakdown?: ScoreBreakdown;
  onReset: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

const GameOverPanel: React.FC<GameOverPanelProps> = ({
  players,
  winner,
  scoreBreakdown,
  onReset,
  collapsed,
  onToggle,
}) => {
  const { t } = useTranslations();
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const topPlayers = ranked.slice(0, 3);

  return (
    <section
      className="rounded-2xl border border-border bg-card text-card-foreground p-5 shadow-2xl max-h-[70vh] flex flex-col overflow-hidden"
      aria-label={t("gameOver.title")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("gameOver.title")}
          </h2>
          <p className="m-0 mt-2 flex items-center gap-2 text-xl font-semibold text-forest">
            <Crown size={20} className="text-gold" aria-label={t("gameOver.winnerLabel")} />
            {winner}
          </p>
        </div>
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          aria-label={collapsed ? t("gameOver.expandResults") : t("gameOver.minimizeResults")}
        >
          {collapsed ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
          {collapsed ? t("gameOver.expand") : t("gameOver.minimize")}
        </Button>
      </div>

      {collapsed ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {topPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-2 rounded-md bg-muted px-2 py-1"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span className="font-semibold">{player.name}</span>
              <span className="text-muted-foreground">
                {t("gameOver.points", { points: player.score })}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 overflow-y-auto pr-1 flex-1 min-h-0">
          {ranked.map((player, rank) => {
            const breakdown = scoreBreakdown?.[player.id];
            const entries = breakdown
              ? SCORE_CATEGORY_ORDER.map((category) => ({
                  category,
                  points: breakdown[category],
                })).filter((entry) => entry.points > 0)
              : [];

            return (
              <div
                key={player.id}
                className="rounded-xl bg-muted/70 p-3"
                style={{ borderLeft: `5px solid ${player.color}` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    <span className="text-muted-foreground mr-1.5">{rank + 1}.</span>
                    {player.name}
                  </span>
                  <span className="text-base font-bold tabular-nums">
                    {t("gameOver.points", { points: player.score })}
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-0.5 text-xs text-muted-foreground">
                  {entries.length > 0 ? (
                    entries.map(({ category, points }) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span>{SCORE_CATEGORY_LABELS[category]}</span>
                        <span className="font-semibold tabular-nums text-card-foreground">{points}</span>
                      </div>
                    ))
                  ) : (
                    <div>{t("gameOver.noCategories")}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button onClick={onReset} className="mt-4">
        {t("gameOver.playAgain")}
      </Button>
    </section>
  );
};

export default GameOverPanel;
