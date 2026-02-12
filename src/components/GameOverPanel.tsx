import React from "react";
import type { PlayerState, ScoreBreakdown } from "../types";
import { Button } from "@/components/ui/button";

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
  const topPlayers = [...players]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-accent/30 bg-card p-5 text-center font-game shadow-2xl max-h-[60vh] flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4 text-left">
        <div>
          <h2 className="m-0 text-lg text-accent tracking-wide">Game Over!</h2>
          <p className="mt-2 text-sm text-accent/90">
            <span className="uppercase tracking-[0.2em] text-xxs block opacity-70">
              Winner
            </span>
            <span className="mt-1 block text-lg text-accent">
              {winner}
            </span>
          </p>
        </div>
        <Button
          onClick={onToggle}
          variant="outline"
          className="text-xxs font-game border-accent/30 text-accent hover:bg-accent/10"
          aria-label={collapsed ? "Expand results" : "Minimize results"}
        >
          {collapsed ? "Expand" : "Minimize"}
        </Button>
      </div>

      {collapsed ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xxs">
          {topPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/50 px-2 py-1"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span className="font-semibold">{player.name}</span>
              <span className="opacity-80">{player.score} pts</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 text-left overflow-y-auto pr-1 flex-1 min-h-0">
          {players.map((player) => {
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
                className="rounded-xl border border-border/50 bg-muted/50 p-4 shadow-game-sm"
                style={{ borderLeftColor: player.color, borderLeftWidth: 6 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold tracking-wide">
                    {player.name}
                  </span>
                  <span className="text-xs opacity-80">{player.score} pts</span>
                </div>
                <div className="mt-3 flex flex-col gap-1 text-xxs opacity-80">
                  {entries.length > 0 ? (
                    entries.map(({ category, points }) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span>{SCORE_CATEGORY_LABELS[category]}</span>
                        <span className="font-semibold">{points}</span>
                      </div>
                    ))
                  ) : (
                    <div className="opacity-70">No scoring categories</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button
        onClick={onReset}
        className="mt-4 bg-green-600 hover:bg-green-700 text-white text-xs"
      >
        Play Again
      </Button>
    </div>
  );
};

export default GameOverPanel;
