import { buildDeck } from "@/tileLibrary";
import type { TileRecord } from "@/types";

const tiles = buildDeck();
const tile = (id: string, x: number, y: number, rotation = 0): TileRecord => ({
  tile: tiles.find((candidate) => candidate.id === id)!.rotate(rotation),
  position: { x, y },
});

export const warehouseExamples = [
  {
    name: "Two adjoining warehouse sections",
    records: [tile("costco-straight", 0, 0, 1), tile("costco-straight", 1, 0, 1)],
    complexes: 1,
  },
  {
    name: "An L-shaped warehouse",
    records: [tile("costco-straight", 0, 0, 1), tile("costco-corner", 1, 0, 2), tile("costco-straight", 1, 1)],
    complexes: 1,
  },
  {
    name: "A four-tile warehouse with a courtyard",
    records: [tile("costco-corner", 0, 0, 1), tile("costco-corner", 1, 0, 2), tile("costco-corner", 0, 1), tile("costco-corner", 1, 1, 3)],
    complexes: 1,
  },
  {
    name: "Separate Costco zones stay separate",
    records: [tile("costco-separate-dual", 0, 0), tile("costco-cap", 0, -1, 2), tile("costco-cap", 0, 1)],
    complexes: 2,
  },
  {
    name: "A connected warehouse and gas station",
    records: [tile("costco-road", 0, 0), tile("costco-straight", 0, -1), tile("costco-cap", 1, 0, 3)],
    complexes: 1,
  },
];
