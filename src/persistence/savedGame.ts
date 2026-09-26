import { Game } from "../game";
import type { GameAction, PlayerDefinition } from "../types";
import type { LogEntry } from "../components/hud/ActivityLog";

const STORAGE_KEY = "american-tile-trails.save";
const VERSION = 1;

/** Enough to rebuild an unfinished game: its setup, seed and moves. */
export interface SavedGame {
  version: typeof VERSION;
  savedAt: string;
  seed: number;
  players: PlayerDefinition[];
  actions: GameAction[];
  log: LogEntry[];
  /** Shown on the setup screen without replaying the game. */
  turnNumber: number;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

function isSavedGame(value: unknown): value is SavedGame {
  return (
    isObject(value) &&
    value.version === VERSION &&
    typeof value.savedAt === "string" &&
    Number.isInteger(value.seed) &&
    Number.isInteger(value.turnNumber) &&
    Array.isArray(value.players) &&
    value.players.length >= 2 &&
    value.players.every((player) => isObject(player) && typeof player.name === "string") &&
    Array.isArray(value.actions) &&
    value.actions.every((action) => isObject(action) && typeof action.type === "string") &&
    Array.isArray(value.log)
  );
}

/** The saved game, or undefined when there is none or it can't be read. */
export function readSavedGame(): SavedGame | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (isSavedGame(parsed)) return parsed;
  } catch {
    /* Storage is optional in private browsing; bad JSON is dropped below. */
  }
  clearSavedGame();
  return undefined;
}

export function saveGame(save: Omit<SavedGame, "version" | "savedAt">): void {
  try {
    const record: SavedGame = { version: VERSION, savedAt: new Date().toISOString(), ...save };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* Storage is optional in private browsing. */
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Storage is optional in private browsing. */
  }
}

/** Replays a save. A save that no longer replays is cleared. */
export function restoreGame(save: SavedGame): Game | undefined {
  let game: Game | undefined;
  try {
    game = Game.replay(save.players, save.seed, save.actions);
  } catch {
    game = undefined;
  }
  if (!game || game.getState().isGameOver) {
    clearSavedGame();
    return undefined;
  }
  return game;
}
