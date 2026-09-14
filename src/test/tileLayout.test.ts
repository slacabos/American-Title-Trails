import { describe, expect, it } from "vitest";
import { buildDeck, getStartTile } from "@/tileLibrary";
import { Game } from "@/game";
import { Board } from "@/board";
import { GamePhase } from "@/types";
import {
  boardSnapshot,
  boardToWorld,
  canonicalTile,
  CORNERS,
  featureAnchor,
  insidePolygon,
  PORTALS,
  resolveClaim,
  roadPath,
  rotatePoint,
  sceneryKey,
  worldToBoard,
  zonePolygon,
} from "@/rendering/tileLayout";
import { DIRECTIONS } from "@/directions";

const tiles = [
  ...new Map(
    [getStartTile(), ...buildDeck()].map((tile) => [tile.id, tile]),
  ).values(),
];
const tileById = (id: string) => tiles.find((tile) => tile.id === id)!;

describe("3D tile layout", () => {
  it("maps negative board coordinates and cell boundaries without truncation errors", () => {
    expect(boardToWorld({ x: -2, y: 3 })).toEqual([-2, 0, 3]);
    expect(worldToBoard(-0.51, -1.51)).toEqual({ x: -1, y: -2 });
    expect(worldToBoard(-0.49, 0.49)).toEqual({ x: 0, y: 0 });
    expect(worldToBoard(0.5, -0.5)).toEqual({ x: 1, y: 0 });
  });

  it.each(tiles.map((tile) => [tile.id, tile] as const))(
    "preserves %s topology through all four visual rotations",
    (_, tile) => {
      for (let turns = 0; turns < 4; turns++) {
        const rotated = tile.rotate(turns);
        expect(canonicalTile(rotated).roadConnections).toEqual(
          tile.roadConnections,
        );
        expect(canonicalTile(rotated).costcoZones).toEqual(tile.costcoZones);
        expect(sceneryKey(rotated)).toBe(sceneryKey(tile));
        for (const [index, direction] of DIRECTIONS.entries()) {
          const destination = DIRECTIONS[(index + turns) % 4];
          rotatePoint(PORTALS[direction], turns).forEach((value, axis) =>
            expect(value).toBeCloseTo(PORTALS[destination][axis]),
          );
          expect(rotated.getEdge(destination)).toBe(tile.getEdge(direction));
        }
        rotated.roadConnections.forEach((road) => {
          const endpoints = road.filter((segment) => segment !== "center");
          const path = roadPath(road);
          expect(path[0]).toEqual(PORTALS[endpoints[0]]);
          expect(path[path.length - 1]).toEqual(
            PORTALS[endpoints[1] ?? "center"],
          );
        });
        rotated.costcoZones.forEach((zone, index) => {
          const polygon = zonePolygon(rotated, index);
          for (const segment of zone.segments.filter(
            (part) => part !== "center",
          )) {
            const [x, y] = PORTALS[segment];
            expect(insidePolygon([x * 0.999, y * 0.999], polygon)).toBe(true);
          }
        });
      }
    },
  );

  it("keeps separate outlets distinct and doesn't create a shared paved center", () => {
    const tile = tileById("costco-separate-dual");
    expect(insidePolygon([0, 0], zonePolygon(tile, 0))).toBe(false);
    expect(insidePolygon([0, 0], zonePolygon(tile, 1))).toBe(false);
    expect(
      featureAnchor(tile, { type: "costco", identifier: "costco_0" })[1],
    ).toBeLessThan(0);
    expect(
      featureAnchor(tile, { type: "costco", identifier: "costco_1" })[1],
    ).toBeGreaterThan(0);
  });

  it("resolves every engine-produced claim after rotation", () => {
    for (const tile of tiles)
      for (let turns = 0; turns < 4; turns++) {
        const rotated = tile.rotate(turns);
        const position = { x: -1, y: 10 };
        const features = [
          ...rotated.roadConnections.map((_, i) => ({
            type: "road" as const,
            identifier: `road_${i}`,
          })),
          ...rotated.costcoZones.map((_, i) => ({
            type: "costco" as const,
            identifier: `costco_${i}`,
          })),
          ...rotated.fieldSegments.map((_, i) => ({
            type: "field" as const,
            identifier: `field_${i}`,
          })),
          ...(rotated.hasMcDonalds
            ? [{ type: "mcdonalds" as const, identifier: undefined }]
            : []),
        ];
        for (const feature of features) {
          const board = new Board();
          board.placeTile(rotated, position);
          const claim = board.claimFeature(
            feature.type,
            position,
            feature.identifier,
            "p1",
          );
          const resolved = resolveClaim(rotated, position, claim);
          expect(resolved?.type).toBe(feature.type);
          expect(resolved?.identifier).toBe(feature.identifier);
          expect(resolveClaim(rotated, { x: -1, y: 1 }, claim)).toBeUndefined();
        }
      }
  });

  it("places farmers on a corner within their field instead of an obstructed centroid", () => {
    const tile = tileById("costco-cap");
    expect(
      featureAnchor(tile, { type: "field", identifier: "field_0" }),
    ).toEqual(CORNERS.nw);
    expect(
      featureAnchor(tile.rotate(1), { type: "field", identifier: "field_0" }),
    ).toEqual(CORNERS.ne);
  });

  it("updates legal placement and claim snapshots despite a stable board reference", () => {
    const game = new Game(
      [
        { id: "p1", name: "One" },
        { id: "p2", name: "Two" },
      ],
      { seed: 17 },
    );
    const before = game.getState();
    while (!boardSnapshot(game.getState()).legal.length)
      game.rotateTileClockwise();
    const legal = boardSnapshot(game.getState()).legal;
    expect(legal.length).toBeGreaterThan(0);
    game.placeTile(legal[0]);
    const after = game.getState();
    expect(after.board).toBe(before.board);
    expect(boardSnapshot(after).tiles.length).toBe(2);
    expect(boardSnapshot(after).canPlace).toBe(false);
    expect(
      boardSnapshot({ ...after, phase: GamePhase.PLACE_TILE, isGameOver: true })
        .legal,
    ).toEqual([]);
    const ai = {
      ...before,
      players: before.players.map((player) => ({ ...player, isAI: true })),
    };
    expect(boardSnapshot(ai).legal).toEqual([]);
  });
});
