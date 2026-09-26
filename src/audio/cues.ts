import type { GameState } from "@/types";
import type { Cue } from "./soundEngine";

/**
 * The numbers the sounds depend on. Taken as values, because the board and
 * players are updated in place between states.
 */
export interface SoundSnapshot {
  tiles: number;
  followers: number[];
  currentPlayerIndex: number;
  currentPlayerIsHuman: boolean;
  isGameOver: boolean;
  completed: "none" | "feature" | "costco";
}

export function soundSnapshot(state: GameState): SoundSnapshot {
  const completed = state.lastCompletedFeatures ?? [];
  return {
    tiles: state.board.getAllTiles().size,
    followers: state.players.map((player) => player.followers),
    currentPlayerIndex: state.currentPlayerIndex,
    currentPlayerIsHuman: !state.players[state.currentPlayerIndex]?.isAI,
    isGameOver: state.isGameOver,
    completed: completed.some((feature) => feature.type === "costco")
      ? "costco"
      : completed.length ? "feature" : "none",
  };
}

export interface ScheduledCue {
  cue: Cue;
  /** Milliseconds after the state change. */
  at: number;
}

/** Gap between a tile landing and the chime for what it completed. */
const CHIME_AFTER_LAND_MS = 150;

/**
 * The sounds for one state change, for every player alike. A first state
 * (a new or resumed game) is silent, and so is a board that lost a tile.
 * `impactMs` is when a placed tile hits the table.
 */
export function soundCues(prev: SoundSnapshot | undefined, next: SoundSnapshot, impactMs: number): ScheduledCue[] {
  if (!prev || next.tiles < prev.tiles) return [];
  const cues: ScheduledCue[] = [];
  const placed = next.tiles > prev.tiles;
  if (placed) {
    cues.push({ cue: "land", at: impactMs });
    if (next.completed !== "none")
      cues.push({ cue: next.completed === "costco" ? "completeCostco" : "complete", at: impactMs + CHIME_AFTER_LAND_MS });
  }
  if (next.followers.some((count, index) => count < (prev.followers[index] ?? count)))
    cues.push({ cue: "claim", at: 0 });

  // Turn and game-over sounds wait for the landing and its chime.
  const settled = placed ? impactMs + (next.completed !== "none" ? CHIME_AFTER_LAND_MS : 0) : 0;
  if (next.isGameOver && !prev.isGameOver) {
    cues.push({ cue: "gameOver", at: settled + 400 });
  } else if (!next.isGameOver && next.currentPlayerIndex !== prev.currentPlayerIndex && next.currentPlayerIsHuman) {
    cues.push({ cue: "yourTurn", at: settled + 250 });
  }
  return cues;
}
