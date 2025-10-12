import { Tile } from "./tile";
import { TileDefinition } from "./types";

const TILE_LIBRARY: TileDefinition[] = [
  {
    id: "starter-crossroads",
    name: "Route 66 Crossroads",
    isStart: true,
    edges: { north: "road", east: "road", south: "road", west: "road" },
    center: "road",
    roadConnections: [
      ["north", "center"],
      ["east", "center"],
      ["south", "center"],
      ["west", "center"],
    ],
    costcoZones: [],
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
    costcoZones: [["north", "south", "center"]],
  },
  {
    id: "costco-corner",
    name: "Costco Distribution Corner",
    edges: { north: "costco", east: "costco", south: "field", west: "field" },
    center: "costco",
    roadConnections: [],
    costcoZones: [["north", "east", "center"]],
  },
  {
    id: "costco-road",
    name: "Costco Exit Ramp",
    edges: { north: "costco", east: "costco", south: "road", west: "field" },
    center: "mixed",
    roadConnections: [["south", "center"]],
    costcoZones: [["north", "east", "center"]],
  },
  {
    id: "costco-cap",
    name: "Costco Cul-de-sac",
    edges: { north: "costco", east: "field", south: "field", west: "field" },
    center: "costco",
    roadConnections: [],
    costcoZones: [["north", "center"]],
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
      ["north", "center"],
      ["west", "center"],
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
