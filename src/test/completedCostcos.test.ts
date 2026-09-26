import { describe, expect, it } from "vitest";
import { Board } from "@/board";
import { Tile } from "@/tile";
import type { Direction } from "@/types";
import { completedCostcos } from "@/rendering/completedCostcos";

const cap = (id: string, edge: Direction) =>
  new Tile({
    id,
    name: id,
    edges: {
      north: edge === "north" ? "costco" : "field",
      east: edge === "east" ? "costco" : "field",
      south: edge === "south" ? "costco" : "field",
      west: edge === "west" ? "costco" : "field",
    },
    center: "field",
    roadConnections: [],
    costcoZones: [{ id: "shop", segments: [edge] }],
  });

describe("completed Costco board markers", () => {
  it("uses one marker for a connected Costco and updates when it closes", () => {
    const board = new Board();
    board.placeTile(cap("left", "east"), { x: 0, y: 0 });
    expect(completedCostcos(board)).toEqual([]);

    board.placeTile(cap("right", "west"), { x: 1, y: 0 });
    const markers = completedCostcos(board);
    expect(markers).toHaveLength(1);
    expect(markers[0].zones).toHaveLength(2);
    expect(markers[0].points).toBe(4);
    expect(markers[0].center.x).toBeCloseTo(0.5);
  });

  it("keeps separate completed zones on one tile distinct", () => {
    const board = new Board();
    const dual = new Tile({
      id: "dual",
      name: "dual",
      edges: { north: "costco", east: "field", south: "costco", west: "field" },
      center: "field",
      roadConnections: [],
      costcoZones: [
        { id: "top", segments: ["north"] },
        { id: "bottom", segments: ["south"] },
      ],
    });
    board.placeTile(dual, { x: 0, y: 0 });
    board.placeTile(cap("top", "south"), { x: 0, y: -1 });
    board.placeTile(cap("bottom", "north"), { x: 0, y: 1 });

    const markers = completedCostcos(board);
    expect(markers).toHaveLength(2);
    expect(markers.map((marker) => marker.zones.length)).toEqual([2, 2]);
    expect(markers[0].center.y).not.toBeCloseTo(markers[1].center.y);
  });
});
