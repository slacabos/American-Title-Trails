import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { Game, GamePhase } from "../game";
import { Board } from "../board";
import { Tile } from "../tile";
import { Position, TileDefinition } from "../types";

const { buildDeckMock, getStartTileMock } = vi.hoisted(() => ({
  buildDeckMock: vi.fn(),
  getStartTileMock: vi.fn(),
})) as { buildDeckMock: Mock; getStartTileMock: Mock };

vi.mock("../tileLibrary", () => ({
  buildDeck: buildDeckMock,
  getStartTile: getStartTileMock,
}));

const createTile = (definition: Partial<TileDefinition>): Tile =>
  new Tile({
    id: definition.id ?? "tile",
    name: definition.name ?? "Tile",
    edges: definition.edges ?? {
      north: "field",
      east: "field",
      south: "field",
      west: "field",
    },
    center: definition.center ?? "field",
    roadConnections: definition.roadConnections ?? [],
    costcoZones: definition.costcoZones ?? [],
    isStart: definition.isStart ?? false,
  });

describe("Game lifecycle", () => {
  beforeEach(() => {
    buildDeckMock.mockReset();
    getStartTileMock.mockReset();
  });

  it("initializes the board with a starting tile and draws the first tile", () => {
    const startTile = createTile({ id: "start" });
    const deckTile = createTile({ id: "deck" });

    getStartTileMock.mockReturnValue(startTile);
    buildDeckMock.mockReturnValue([deckTile]);

    const game = new Game([
      { id: "player-1", name: "Alice", followers: 3, color: "#ff0000" },
    ]);

    const state = game.getState();
    expect(state.board.getTile({ x: 0, y: 0 })).toBeDefined();
    expect(state.currentTile?.id).toBe("deck");
    expect(state.tileDeck).toHaveLength(0);
  });

  it("scores completed features returned by the board", () => {
    const startTile = createTile({ id: "start" });
    const deckTile = createTile({ id: "deck" });

    getStartTileMock.mockReturnValue(startTile);
    buildDeckMock.mockReturnValue([deckTile]);

    const game = new Game([
      { id: "player-1", name: "Alice" },
    ]);

    const state = (game as any).state;
    const board = state.board as Board;

    vi.spyOn(board, "canPlace").mockReturnValue(true);
    vi.spyOn(game as any, "getClaimableFeatures").mockReturnValue([]);
    vi.spyOn(board, "returnFollowersFromCompletedFeatures").mockImplementation(() => {});

    const completedFeature = {
      type: "road" as const,
      tiles: new Set(["0,0", "1,0"]),
      edges: new Set(["0,0:east", "1,0:west"]),
      pennants: 0,
      isComplete: true,
      claimedBy: ["player-1"],
      points: 4,
    };

    vi.spyOn(board, "placeTile").mockImplementation(() => ({
      completed: [completedFeature],
    }));

    const result = game.placeTile({ x: 1, y: 0 });
    expect(result.success).toBe(true);
    expect(game.getState().players[0].score).toBe(4);
    expect(game.getState().discardPile).toHaveLength(1);
  });

  it("allows claiming features when in the claim phase", () => {
    const startTile = createTile({ id: "start" });
    const deckTile = createTile({
      id: "road", 
      edges: {
        north: "road",
        east: "field",
        south: "field",
        west: "field",
      },
      roadConnections: [["north", "center"]],
    });

    getStartTileMock.mockReturnValue(startTile);
    buildDeckMock.mockReturnValue([deckTile]);

    const game = new Game([
      { id: "player-1", name: "Alice" },
    ]);

    const state = (game as any).state;
    const board = state.board as Board;

    vi.spyOn(board, "canPlace").mockReturnValue(true);
    vi.spyOn(board, "returnFollowersFromCompletedFeatures").mockImplementation(() => {});
    vi.spyOn(board, "placeTile").mockImplementation((tile: Tile, position: Position) => {
      board.tiles.set(`${position.x},${position.y}`, { position, tile });
      return { completed: [] };
    });

    const claimableFeature = { type: "road", identifier: "north" } as const;
    vi.spyOn(game as any, "getClaimableFeatures").mockReturnValue([claimableFeature]);
    const claimSpy = vi.spyOn(board, "claimFeature").mockReturnValue({
      edge: "0,0:north",
      type: "road",
      players: ["player-1"],
    });

    const placement = game.placeTile({ x: 0, y: 1 });
    expect(placement.success).toBe(true);
    expect((game as any).state.phase).toBe(GamePhase.CLAIM_FEATURE);

    const claimed = game.claimFeature("road", "north");
    expect(claimed).toBe(true);
    expect(claimSpy).toHaveBeenCalledWith("road", { x: 0, y: 1 }, "north", "player-1");
    expect(game.getState().players[0].followers).toBe(6);
  });
});
