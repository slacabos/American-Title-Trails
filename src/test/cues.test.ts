import { describe, expect, it } from "vitest";
import { Game, GamePhase } from "@/game";
import { soundCues, soundSnapshot, type SoundSnapshot } from "@/audio/cues";

const IMPACT = 264;
const base: SoundSnapshot = {
  tiles: 5,
  followers: [7, 7],
  currentPlayerIndex: 0,
  currentPlayerIsHuman: true,
  isGameOver: false,
  completed: "none",
};
const cues = (next: Partial<SoundSnapshot>, prev: SoundSnapshot | undefined = base) =>
  soundCues(prev, { ...base, ...next }, IMPACT);

describe("sound cues", () => {
  it("is silent for a new or resumed game, and for a taken-back tile", () => {
    expect(soundCues(undefined, base, IMPACT)).toEqual([]);
    expect(cues({ tiles: 4, currentPlayerIndex: 1 })).toEqual([]);
  });

  it("lands a placed tile at impact and chimes for what it completed", () => {
    expect(cues({ tiles: 6 })).toEqual([{ cue: "land", at: IMPACT }]);
    expect(cues({ tiles: 6, completed: "feature" })).toEqual([
      { cue: "land", at: IMPACT },
      { cue: "complete", at: IMPACT + 150 },
    ]);
    expect(cues({ tiles: 6, completed: "costco" })[1].cue).toBe("completeCostco");
  });

  it("pops when any player puts down a follower, not when followers return", () => {
    expect(cues({ followers: [7, 6] })).toEqual([{ cue: "claim", at: 0 }]);
    expect(cues({ followers: [7, 7] }, { ...base, followers: [5, 7] })).toEqual([]);
  });

  it("rings when the turn passes to a human, after the tile has landed", () => {
    expect(cues({ currentPlayerIndex: 1 })).toEqual([{ cue: "yourTurn", at: 250 }]);
    expect(cues({ tiles: 6, currentPlayerIndex: 1 })).toEqual([
      { cue: "land", at: IMPACT },
      { cue: "yourTurn", at: IMPACT + 250 },
    ]);
    expect(cues({ currentPlayerIndex: 1, currentPlayerIsHuman: false })).toEqual([]);
  });

  it("plays the fanfare once when the game ends, instead of the turn ring", () => {
    expect(cues({ isGameOver: true, currentPlayerIndex: 1 })).toEqual([{ cue: "gameOver", at: 400 }]);
    expect(cues({ isGameOver: true }, { ...base, isGameOver: true })).toEqual([]);
  });

  it("reads values, not the board and players that change in place", () => {
    const game = new Game([{ id: "a", name: "A" }, { id: "b", name: "B" }], { seed: 17 });
    const before = soundSnapshot(game.getState());
    for (let turn = 0; turn < 4 && game.getValidPlacements().length === 0; turn++) game.rotateTileClockwise();
    game.placeTile(game.getValidPlacements()[0]);
    if (game.getState().phase === GamePhase.CLAIM_FEATURE) game.skipClaim();
    const after = soundSnapshot(game.getState());
    expect(before.tiles).toBe(1);
    expect(after.tiles).toBe(2);
    expect(soundCues(before, after, IMPACT).map(({ cue }) => cue)).toEqual(["land", "yourTurn"]);
  });
});
