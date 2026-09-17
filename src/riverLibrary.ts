import { Tile } from "./tile";
import type { Direction, FieldCorner, TileDefinition } from "./types";

// C3-FA through C3-FL, The World of Carcassonne, page 5 (publisher inventory).
// Cities become Costcos and monasteries become McDonald's; gardens are decorative.
const field = (id: string, corners: FieldCorner[], adjacentCostcoZones: string[] = []) =>
  ({ id, corners, adjacentCostcoZones });
const all: FieldCorner[] = ["nw", "ne", "sw", "se"];
const define = (
  id: string, name: string, edges: Direction[],
  extra: Partial<TileDefinition> = {},
): TileDefinition => ({
  id, name, center: "field", roadConnections: [], costcoZones: [],
  edges: { north: "field", east: "field", south: "field", west: "field",
    ...Object.fromEntries(edges.map(edge => [edge, "river"])) },
  river: { kind: "segment", edges }, ...extra,
});

export const RIVER_TILES: TileDefinition[] = [
  define("river-source", "River Source", ["south"], {
    isStart: true, river: { kind: "source", edges: ["south"] },
    edges: { north: "road", east: "road", south: "river", west: "field" },
    roadConnections: [["north", "east"]],
    fieldSegments: [field("field-0", ["ne"]), field("field-1", ["nw", "sw", "se"])],
  }),
  define("river-costco-bridge", "Riverside Costco Entrance", ["west", "east"], {
    edges: { north: "costco", east: "river", south: "road", west: "river" },
    roadConnections: [["south", "center"]],
    costcoZones: [{ id: "north-store", segments: ["north"] }],
    fieldSegments: all.map((corner, i) => field(`field-${i}`, [corner], i < 2 ? ["north-store"] : [])),
  }),
  define("river-dual-costco", "Opposite Bank Costcos", ["west", "east"], {
    edges: { north: "costco", east: "river", south: "costco", west: "river" },
    costcoZones: [{ id: "north-store", segments: ["north"] }, { id: "south-store", segments: ["south"] }],
    fieldSegments: [field("field-0", ["nw", "ne"], ["north-store"]), field("field-1", ["sw", "se"], ["south-store"])],
  }),
  define("river-straight", "Open River", ["north", "south"], {
    fieldSegments: [field("field-0", ["nw", "sw"]), field("field-1", ["ne", "se"])],
  }),
  define("river-costco-bend", "Costco River Bend", ["west", "south"], {
    edges: { north: "costco", east: "costco", south: "river", west: "river" },
    costcoZones: [{ id: "riverside-store", segments: ["north", "east", "center"] }],
    fieldSegments: [field("field-0", ["sw"]), field("field-1", ["nw", "se"], ["riverside-store"])],
  }),
  define("river-meander", "Meandering River", ["north", "south"], {
    fieldSegments: [field("field-0", ["nw", "sw"]), field("field-1", ["ne", "se"])],
  }),
  define("river-bend", "Woodland River Bend", ["north", "west"], {
    fieldSegments: [field("field-0", ["nw"]), field("field-1", ["ne", "sw", "se"])],
  }),
  define("river-mcdonalds", "Riverside McDonald's", ["west", "east"], {
    center: "mcdonalds",
    edges: { north: "field", east: "river", south: "road", west: "river" },
    roadConnections: [["south", "center"]],
    fieldSegments: [field("field-0", ["nw", "ne"]), field("field-1", ["sw"]), field("field-2", ["se"])],
  }),
  define("river-road-bend", "Riverside Highway Curve", ["east", "south"], {
    edges: { north: "road", east: "river", south: "river", west: "road" },
    roadConnections: [["north", "west"]],
    fieldSegments: [field("field-0", ["nw"]), field("field-1", ["ne", "sw"]), field("field-2", ["se"])],
  }),
  define("river-garden-bend", "Meadow River Bend", ["east", "south"], {
    fieldSegments: [field("field-0", ["se"]), field("field-1", ["nw", "ne", "sw"])],
  }),
  define("river-road-bridge", "River Highway Bridge", ["north", "south"], {
    edges: { north: "river", east: "road", south: "river", west: "road" },
    roadConnections: [["west", "east"]],
    fieldSegments: all.map((corner, i) => field(`field-${i}`, [corner])),
  }),
  define("river-lake", "Lakeside McDonald's", ["north"], {
    center: "mcdonalds", river: { kind: "lake", edges: ["north"] },
    fieldSegments: [field("field-0", all)],
  }),
];

export const getRiverSource = (): Tile => new Tile(RIVER_TILES[0]);
export const getRiverLake = (): Tile => new Tile(RIVER_TILES[11]);
export const buildRiverDeck = (): Tile[] => RIVER_TILES.slice(1, 11).map(definition => new Tile(definition));
