import { afterEach, describe, expect, it, vi } from "vitest";
import { Game, GamePhase } from "@/game";
import type { PlayerDefinition } from "@/types";

const humans: PlayerDefinition[] = [
  { id: "a", name: "A", color: "#437eaf" },
  { id: "b", name: "B", color: "#d76543" },
];
const bots: PlayerDefinition[] = humans.map((player) => ({ ...player, isAI: true }));

/** Rotate until the current tile fits somewhere, then place it there. */
function placeAnywhere(game: Game) {
  for (let turn = 0; turn < 4 && game.getValidPlacements().length === 0; turn++) game.rotateTileClockwise();
  return game.placeTile(game.getValidPlacements()[0]);
}

afterEach(() => vi.restoreAllMocks());

describe("game guards", () => {
  it("refuses to place without a current tile or a rotatable tile", () => {
    const game = new Game(humans, { seed: 3 });
    const spot = game.getValidPlacements()[0] ?? { x: 0, y: 1 };
    vi.spyOn(game["tileManager"], "getCurrentTile").mockReturnValueOnce(undefined);
    expect(game.placeTile(spot)).toMatchObject({ success: false, message: "No current tile to place" });
    vi.spyOn(game["tileManager"], "getRotatedCurrentTile").mockReturnValueOnce(undefined);
    expect(game.placeTile(spot)).toMatchObject({ success: false, message: "Failed to rotate tile" });
  });

  it("only offers, claims or skips features during the claim phase", () => {
    const game = new Game(humans, { seed: 3 });
    expect(game.getState().phase).toBe(GamePhase.PLACE_TILE);
    expect(game.getClaimableFeaturesForCurrentTurn()).toEqual([]);
    expect(game.claimFeature("field", "field_0")).toBe(false);
    const turn = game.getState().turnNumber;
    game.skipClaim();
    expect(game.getState().turnNumber).toBe(turn);
  });

  it("refuses a claim when the player has no followers left", () => {
    const game = new Game(humans, { seed: 3 });
    expect(placeAnywhere(game).success).toBe(true);
    expect(game.getState().phase).toBe(GamePhase.CLAIM_FEATURE);
    const [feature] = game.getClaimableFeaturesForCurrentTurn();
    expect(feature).toBeDefined();
    game.getCurrentPlayer().followers = 0;
    expect(game.claimFeature(feature.type, feature.identifier)).toBe(false);
  });

  it("finds nothing to claim when the placed tile cannot be found", () => {
    const game = new Game(humans, { seed: 3 });
    placeAnywhere(game);
    vi.spyOn(game["turnManager"], "getLastPlacedPosition").mockReturnValue(undefined);
    expect(game.getClaimableFeaturesForCurrentTurn()).toEqual([]);
    expect(game.claimFeature("field", "field_0")).toBe(false);
  });

  it("does not play a human's turn", () => {
    const game = new Game(humans, { seed: 3 });
    expect(game.processAITurn()).toBeUndefined();
    expect(game.getState().turnNumber).toBe(1);
  });

  it("an AI with no tile to place waits", () => {
    const game = new Game(bots, { seed: 3 });
    vi.spyOn(game["tileManager"], "getCurrentTile").mockReturnValue(undefined);
    expect(game.processAITurn()).toBeUndefined();
  });

  it("an AI skips claiming when its placed tile cannot be found", () => {
    const game = new Game(bots, { seed: 3 });
    placeAnywhere(game);
    vi.spyOn(game["turnManager"], "getLastPlacedPosition").mockReturnValue(undefined);
    game.processAITurn();
    expect(game.getState().phase).toBe(GamePhase.PLACE_TILE);
  });

  it("an AI discards a tile that fits nowhere", () => {
    const game = new Game(bots, { seed: 3 });
    const remaining = game.getTileStats().remaining;
    vi.spyOn(game.getState().board, "getPlacementCandidates").mockReturnValue([]);
    expect(game.processAITurn()).toBeUndefined();
    expect(game.getTileStats().remaining).toBe(remaining - 1);
  });

  it("the fallback AI places and claims without a strategy", () => {
    const game = new Game(bots, { seed: 3 });
    game["aiStrategies"].clear();
    const placed = game.processAITurn();
    expect(placed).toMatchObject({ type: "placed", result: { success: true } });
    expect(game.getState().phase).toBe(GamePhase.CLAIM_FEATURE);
    const claimed = game.processAITurn();
    expect(claimed?.type).toBe("claimed");
    expect(game.getState().phase).toBe(GamePhase.PLACE_TILE);
  });

  it("the fallback AI skips claiming when it is low on followers", () => {
    const game = new Game(bots, { seed: 3 });
    game["aiStrategies"].clear();
    game.processAITurn();
    game.getCurrentPlayer().followers = 0;
    expect(game.processAITurn()).toEqual({ type: "skipped" });
    expect(game.getState().phase).toBe(GamePhase.PLACE_TILE);
  });

  it("the fallback AI discards a tile that fits nowhere", () => {
    const game = new Game(bots, { seed: 3 });
    game["aiStrategies"].clear();
    const remaining = game.getTileStats().remaining;
    vi.spyOn(game.getState().board, "canPlace").mockReturnValue(false);
    expect(game.processAITurn()).toBeUndefined();
    expect(game.getTileStats().remaining).toBe(remaining - 1);
  });
});
