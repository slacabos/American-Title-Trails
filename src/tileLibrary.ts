import { Tile } from "./tile";
import { TileDefinition } from "./types";

const TILE_LIBRARY: TileDefinition[] = [
  {
    id: "starter-proper",
    name: "Costco Plaza Entrance",
    isStart: true,
    edges: { north: "costco", east: "road", south: "field", west: "road" },
    center: "field",
    roadConnections: [["east", "west"]],
    costcoZones: [
      {
        id: "plaza",
        segments: ["north"],
        hasPennant: false,
        shape: "straight",
      },
    ],
    fieldSegments: [{ id: "field-0", corners: ["sw", "se"] }],
  },
  {
    id: "straight-road",
    name: "Desert Highway",
    edges: { north: "road", east: "field", south: "road", west: "field" },
    center: "field",
    roadConnections: [["north", "south"]],
    costcoZones: [],
    fieldSegments: [
      { id: "field-0", corners: ["nw", "sw"] },
      { id: "field-1", corners: ["ne", "se"] },
    ],
  },
  {
    id: "curve-road",
    name: "Scenic Byway Curve",
    edges: { north: "road", east: "road", south: "field", west: "field" },
    center: "field",
    roadConnections: [["north", "east"]],
    costcoZones: [],
    fieldSegments: [
      { id: "field-0", corners: ["ne"] },
      { id: "field-1", corners: ["nw", "sw", "se"] },
    ],
  },
  {
    id: "road-end",
    name: "Dead End Street",
    edges: { north: "road", east: "field", south: "field", west: "field" },
    center: "field",
    roadConnections: [["north", "center"]],
    costcoZones: [],
    fieldSegments: [{ id: "field-0", corners: ["nw", "ne", "sw", "se"] }],
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
    fieldSegments: [
      { id: "field-0", corners: ["nw"] },
      { id: "field-1", corners: ["ne"] },
      { id: "field-2", corners: ["sw", "se"] },
    ],
  },
  {
    id: "costco-straight",
    name: "Costco Shopping Strip",
    edges: { north: "costco", east: "field", south: "costco", west: "field" },
    center: "costco",
    roadConnections: [],
    costcoZones: [
      {
        id: "shopping-strip",
        segments: ["north", "south", "center"],
        hasPennant: false,
        shape: "straight",
      },
    ],
    fieldSegments: [
      { id: "field-0", corners: ["nw", "sw"] },
      { id: "field-1", corners: ["ne", "se"] },
    ],
  },
  {
    id: "costco-corner",
    name: "Costco Plaza Corner",
    edges: { north: "costco", east: "costco", south: "field", west: "field" },
    center: "costco",
    roadConnections: [],
    costcoZones: [
      {
        id: "plaza-corner",
        segments: ["north", "east", "center"],
        hasPennant: false,
        shape: "curved",
      },
    ],
    fieldSegments: [
      { id: "field-0", corners: ["sw", "se"] },
      { id: "field-1", corners: ["nw"] },
    ],
  },
  {
    id: "costco-road",
    name: "Costco with Gas Station",
    edges: { north: "costco", east: "costco", south: "road", west: "field" },
    center: "mixed",
    roadConnections: [["south", "center"]],
    costcoZones: [
      {
        id: "main-plaza",
        segments: ["north", "east", "center"],
        hasPennant: true,
        shape: "curved",
      },
    ],
    fieldSegments: [{ id: "field-0", corners: ["sw"] }],
  },
  {
    id: "costco-cap",
    name: "Costco Store Front",
    edges: { north: "costco", east: "field", south: "field", west: "field" },
    center: "costco",
    roadConnections: [],
    costcoZones: [
      {
        id: "store-front",
        segments: ["north", "center"],
        hasPennant: false,
        shape: "straight",
      },
    ],
    fieldSegments: [{ id: "field-0", corners: ["nw", "ne", "sw", "se"] }],
  },
  {
    id: "mcdonalds-abbey",
    name: "Roadside McDonalds",
    edges: { north: "field", east: "field", south: "field", west: "field" },
    center: "mcdonalds",
    roadConnections: [],
    costcoZones: [],
    fieldSegments: [{ id: "field-0", corners: ["nw", "ne", "sw", "se"] }],
  },
  {
    id: "road-costco-split",
    name: "Downtown Shopping District",
    edges: { north: "costco", east: "road", south: "road", west: "costco" },
    center: "mixed",
    roadConnections: [["east", "south", "center"]],
    costcoZones: [
      {
        id: "north-plaza",
        segments: ["north"],
        hasPennant: false,
        shape: "straight",
      },
      {
        id: "west-plaza",
        segments: ["west"],
        hasPennant: false,
        shape: "straight",
      },
    ],
    fieldSegments: [{ id: "field-0", corners: ["se"] }],
  },
  {
    id: "costco-complex-l",
    name: "Costco Supermarket Complex",
    edges: { north: "costco", east: "costco", south: "costco", west: "field" },
    center: "costco",
    roadConnections: [],
    costcoZones: [
      {
        id: "main-complex",
        segments: ["north", "east", "south", "center"],
        hasPennant: true,
        shape: "complex",
      },
    ],
    fieldSegments: [{ id: "field-0", corners: ["nw", "sw"] }],
  },
  {
    id: "costco-peninsula",
    name: "Costco Business Park",
    edges: { north: "field", east: "costco", south: "field", west: "field" },
    center: "costco",
    roadConnections: [],
    costcoZones: [
      {
        id: "business-park",
        segments: ["east", "center"],
        hasPennant: false,
        shape: "straight",
      },
    ],
    fieldSegments: [
      { id: "field-0", corners: ["nw", "sw"] },
      { id: "field-1", corners: ["ne", "se"] },
    ],
  },
  {
    id: "costco-separate-dual",
    name: "Dual Costco Outlets",
    edges: { north: "costco", east: "field", south: "costco", west: "field" },
    center: "field",
    roadConnections: [],
    costcoZones: [
      {
        id: "north-outlet",
        segments: ["north"],
        hasPennant: false,
        shape: "straight",
      },
      {
        id: "south-outlet",
        segments: ["south"],
        hasPennant: false,
        shape: "straight",
      },
    ],
    fieldSegments: [
      { id: "field-0", corners: ["nw", "ne"] },
      { id: "field-1", corners: ["sw", "se"] },
    ],
  },
  {
    id: "costco-mega-complex",
    name: "Costco Mega Shopping Plaza",
    edges: { north: "costco", east: "costco", south: "costco", west: "costco" },
    center: "costco",
    roadConnections: [],
    costcoZones: [
      {
        id: "mega-plaza",
        segments: ["north", "east", "south", "west", "center"],
        hasPennant: true,
        shape: "complex",
      },
    ],
    fieldSegments: [],
  },
  {
    id: "costco-bridge",
    name: "Costco Shopping Bridge",
    edges: { north: "field", east: "costco", south: "field", west: "costco" },
    center: "costco",
    roadConnections: [],
    costcoZones: [
      {
        id: "shopping-bridge",
        segments: ["east", "west", "center"],
        hasPennant: false,
        shape: "complex",
      },
    ],
    fieldSegments: [
      { id: "field-0", corners: ["nw", "ne"] },
      { id: "field-1", corners: ["sw", "se"] },
    ],
  },
];

// Add quantity property for deck building
const TILE_QUANTITIES: Record<string, number> = {
  "starter-proper": 1,
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
  "costco-complex-l": 2,
  "costco-peninsula": 3,
  "costco-separate-dual": 2,
  "costco-mega-complex": 1,
  "costco-bridge": 2,
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
