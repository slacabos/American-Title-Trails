import { afterEach, describe, expect, it } from "vitest";
import { Game, GamePhase } from "@/game";
import type { PlayerDefinition } from "@/types";
import { clearSavedGame, readSavedGame, restoreGame, saveGame } from "@/persistence/savedGame";

const players: PlayerDefinition[] = [
  { id: "ai1", name: "AI 1", isAI: true, aiDifficulty: "medium", color: "#437eaf" },
  { id: "ai2", name: "AI 2", isAI: true, aiDifficulty: "easy", color: "#d76543" },
  { id: "ai3", name: "AI 3", isAI: true, aiDifficulty: "medium", color: "#5b8c4a" },
];
const SEED = 4242;

/** Everything a player can see or the rules depend on. */
function snapshot(game: Game) {
  const state = game.getState();
  return {
    players: state.players.map(({ id, score, followers }) => ({ id, score, followers })),
    scoreBreakdown: state.scoreBreakdown,
    tiles: [...state.board.getAllTiles()].map(([key, { tile }]) => `${key}:${tile.id}:${tile.orientation}`).sort(),
    claims: state.board.getFeatureClaims(),
    phase: state.phase,
    currentPlayerIndex: state.currentPlayerIndex,
    turnNumber: state.turnNumber,
    currentTile: state.currentTile && `${state.currentTile.id}:${state.currentTile.orientation}`,
    deck: state.tileDeck.map((tile) => tile.id),
    isGameOver: state.isGameOver,
    winner: state.winner,
  };
}

/** Plays AI moves until `stop` holds or the game ends. */
function playUntil(game: Game, stop: (game: Game) => boolean = () => false) {
  for (let step = 0; step < 1000 && !game.getState().isGameOver && !stop(game); step++) game.processAITurn();
}

afterEach(() => localStorage.clear());

describe("game replay", () => {
  it("rebuilds a finished game from its seed and moves", () => {
    const game = new Game(players, { seed: SEED });
    playUntil(game);
    expect(game.getState().isGameOver).toBe(true);
    expect(game.getActions().some((action) => action.type === "claim")).toBe(true);

    const replayed = Game.replay(players, SEED, game.getActions());
    expect(replayed).toBeDefined();
    expect(snapshot(replayed!)).toEqual(snapshot(game));
  });

  it("rebuilds a game in the middle of a claim", () => {
    const game = new Game(players, { seed: SEED });
    playUntil(game, (g) => g.getState().turnNumber > 20 && g.getState().phase === GamePhase.CLAIM_FEATURE);
    expect(game.getState().phase).toBe(GamePhase.CLAIM_FEATURE);

    const replayed = Game.replay(players, SEED, game.getActions())!;
    expect(snapshot(replayed)).toEqual(snapshot(game));
    expect(replayed.getClaimableFeaturesForCurrentTurn()).toEqual(game.getClaimableFeaturesForCurrentTurn());

    // Both carry on identically when given the same moves.
    playUntil(game);
    const finished = Game.replay(players, SEED, game.getActions())!;
    expect(snapshot(finished)).toEqual(snapshot(game));
  });

  it("records a human's rotation as the placed orientation", () => {
    const game = new Game([{ ...players[0], isAI: false }, players[1]], { seed: SEED });
    const spot = () => game.getValidPlacements()[0];
    for (let turn = 0; turn < 4 && !spot(); turn++) game.rotateTileClockwise();
    game.rotateTile(4); // a full turn changes nothing
    const orientation = game.getState().currentTile!.orientation;
    expect(game.placeTile(spot()).success).toBe(true);
    expect(game.getActions()).toEqual([{ type: "place", position: expect.any(Object), orientation }]);
    expect(snapshot(Game.replay(game.getState().players, SEED, game.getActions())!)).toEqual(snapshot(game));
  });

  it("rejects moves that no longer apply", () => {
    expect(Game.replay(players, SEED, [{ type: "skip" }])).toBeUndefined();
    expect(Game.replay(players, SEED, [{ type: "place", position: { x: 40, y: 40 }, orientation: 0 }])).toBeUndefined();
  });
});

describe("saved game", () => {
  const save = (game: Game) =>
    saveGame({
      seed: SEED,
      players,
      actions: [...game.getActions()],
      log: [{ id: 3, time: "10:00", message: "hello" }],
      turnNumber: game.getState().turnNumber,
    });

  it("round-trips through storage and restores the same game", () => {
    const game = new Game(players, { seed: SEED });
    playUntil(game, (g) => g.getState().turnNumber > 8);
    save(game);

    const saved = readSavedGame()!;
    expect(saved).toMatchObject({ version: 1, seed: SEED, players, turnNumber: game.getState().turnNumber });
    expect(saved.log).toEqual([{ id: 3, time: "10:00", message: "hello" }]);
    expect(snapshot(restoreGame(saved)!)).toEqual(snapshot(game));
  });

  it("drops unreadable saves", () => {
    localStorage.setItem("american-tile-trails.save", "{not json");
    expect(readSavedGame()).toBeUndefined();
    expect(localStorage.getItem("american-tile-trails.save")).toBeNull();

    localStorage.setItem("american-tile-trails.save", JSON.stringify({ version: 99 }));
    expect(readSavedGame()).toBeUndefined();
    expect(localStorage.getItem("american-tile-trails.save")).toBeNull();
  });

  it("clears a save whose moves no longer replay", () => {
    const game = new Game(players, { seed: SEED });
    playUntil(game, (g) => g.getState().turnNumber > 3);
    save(game);
    const saved = readSavedGame()!;
    const broken = { ...saved, actions: [...saved.actions, { type: "skip" as const }, { type: "skip" as const }] };
    expect(restoreGame(broken)).toBeUndefined();
    expect(readSavedGame()).toBeUndefined();
  });

  it("clears on request", () => {
    save(new Game(players, { seed: SEED }));
    clearSavedGame();
    expect(readSavedGame()).toBeUndefined();
  });
});
