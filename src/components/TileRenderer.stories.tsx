import type { Meta, StoryObj } from '@storybook/react';
import { TileRenderer } from './TileRenderer';
import { getStartTile } from '../tileLibrary';
import { Tile } from '../tile';
import { TileDefinition } from '../types';

// Define all available tiles
const TILE_DEFINITIONS: TileDefinition[] = [
  { id: 'starter-proper', name: 'Costco Plaza Entrance (Start)', isStart: true, edges: { north: 'costco', east: 'road', south: 'field', west: 'road' }, center: 'field', roadConnections: [['east', 'west']], costcoZones: [{ id: 'plaza', segments: ['north'], hasPennant: false, shape: 'straight' }] },
  { id: 'straight-road', name: 'Desert Highway', edges: { north: 'road', east: 'field', south: 'road', west: 'field' }, center: 'field', roadConnections: [['north', 'south']], costcoZones: [] },
  { id: 'curve-road', name: 'Scenic Byway Curve', edges: { north: 'road', east: 'road', south: 'field', west: 'field' }, center: 'field', roadConnections: [['north', 'east']], costcoZones: [] },
  { id: 'road-end', name: 'Dead End Street', edges: { north: 'road', east: 'field', south: 'field', west: 'field' }, center: 'field', roadConnections: [['north', 'center']], costcoZones: [] },
  { id: 'three-way-road', name: 'Urban Cloverleaf', edges: { north: 'road', east: 'road', south: 'field', west: 'road' }, center: 'road', roadConnections: [['north', 'center'], ['center', 'east'], ['center', 'west']], costcoZones: [] },
  { id: 'costco-straight', name: 'Shopping Strip Mall', edges: { north: 'costco', east: 'field', south: 'costco', west: 'field' }, center: 'field', roadConnections: [], costcoZones: [{ id: 'shopping-strip', segments: ['north', 'south'], hasPennant: false, shape: 'straight' }] },
  { id: 'costco-corner', name: 'Corner Plaza', edges: { north: 'costco', east: 'costco', south: 'field', west: 'field' }, center: 'field', roadConnections: [], costcoZones: [{ id: 'plaza-corner', segments: ['north', 'east'], hasPennant: false, shape: 'curved' }] },
  { id: 'costco-road', name: 'Costco with Highway Access', edges: { north: 'costco', east: 'road', south: 'road', west: 'costco' }, center: 'field', roadConnections: [['east', 'south']], costcoZones: [{ id: 'main-plaza', segments: ['north', 'west'], hasPennant: false, shape: 'curved' }] },
  { id: 'costco-cap', name: 'Costco Endcap', edges: { north: 'field', east: 'costco', south: 'costco', west: 'costco' }, center: 'field', roadConnections: [], costcoZones: [{ id: 'store-front', segments: ['east', 'south', 'west'], hasPennant: true, shape: 'complex' }] },
  { id: 'mcdonalds-abbey', name: 'McDonald\'s Abbey', edges: { north: 'field', east: 'field', south: 'field', west: 'field' }, center: 'mcdonalds', roadConnections: [], costcoZones: [] },
  { id: 'road-costco-split', name: 'Road Splits Costco Plaza', edges: { north: 'costco', east: 'field', south: 'costco', west: 'road' }, center: 'field', roadConnections: [['west', 'center']], costcoZones: [{ id: 'north-plaza', segments: ['north'], hasPennant: false, shape: 'straight' }, { id: 'west-plaza', segments: ['south'], hasPennant: false, shape: 'straight' }] },
  { id: 'costco-complex-l', name: 'L-Shaped Costco Complex', edges: { north: 'costco', east: 'costco', south: 'costco', west: 'field' }, center: 'field', roadConnections: [], costcoZones: [{ id: 'main-complex', segments: ['north', 'east', 'south'], hasPennant: true, shape: 'complex' }] },
  { id: 'costco-peninsula', name: 'Costco Peninsula', edges: { north: 'field', east: 'costco', south: 'field', west: 'costco' }, center: 'field', roadConnections: [], costcoZones: [{ id: 'business-park', segments: ['east', 'west'], hasPennant: false, shape: 'straight' }] },
  { id: 'costco-separate-dual', name: 'Dual Costco Zones', edges: { north: 'costco', east: 'field', south: 'costco', west: 'field' }, center: 'field', roadConnections: [], costcoZones: [{ id: 'north-outlet', segments: ['north'], hasPennant: false, shape: 'straight' }, { id: 'south-outlet', segments: ['south'], hasPennant: false, shape: 'straight' }] },
  { id: 'costco-mega-complex', name: 'Mega Costco Complex', edges: { north: 'costco', east: 'costco', south: 'costco', west: 'costco' }, center: 'field', roadConnections: [], costcoZones: [{ id: 'mega-plaza', segments: ['north', 'east', 'south', 'west'], hasPennant: true, shape: 'complex' }] },
  { id: 'costco-bridge', name: 'Shopping Bridge', edges: { north: 'costco', east: 'field', south: 'costco', west: 'field' }, center: 'costco', roadConnections: [], costcoZones: [{ id: 'shopping-bridge', segments: ['north', 'center', 'south'], hasPennant: false, shape: 'straight' }] },
];

