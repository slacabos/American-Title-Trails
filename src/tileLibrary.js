import { Tile } from './tile.js';

const TILE_LIBRARY = [
  {
    id: 'starter-crossroads',
    name: 'Route 66 Crossroads',
    quantity: 1,
    isStart: true,
    edges: { north: 'road', east: 'road', south: 'road', west: 'road' },
    center: 'road',
    roadConnections: [
      ['north', 'center'],
      ['east', 'center'],
      ['south', 'center'],
      ['west', 'center']
    ],
    costcoZones: []
  },
  {
    id: 'straight-road',
    name: 'Desert Highway',
    quantity: 6,
    edges: { north: 'road', east: 'field', south: 'road', west: 'field' },
    center: 'field',
    roadConnections: [['north', 'south']],
    costcoZones: []
  },
  {
    id: 'curve-road',
    name: 'Scenic Byway Curve',
    quantity: 6,
    edges: { north: 'road', east: 'road', south: 'field', west: 'field' },
    center: 'field',
    roadConnections: [['north', 'east']],
    costcoZones: []
  },
  {
    id: 'road-end',
    name: 'Dead End Street',
    quantity: 5,
    edges: { north: 'road', east: 'field', south: 'field', west: 'field' },
    center: 'field',
    roadConnections: [['north', 'center']],
    costcoZones: []
  },
  {
    id: 'three-way-road',
    name: 'Urban Cloverleaf',
    quantity: 4,
    edges: { north: 'road', east: 'road', south: 'field', west: 'road' },
    center: 'road',
    roadConnections: [
      ['north', 'center'],
      ['east', 'center'],
      ['west', 'center']
    ],
    costcoZones: []
  },
  {
    id: 'costco-straight',
    name: 'Costco Logistics Row',
    quantity: 4,
    edges: { north: 'costco', east: 'field', south: 'costco', west: 'field' },
    center: 'costco',
    roadConnections: [],
    costcoZones: [['north', 'south', 'center']]
  },
  {
    id: 'costco-corner',
    name: 'Costco Distribution Corner',
    quantity: 4,
    edges: { north: 'costco', east: 'costco', south: 'field', west: 'field' },
    center: 'costco',
    roadConnections: [],
    costcoZones: [['north', 'east', 'center']]
  },
  {
    id: 'costco-road',
    name: 'Costco Exit Ramp',
    quantity: 3,
    edges: { north: 'costco', east: 'costco', south: 'road', west: 'field' },
    center: 'mixed',
    roadConnections: [['south', 'center']],
    costcoZones: [['north', 'east', 'center']]
  },
  {
    id: 'costco-cap',
    name: 'Costco Cul-de-sac',
    quantity: 2,
    edges: { north: 'costco', east: 'field', south: 'field', west: 'field' },
    center: 'costco',
    roadConnections: [],
    costcoZones: [['north', 'center']]
  },
  {
    id: 'mcdonalds-abbey',
    name: 'Roadside McDonalds',
    quantity: 4,
    edges: { north: 'field', east: 'field', south: 'field', west: 'field' },
    center: 'mcdonalds',
    roadConnections: [],
    costcoZones: []
  },
  {
    id: 'road-costco-split',
    name: 'Downtown Complex',
    quantity: 3,
    edges: { north: 'costco', east: 'road', south: 'road', west: 'costco' },
    center: 'mixed',
    roadConnections: [['east', 'south', 'center']],
    costcoZones: [
      ['north', 'center'],
      ['west', 'center']
    ]
  }
];

export const buildDeck = () => {
  const deck = [];
  TILE_LIBRARY.forEach(template => {
    if (template.isStart) {
      return;
    }
    for (let i = 0; i < template.quantity; i += 1) {
      deck.push(
        new Tile({
          id: template.id,
          name: template.name,
          edges: template.edges,
          center: template.center,
          roadConnections: template.roadConnections,
          costcoZones: template.costcoZones,
          isStart: template.isStart === true
        })
      );
    }
  });
  return deck;
};

export const getStartTile = () => {
  const template = TILE_LIBRARY.find(tile => tile.isStart);
  if (!template) {
    throw new Error('No start tile defined in the library.');
  }
  return new Tile({
    id: template.id,
    name: template.name,
    edges: template.edges,
    center: template.center,
    roadConnections: template.roadConnections,
    costcoZones: template.costcoZones,
    isStart: true
  });
};
