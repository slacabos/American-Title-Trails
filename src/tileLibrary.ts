import { Tile } from "./tile";
import { CostcoZoneDefinition, Direction, TileDefinition } from "./types";

const createZone = (
  id: string,
  edges: Array<Direction | "center">,
  polygon: Array<[number, number]>,
  pennants = 0
): CostcoZoneDefinition => {
  const zone: CostcoZoneDefinition = {
    id,
    edges,
    polygon: polygon.map(([x, y]) => ({ x, y })),
  };

  if (pennants > 0) {
    zone.pennants = pennants;
  }

  return zone;
};

const TILE_LIBRARY: TileDefinition[] = [
  {
    id: "starter-crossroads",
    name: "Costco Welcome Plaza",
    isStart: true,
    edges: { north: "costco", east: "road", south: "field", west: "road" },
    center: "field",
    roadConnections: [["west", "east"]],
    costcoZones: [
      createZone(
        "plaza",
        ["north"],
        [
          [0.12, 0.08],
          [0.88, 0.08],
          [0.82, 0.28],
          [0.5, 0.32],
          [0.18, 0.28],
        ],
        1
      ),
    ],
  },
  {
    id: "straight-road",
    name: "Desert Highway",
    edges: { north: "road", east: "field", south: "road", west: "field" },
    center: "field",
    roadConnections: [["north", "south"]],
    costcoZones: [],
  },
  {
    id: "curve-road",
    name: "Scenic Byway Curve",
    edges: { north: "road", east: "road", south: "field", west: "field" },
    center: "field",
    roadConnections: [["north", "east"]],
    costcoZones: [],
  },
  {
    id: "road-end",
    name: "Dead End Street",
    edges: { north: "road", east: "field", south: "field", west: "field" },
    center: "field",
    roadConnections: [["north", "center"]],
    costcoZones: [],
  },
  {
    id: "three-way-road",
    name: "Urban Cloverleaf",
    edges: { north: "road", east: "road", south: "field", west: "road" },
    center: "road",
    roadConnections: [
      ["north", "center"],
      ["east", "center"],
      ["west", "center"],
    ],
    costcoZones: [],
  },
  {
    id: "costco-straight",
    name: "Costco Logistics Row",
    edges: { north: "costco", east: "field", south: "costco", west: "field" },
    center: "costco",
    roadConnections: [],
    costcoZones: [
      createZone(
        "main_hall",
        ["north", "south", "center"],
        [
          [0.2, 0.08],
          [0.8, 0.08],
          [0.88, 0.5],
          [0.8, 0.92],
          [0.2, 0.92],
          [0.12, 0.5],
        ],
        1
      ),
    ],
  },
  {
    id: "costco-corner",
    name: "Costco Distribution Corner",
    edges: { north: "costco", east: "costco", south: "field", west: "field" },
    center: "costco",
    roadConnections: [],
    costcoZones: [
      createZone(
        "corner",
        ["north", "east", "center"],
        [
          [0.1, 0.12],
          [0.78, 0.08],
          [0.92, 0.22],
          [0.92, 0.78],
          [0.6, 0.6],
          [0.12, 0.62],
        ],
        1
      ),
    ],
  },
  {
    id: "costco-road",
    name: "Costco Exit Ramp",
    edges: { north: "costco", east: "costco", south: "road", west: "field" },
    center: "mixed",
    roadConnections: [["south", "center"]],
    costcoZones: [
      createZone(
        "loading_bay",
        ["north", "center"],
        [
          [0.18, 0.08],
          [0.78, 0.08],
          [0.74, 0.32],
          [0.42, 0.42],
          [0.2, 0.32],
        ]
      ),
      createZone(
        "gas_station",
        ["east"],
        [
          [0.82, 0.18],
          [0.94, 0.3],
          [0.94, 0.72],
          [0.82, 0.82],
          [0.7, 0.5],
        ],
        1
      ),
    ],
  },
  {
    id: "costco-cap",
    name: "Costco Cul-de-sac",
    edges: { north: "costco", east: "field", south: "field", west: "field" },
    center: "costco",
    roadConnections: [],
    costcoZones: [
      createZone(
        "culdesac",
        ["north", "center"],
        [
          [0.2, 0.08],
          [0.8, 0.08],
          [0.86, 0.22],
          [0.5, 0.46],
          [0.14, 0.22],
        ]
      ),
    ],
  },
  {
    id: "mcdonalds-abbey",
    name: "Roadside McDonalds",
    edges: { north: "field", east: "field", south: "field", west: "field" },
    center: "mcdonalds",
    roadConnections: [],
    costcoZones: [],
  },
  {
    id: "road-costco-split",
    name: "Downtown Complex",
    edges: { north: "costco", east: "road", south: "road", west: "costco" },
    center: "mixed",
    roadConnections: [["east", "south", "center"]],
    costcoZones: [
      createZone(
        "north_wing",
        ["north", "center"],
        [
          [0.18, 0.08],
          [0.82, 0.08],
          [0.78, 0.28],
          [0.5, 0.38],
          [0.22, 0.28],
        ]
      ),
      createZone(
        "west_annex",
        ["west", "center"],
        [
          [0.08, 0.18],
          [0.26, 0.12],
          [0.34, 0.5],
          [0.26, 0.86],
          [0.08, 0.78],
          [0.18, 0.5],
        ],
        1
      ),
    ],
  },
];

// Add quantity property for deck building
const TILE_QUANTITIES: Record<string, number> = {
  "starter-crossroads": 1,
  "straight-road": 6,
  "curve-road": 6,
  "road-end": 5,
  "three-way-road": 4,
  "costco-straight": 4,
  "costco-corner": 4,
  "costco-road": 3,
  "costco-cap": 2,
  "mcdonalds-abbey": 4,
  "road-costco-split": 3,
};

export const buildDeck = (): Tile[] => {
  const deck: Tile[] = [];
  TILE_LIBRARY.forEach((template) => {
    if (template.isStart) {
      return;
    }
    const quantity = TILE_QUANTITIES[template.id] || 1;
    for (let i = 0; i < quantity; i += 1) {
      deck.push(new Tile(template));
    }
  });
  return deck;
};

export const getStartTile = (): Tile => {
  const template = TILE_LIBRARY.find((tile) => tile.isStart);
  if (!template) {
    throw new Error("No start tile defined in the library.");
  }
  return new Tile(template);
};
