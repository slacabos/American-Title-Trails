import { describe, expect, it } from "vitest";
import { Board } from "@/board";
import { FeatureAnalyzer } from "@/ai/evaluators/FeatureAnalyzer";
import { StrategicAI, ExpertAI } from "@/ai/StrategicAI";
import { Game } from "@/game";
import { Tile } from "@/tile";
import { buildDeck } from "@/tileLibrary";
import { getRiverLake, getRiverSource, RIVER_TILES } from "@/riverLibrary";
import { riverPlacementError } from "@/riverRules";
import { DIRECTIONS } from "@/directions";
import { ScoreManager } from "@/managers/ScoreManager";
import { GamePhase, type AIDifficulty, type PlayerState } from "@/types";
import { riverPath, nearRiver, restaurantPosition } from "@/rendering/riverLayout";
import { canonicalTile, PORTALS, zonePolygon, insidePolygon } from "@/rendering/tileLayout";
import { warehouseFootprint } from "@/rendering/warehouseLayout";

const byId = (id: string) => new Tile(RIVER_TILES.find(tile => tile.id === id)!);
const players = [{ id: "one", name: "One" }, { id: "two", name: "Two" }];
function placeNext(game: Game) {
  for (let turns = 0; turns < 4; turns++) {
    const position = game.getValidPlacements()[0];
    if (position) { expect(game.placeTile(position).success).toBe(true); return; }
    game.rotateTileClockwise();
  }
  throw new Error(`No legal placement for ${game.getState().currentTile?.id}`);
}

