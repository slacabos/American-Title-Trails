import { Bot } from "lucide-react";
import type { IBoard } from "@/interfaces/IBoard";
import type { PlayerState } from "@/types";
import FollowerDetails from "../FollowerDetails";
import { getFollowerBreakdown } from "@/utils/followerUtils";
import useTranslations from "@/hooks/useTranslations";
import HudPanel from "./HudPanel";

interface ScoreboardProps {
  players: PlayerState[];
  currentPlayerIndex: number;
  board: IBoard;
  turnNumber: number;
  tileStats: { placed: number; total: number; remaining: number };
  isGameOver: boolean;
  className?: string;
}

export function Scoreboard({
  players,
  currentPlayerIndex,
  board,
  turnNumber,
  tileStats,
  isGameOver,
  className,
}: ScoreboardProps) {
  const { t } = useTranslations();
  return (
    <HudPanel className={`scoreboard ${className ?? ""}`} title={t("hud.scores")}>
      <ul>
        {players.map((player, index) => {
          const current = index === currentPlayerIndex && !isGameOver;
          return (
            <li key={player.id} aria-current={current}>
              <span className="scoreboard-dot" style={{ backgroundColor: player.color }} />
              <span className="scoreboard-name">
                {player.name}
                {player.isAI && <Bot size={13} aria-label="AI" className="shrink-0 opacity-70" />}
              </span>
              <span className="scoreboard-score">{player.score}</span>
              <span className="scoreboard-meta">
                {current && player.isAI ? (
                  <span className="scoreboard-thinking">{t("hud.thinking")}</span>
                ) : (
                  player.isAI && <span className="capitalize">{player.aiDifficulty || "medium"}</span>
                )}
                <FollowerDetails breakdown={getFollowerBreakdown(player.id, player.followers, board)} />
              </span>
            </li>
          );
        })}
      </ul>
      <div className="scoreboard-footer">
        <span>{t("hud.turn", { turn: turnNumber })}</span>
        <span>{t("hud.tilesPlaced", { placed: tileStats.placed, total: tileStats.total })}</span>
        <span>{t("hud.remaining", { count: tileStats.remaining })}</span>
      </div>
    </HudPanel>
  );
}

export default Scoreboard;