// Create tile instances
const tileMap = new Map<string, Tile>();
TILE_DEFINITIONS.forEach(def => {
  tileMap.set(def.id, new Tile(def));
});

// Create options for the dropdown with labels
const tileSelectOptions: Record<string, string> = {};
TILE_DEFINITIONS.forEach(def => {
  tileSelectOptions[def.name] = def.id;
});

const meta = {
  title: 'Game/TileRenderer',
  component: TileRenderer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    tile: {
      control: { type: 'select' },
      options: TILE_DEFINITIONS.map(d => d.id),
      mapping: Object.fromEntries(tileMap),
      description: 'Select a tile to display',
    },
    size: {
      control: { type: 'range', min: 32, max: 256, step: 8 },
      description: 'Size of the tile in pixels',
    },
    rotation: {
      control: { type: 'range', min: 0, max: 270, step: 90 },
      description: 'Rotation in degrees (0, 90, 180, 270)',
    },
    showPreview: {
      control: 'boolean',
      description: 'Show preview overlay',
    },
  },
} as Meta<typeof TileRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Get the start tile
const startTile = getStartTile();

// Interactive story with tile selector
export const Interactive: Story = {
  args: {
    tile: 'starter-proper' as any, // This will be mapped to the actual Tile object
    size: 128,
    rotation: 0,
    showPreview: false,
  },
};

// Basic Stories showing different tiles
export const StartTile: Story = {
  args: {
    tile: startTile,
    size: 128,
    rotation: 0,
  },
};

export const StraightRoad: Story = {
  args: {
    tile: tileMap.get('straight-road')!,
    size: 128,
    rotation: 0,
  },
};

export const ThreeWayRoad: Story = {
  args: {
    tile: tileMap.get('three-way-road')!,
    size: 128,
    rotation: 0,
  },
};

export const CostcoCorner: Story = {
  args: {
    tile: tileMap.get('costco-corner')!,
    size: 128,
    rotation: 0,
  },
};

export const McDonaldsAbbey: Story = {
  args: {
    tile: tileMap.get('mcdonalds-abbey')!,
    size: 128,
    rotation: 0,
  },
};

// Rotation examples
export const Rotated90: Story = {
  args: {
    tile: startTile,
    size: 128,
    rotation: 90,
  },
};

export const Rotated180: Story = {
  args: {
    tile: startTile,
    size: 128,
    rotation: 180,
  },
};

export const Rotated270: Story = {
  args: {
    tile: startTile,
    size: 128,
    rotation: 270,
  },
};

// Size examples
export const WithPreviewOverlay: Story = {
  args: {
    tile: startTile,
    size: 128,
    showPreview: true,
  },
};

export const SmallSize: Story = {
  args: {
    tile: startTile,
    size: 64,
  },
};

export const LargeSize: Story = {
  args: {
    tile: startTile,
    size: 192,
  },
};