describe("River opening", () => {
  it("uses all twelve C3 tiles, a preplaced source, and a last lake before the unchanged land deck", () => {
    const game = new Game(players, { seed: 41 });
    expect(RIVER_TILES).toHaveLength(12);
    expect(new Set(RIVER_TILES.map(tile => tile.id)).size).toBe(12);
    expect(game.getState().board.getTile({ x: 0, y: 0 })?.tile.river?.kind).toBe("source");
    expect(game.getState().board.getFeatureClaims()).toEqual([]);
    expect(game.getState().tileDeck.length).toBe(buildDeck().length + 10);
    for (let i = 0; i < 11; i++) {
      expect(game.getState().drawStage).toBe("river");
      expect(game.getState().currentTile?.river?.kind).toBe(i === 10 ? "lake" : "segment");
      expect(game.getState().currentPlayerIndex).toBe(i % 2);
      placeNext(game);
      expect(game.claimFeature("river")).toBe(false);
      game.skipClaim();
    }
    expect(game.getState().drawStage).toBe("land");
    expect(game.getState().currentPlayerIndex).toBe(1);
    expect(game.getState().currentTile?.river).toBeUndefined();
    expect(game.getState().board.getAllTiles().size).toBe(12);
    expect(game.getState().tileDeck.length).toBe(buildDeck().length - 1);
    expect(game.getState().players.map(player => player.score)).toEqual([0, 0]);
  });

  it("shuffles repeatably without mixing land tiles into the river", () => {
    const order = (seed: number) => {
      const state = new Game(players, { seed }).getState();
      return [state.currentTile!.id, ...[...state.tileDeck].reverse().map(tile => tile.id)];
    };
    expect(order(17)).toEqual(order(17));
    expect(order(17)).not.toEqual(order(18));
    expect(order(17).slice(0, 11).every(id => id.startsWith("river-"))).toBe(true);
  });

  it("matches river portals, excludes disconnected water and land, and rejects both forbidden bends", () => {
    const board = new Board();
    board.placeTile(getRiverSource(), { x: -3, y: -3 });
    const bend = byId("river-bend"); // N to W: south-flow turns right.
    expect(board.canPlace(bend, { x: -3, y: -2 })).toBe(true);
    expect(board.canPlace(bend, { x: -4, y: -3 })).toBe(false);
    expect(board.canPlace(buildDeck()[0], { x: -4, y: -3 })).toBe(false);
    board.placeTile(bend, { x: -3, y: -2 });
    // Incoming east, outgoing south turns left and is allowed.
    expect(board.canPlace(byId("river-garden-bend"), { x: -4, y: -2 })).toBe(true);
    const backwards = bend.rotate(1); // Incoming east, outgoing north.
    expect(board.canPlace(backwards, { x: -4, y: -2 })).toBe(false);
    expect(riverPlacementError(board.tiles, backwards, { x: -4, y: -2 })).toBe("riverBackwards");
    board.placeTile(byId("river-garden-bend"), { x: -4, y: -2 });
    // South-flow to east is another left turn immediately after the last one.
    expect(riverPlacementError(board.tiles, bend.rotate(1), { x: -4, y: -1 })).toBe("riverUTurn");
    expect(board.canPlace(byId("river-straight"), { x: -4, y: -1 })).toBe(true);
    expect(board.canPlace(getRiverLake(), { x: -4, y: -1 })).toBe(true);
  });

  it.each(RIVER_TILES)("rotates and renders $id with matching water portals and dry building footprints", definition => {
    const tile = new Tile(definition);
    for (let turns = 0; turns < 4; turns++) {
      const rotated = tile.rotate(turns);
      expect(canonicalTile(rotated).river).toEqual(tile.river);
      expect(rotated.clone().fieldSegments).toEqual(rotated.fieldSegments);
      for (const edge of tile.river!.edges) expect(rotated.getEdge(DIRECTIONS[(DIRECTIONS.indexOf(edge) + turns) % 4])).toBe("river");
      const path = riverPath(rotated);
      expect(path.length).toBeGreaterThan(2);
      for (const edge of rotated.river!.edges) expect(path.some(point => Math.hypot(point[0] - PORTALS[edge][0], point[1] - PORTALS[edge][1]) < 1e-8)).toBe(true);
      for (let i = 0; i < tile.costcoZones.length; i++) {
        const roof = warehouseFootprint(rotated, i);
        const paving = zonePolygon(rotated, i);
        for (const [x, z] of roof) {
          const center = roof.reduce((sum, p) => [sum[0] + p[0] / roof.length, sum[1] + p[1] / roof.length], [0, 0]);
          expect(insidePolygon([x * 0.999 + center[0] * 0.001, z * 0.999 + center[1] * 0.001], paving)).toBe(true);
          expect(nearRiver(rotated, [x, z])).toBe(false);
        }
      }
      if (rotated.hasMcDonalds) expect(nearRiver(rotated, restaurantPosition(rotated), 0.09)).toBe(false);
    }
  });

  it("keeps bridge banks separate while fields can connect around the lake", () => {
    const board = new Board();
    const bridge = byId("river-road-bridge");
    board.tiles.set("0,0", { tile: bridge, position: { x: 0, y: 0 } });
    for (const field of bridge.fieldSegments) {
      expect(board.traceFieldFeature({ x: 0, y: 0 }, field, new Set()).edges.size).toBe(1);
    }
    const lake = getRiverLake();
    board.tiles.set("0,1", { tile: lake, position: { x: 0, y: 1 } });
    const connected = board.traceFieldFeature({ x: 0, y: 0 }, bridge.fieldSegments[2], new Set());
    expect(connected.edges.has("0,0:se")).toBe(true);
    expect(connected.edges.has("0,0:nw")).toBe(false);
  });

  it("counts only Costcos touching the farmer's bank and distinguishes features on the same tiles", () => {
    const board = new Board();
    const dual = byId("river-dual-costco");
    board.tiles.set("0,0", { tile: dual, position: { x: 0, y: 0 } });
    const cap = new Tile({ id: "cap", name: "Cap", center: "field",
      edges: { north: "field", east: "field", south: "costco", west: "field" }, roadConnections: [],
      costcoZones: [{ id: "cap", segments: ["south"] }], fieldSegments: [],
    });
    board.tiles.set("0,-1", { tile: cap, position: { x: 0, y: -1 } });
    const north = board.traceFieldFeature({ x: 0, y: 0 }, dual.fieldSegments[0], new Set());
    const south = board.traceFieldFeature({ x: 0, y: 0 }, dual.fieldSegments[1], new Set());
    expect(board.findAdjacentCostcos(north).size).toBe(1);
    expect(board.findAdjacentCostcos(south).size).toBe(0);
    const analyzer = new FeatureAnalyzer(board);
    expect(analyzer.estimateFieldValue({ x: 0, y: 0 }, "field_0").currentPoints).toBe(3);
    expect(analyzer.estimateFieldValue({ x: 0, y: 0 }, "field_1").currentPoints).toBe(0);
    board.claimFeature("field", { x: 0, y: 0 }, "field_0", "one");
    board.claimFeature("field", { x: 0, y: 0 }, "field_1", "two");
    const scores: PlayerState[] = players.map(p => ({ ...p, isAI: false, color: "red", score: 0, followers: 6 }));
    new ScoreManager().calculateFinalScores(scores, board);
    expect(scores.map(p => p.score)).toEqual([3, 0]);
    board.tiles.set("0,1", { tile: cap.rotate(2), position: { x: 0, y: 1 } });
    scores.forEach(p => { p.score = 0; });
    new ScoreManager().calculateFinalScores(scores, board);
    expect(scores.map(p => p.score)).toEqual([3, 3]);
  });

  it("traces both zones when opposite-bank Costcos reconnect around the end of a river", () => {
    const board = new Board();
    const dual = byId("river-dual-costco");
    board.tiles.set("0,0", { tile: dual, position: { x: 0, y: 0 } });
    const cap = (id: string, segments: (typeof DIRECTIONS)[number][]) => new Tile({
      id, name: id, center: "costco", edges: { north: "field", east: "field", south: "field", west: "field",
        ...Object.fromEntries(segments.map(edge => [edge, "costco"])) },
      roadConnections: [], costcoZones: [{ id, segments }],
    });
    // A custom end tile models a store wrapping around the water's end.
    const aroundLake = new Tile({ id: "lake-store", name: "Lake store", center: "costco",
      edges: { north: "costco", east: "field", south: "costco", west: "river" },
      river: { kind: "lake", edges: ["west"] }, roadConnections: [],
      costcoZones: [{ id: "around-lake", segments: ["north", "south"], hasPennant: true }],
    });
    const records = [
      { tile: cap("top-left", ["south", "east"]), position: { x: 0, y: -1 } },
      { tile: cap("top-right", ["south", "west"]), position: { x: 1, y: -1 } },
      { tile: aroundLake, position: { x: 1, y: 0 } },
      { tile: cap("bottom-right", ["north", "west"]), position: { x: 1, y: 1 } },
      { tile: cap("bottom-left", ["north", "east"]), position: { x: 0, y: 1 } },
    ];
    for (const record of records) board.tiles.set(`${record.position.x},${record.position.y}`, record);
    const feature = board.traceCostcoFeature({ x: 0, y: 0 }, dual.costcoZones[0], new Set());
    expect(feature.edges.has("0,0:south")).toBe(true);
    expect(feature.tiles.size).toBe(6);
    expect(feature.pennants).toBe(1);
    expect(board.isCostcoComplete(feature)).toBe(true);
  });

  it("scores a shared incomplete bridge road once per majority holder", () => {
    const board = new Board();
    const end = buildDeck().find(tile => tile.id === "road-end")!.rotate(1);
    const straight = buildDeck().find(tile => tile.id === "straight-road")!.rotate(1);
    board.tiles.set("-1,0", { tile: end, position: { x: -1, y: 0 } });
    board.tiles.set("1,0", { tile: straight, position: { x: 1, y: 0 } });
    board.claimFeature("road", { x: -1, y: 0 }, "road_0", "one");
    board.claimFeature("road", { x: 1, y: 0 }, "road_0", "two");
    board.tiles.set("0,0", { tile: byId("river-road-bridge"), position: { x: 0, y: 0 } });
    const scores: PlayerState[] = players.map(p => ({ ...p, isAI: false, color: "red", score: 0, followers: 6 }));
    new ScoreManager().calculateFinalScores(scores, board);
    expect(scores.map(p => p.score)).toEqual([3, 3]);
  });

  it.each([false, true])("scores only after claiming and returns completed followers (already claimed: %s)", alreadyClaimed => {
    const game = new Game(players, { seed: 41 });
    for (let i = 0; i < 10; i++) { placeNext(game); game.skipClaim(); }
    const end = buildDeck().find(tile => tile.id === "road-end")!;
    // Prepare the following land draw through the public deck, then finish the lake turn.
    const deck = game.getState().tileDeck;
    deck.splice(0, deck.length, end, end);
    placeNext(game);
    game.skipClaim();
    const state = game.getState();
    const board = state.board;
    board.getAllTiles().clear();
    board.placeTile(end.rotate(2), { x: 0, y: -1 });
    const current = game.getCurrentPlayer();
    if (alreadyClaimed) {
      board.claimFeature("road", { x: 0, y: -1 }, "road_0", current.id);
      current.followers--;
      const preview = game.previewTilePlacement({ x: 0, y: 0 });
      expect(preview?.completed[0].claimedBy).toEqual([current.id]);
      const context = {
        board, currentTile: end, currentPlayer: current, allPlayers: state.players,
        validPlacements: [{ x: 0, y: 0 }], gameState: game.getState(), claimableFeatures: [],
      };
      const expert = new ExpertAI({ rng: () => 0 });
      expect(expert.evaluateTilePlacements(context)[0].score).toBeGreaterThan(0);
      const opponent = state.players.find(player => player.id !== current.id)!;
      expect(expert.evaluateTilePlacements({ ...context, currentPlayer: opponent })[0].score).toBeLessThan(0);
      // Evaluating future scoring must leave the live claim and supply intact.
      expect(current.score).toBe(0);
      expect(current.followers).toBe(6);
      expect(board.getAllTiles().size).toBe(1);
      expect(board.getFeatureClaims()).toHaveLength(1);
    }
    expect(game.placeTile({ x: 0, y: 0 }).success).toBe(true);
    expect(game.getState().phase).toBe(GamePhase.CLAIM_FEATURE);
    expect(current.score).toBe(0);
    if (alreadyClaimed) {
      expect(game.claimFeature("road", "road_0")).toBe(false);
      expect(current.followers).toBe(6);
      game.skipClaim();
    } else {
      // Even its last follower is safe for an AI to use on this completed road.
      const decision = new StrategicAI().evaluateMeeplePlacement({
        board, currentTile: end, currentPlayer: { ...current, followers: 1 },
        allPlayers: state.players, validPlacements: [], gameState: game.getState(),
        claimableFeatures: game.getClaimableFeaturesForCurrentTurn(),
      }, { x: 0, y: 0 });
      expect(decision).toMatchObject({ type: "road", shouldClaim: true });
      expect(game.claimFeature("road", "road_0")).toBe(true);
    }
    expect(current.score).toBe(2);
    expect(current.followers).toBe(7);
    expect(board.getFeatureClaims()).toEqual([]);
    expect(game.getState().phase).toBe(GamePhase.PLACE_TILE);
  });

  it("completes an existing lakeside restaurant when the last surrounding land tile arrives", () => {
    const board = new Board();
    const lake = getRiverLake();
    board.tiles.set("0,0", { tile: lake, position: { x: 0, y: 0 } });
    const grass = new Tile({ id: "grass", name: "Grass", center: "field", edges: {
      north: "field", east: "field", south: "field", west: "field",
    }, roadConnections: [], costcoZones: [] });
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) {
      if ((x === 0 && y === 0) || (x === 1 && y === 1)) continue;
      board.tiles.set(`${x},${y}`, { tile: grass, position: { x, y } });
    }
    expect(board.claimFeature("mcdonalds", { x: 0, y: 0 }, undefined, "one")).toBeTruthy();
    const completed = board.placeTile(grass, { x: 1, y: 1 }).completed;
    expect(completed).toContainEqual(expect.objectContaining({ type: "mcdonalds", points: 9, claimedBy: ["one"] }));
  });

  it.each(["easy", "medium", "hard", "expert"] as AIDifficulty[])("finishes seeded games with %s AI without losing river tiles", difficulty => {
    for (let seed = 1; seed <= 8; seed++) {
      const game = new Game(players.map(p => ({ ...p, isAI: true, aiDifficulty: difficulty })), { seed });
      let steps = 0;
      while (!game.getState().isGameOver && steps++ < 200) game.processAITurn();
      const state = game.getState();
      expect(state.isGameOver).toBe(true);
      expect([...state.board.getAllTiles().values()].filter(record => record.tile.river)).toHaveLength(12);
      expect(state.players.every(p => p.followers >= 0 && p.followers <= 7)).toBe(true);
    }
  }, 30000);
});
