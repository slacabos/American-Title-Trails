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
}

const GameOverPanel: React.FC<GameOverPanelProps> = ({
  players,
  winner,
  scoreBreakdown,
  onReset,
}) => {
  return (
    <div className="mt-4 rounded-2xl border border-accent/30 bg-[radial-gradient(circle_at_top,_rgba(249,214,91,0.12),_rgba(15,23,42,0.65))] p-5 text-center font-game shadow-[0_0_30px_rgba(249,214,91,0.15)]">
      <h2 className="m-0 text-lg text-accent tracking-wide">Game Over!</h2>
      <p className="mt-2 text-sm text-accent/90">
        <span className="uppercase tracking-[0.2em] text-xxs block opacity-70">
          Winner
        </span>
        <span className="mt-1 block text-lg text-foreground drop-shadow-[0_0_10px_rgba(249,214,91,0.4)]">
          {winner}
        </span>
      </p>

      <div className="mt-5 grid gap-4 text-left">
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
              className="rounded-xl border border-border/50 bg-muted/50 p-4 shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
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

      <Button
        onClick={onReset}
        className="mt-4 bg-green-600 hover:bg-green-700 text-white"
      >
        Play Again
      </Button>
    </div>
  );
};

export default GameOverPanel;
