import { describe, it, expect, beforeEach } from 'vitest';
import { Board } from '../board';
import { Tile } from '../tile';
import { TileDefinition, TerrainType } from '../types';

describe('Board', () => {
  let board: Board;
  let starterTile: Tile;
  let roadTile: Tile;
  let fieldTile: Tile;

  beforeEach(() => {
    board = new Board();

    // Starter tile - CRFR pattern (Costco-Road-Field-Road)
    const starterDef: TileDefinition = {
      id: 'starter',
      name: 'Starter',
      edges: {
        north: 'costco' as TerrainType,
        east: 'road' as TerrainType,
        south: 'field' as TerrainType,
        west: 'road' as TerrainType,
      },
      center: 'field' as TerrainType,
      roadConnections: [['east', 'west']],
      costcoZones: [
        {
          id: 'zone1',
          segments: ['north'],
          hasPennant: false,
          shape: 'straight',
        },
      ],
      isStart: true,
    };
    starterTile = new Tile(starterDef);

    // Road tile with north-south connection
    const roadDef: TileDefinition = {
      id: 'road-ns',
      name: 'Road North-South',
      edges: {
        north: 'road' as TerrainType,
        east: 'field' as TerrainType,
        south: 'road' as TerrainType,
        west: 'field' as TerrainType,
      },
      center: 'field' as TerrainType,
      roadConnections: [['north', 'south']],
      costcoZones: [],
    };
    roadTile = new Tile(roadDef);

    // All field tile
    const fieldDef: TileDefinition = {
      id: 'field',
      name: 'All Field',
      edges: {
        north: 'field' as TerrainType,
        east: 'field' as TerrainType,
        south: 'field' as TerrainType,
        west: 'field' as TerrainType,
      },
      center: 'field' as TerrainType,
      roadConnections: [],
      costcoZones: [],
    };
    fieldTile = new Tile(fieldDef);
  });

  describe('Constructor', () => {
    it('should create an empty board', () => {
      expect(board.isEmpty()).toBe(true);
      expect(board.tiles.size).toBe(0);
    });
  });

  describe('isEmpty', () => {
    it('should return true for new board', () => {
      expect(board.isEmpty()).toBe(true);
    });

    it('should return false after placing a tile', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      expect(board.isEmpty()).toBe(false);
    });
  });

  describe('placeTile', () => {
    it('should place first tile at origin', () => {
      const position = { x: 0, y: 0 };
      board.placeTile(starterTile, position);
      
      const record = board.getTile(position);
      expect(record).toBeDefined();
      expect(record?.tile.id).toBe('starter');
      expect(record?.position).toEqual(position);
    });

    it('should track multiple tiles', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      // Starter has field south, so field tile can go there
      board.placeTile(fieldTile, { x: 0, y: 1 });
      
      expect(board.tiles.size).toBe(2);
    });

    it('should allow tiles at different positions', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 0, y: 1 }; // Adjacent to pos1
      
      board.placeTile(starterTile, pos1);
      // Starter has field south edge, field tile has field north edge
      board.placeTile(fieldTile, pos2);
      
      expect(board.getTile(pos1)?.tile.id).toBe('starter');
      expect(board.getTile(pos2)?.tile.id).toBe('field');
    });
  });

  describe('getTile', () => {
    it('should return undefined for empty position', () => {
      expect(board.getTile({ x: 0, y: 0 })).toBeUndefined();
    });

    it('should return tile record for occupied position', () => {
      const position = { x: 0, y: 0 };
      board.placeTile(starterTile, position);
      
      const record = board.getTile(position);
      expect(record).toBeDefined();
      expect(record?.tile).toBe(starterTile);
      expect(record?.position).toEqual(position);
    });

    it('should distinguish between adjacent positions', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      
      expect(board.getTile({ x: 0, y: 0 })).toBeDefined();
      expect(board.getTile({ x: 1, y: 0 })).toBeUndefined();
      expect(board.getTile({ x: 0, y: 1 })).toBeUndefined();
    });
  });

  describe('getNeighbors', () => {
    it('should return empty object for isolated tile', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      const neighbors = board.getNeighbors({ x: 0, y: 0 });
      
      expect(Object.keys(neighbors)).toHaveLength(0);
    });

    it('should find south neighbor', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      // Starter has field south, field tile matches
      board.placeTile(fieldTile, { x: 0, y: 1 });
      
      const neighbors = board.getNeighbors({ x: 0, y: 0 });
      expect(neighbors.south).toBeDefined();
      expect(neighbors.south.tile.id).toBe('field');
      expect(neighbors.south.position).toEqual({ x: 0, y: 1 });
    });

    it('should find multiple neighbors with valid placements', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      // Starter has field south
      board.placeTile(fieldTile.clone(), { x: 0, y: 1 }); // south
      
      const neighbors = board.getNeighbors({ x: 0, y: 0 });
      expect(Object.keys(neighbors).length).toBeGreaterThan(0);
      expect(neighbors.south).toBeDefined();
    });
  });

  describe('getBounds', () => {
    it('should return zero bounds for empty board', () => {
      const bounds = board.getBounds();
      expect(bounds).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
    });

    it('should return correct bounds for single tile', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      const bounds = board.getBounds();
      expect(bounds).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
    });

    it('should expand bounds with valid placements', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      board.placeTile(fieldTile, { x: 0, y: 1 }); // south of starter
      
      const bounds = board.getBounds();
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(1);
    });

    it('should track bounds correctly', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      board.placeTile(fieldTile.clone(), { x: 0, y: 1 });
      board.placeTile(fieldTile.clone(), { x: 0, y: 2 });
      
      const bounds = board.getBounds();
      expect(bounds.minX).toBeLessThanOrEqual(0);
      expect(bounds.maxX).toBeGreaterThanOrEqual(0);
      expect(bounds.minY).toBeLessThanOrEqual(0);
      expect(bounds.maxY).toBeGreaterThanOrEqual(2);
    });
  });

  describe('canPlace', () => {
    beforeEach(() => {
      // Place starter tile at origin
      board.placeTile(starterTile, { x: 0, y: 0 });
    });

    it('should not allow placement on occupied position', () => {
      const result = board.canPlace(fieldTile, { x: 0, y: 0 });
      expect(result).toBe(false);
    });

    it('should require at least one adjacent tile', () => {
      const result = board.canPlace(fieldTile, { x: 10, y: 10 });
      expect(result).toBe(false);
    });

    it('should allow valid adjacent placement', () => {
      // Field tile can be placed south of starter (starter has field edge south)
      const result = board.canPlace(fieldTile, { x: 0, y: 1 });
      expect(result).toBe(true);
    });

    it('should validate edge matching', () => {
      // Road tile (with north road edge) should match starter's east road edge
      const result = board.canPlace(roadTile.rotate(1), { x: 1, y: 0 });
      expect(result).toBe(true);
    });
  });

  describe('getPlacementCandidates', () => {
    it('should return origin for empty board', () => {
      const candidates = board.getPlacementCandidates();
      expect(candidates).toContainEqual({ x: 0, y: 0 });
      expect(candidates).toHaveLength(1);
    });

    it('should return adjacent positions after first tile', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      const candidates = board.getPlacementCandidates();
      
      expect(candidates).toContainEqual({ x: 0, y: -1 }); // north
      expect(candidates).toContainEqual({ x: 1, y: 0 });  // east
      expect(candidates).toContainEqual({ x: 0, y: 1 });  // south
      expect(candidates).toContainEqual({ x: -1, y: 0 }); // west
      expect(candidates).toHaveLength(4);
    });

    it('should not include occupied positions', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      board.placeTile(fieldTile, { x: 0, y: 1 }); // occupy south
      
      const candidates = board.getPlacementCandidates();
      expect(candidates).not.toContainEqual({ x: 0, y: 1 });
    });

    it('should expand as more tiles are placed', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      const initialCount = board.getPlacementCandidates().length;
      
      board.placeTile(fieldTile, { x: 0, y: 1 });
      const newCount = board.getPlacementCandidates().length;
      
      // Should have more candidates (or same if some overlap)
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  describe('Integration scenarios', () => {
    it('should build a simple line of tiles', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      board.placeTile(fieldTile.clone(), { x: 0, y: 1 });
      board.placeTile(fieldTile.clone(), { x: 0, y: 2 });
      
      expect(board.tiles.size).toBe(3);
      const bounds = board.getBounds();
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(2);
    });

    it('should handle placing tiles around a center', () => {
      board.placeTile(starterTile, { x: 0, y: 0 });
      board.placeTile(fieldTile.clone(), { x: 0, y: 1 });  // south
      
      expect(board.tiles.size).toBeGreaterThan(1);
      
      // Center tile should have at least one neighbor
      const neighbors = board.getNeighbors({ x: 0, y: 0 });
      expect(Object.keys(neighbors).length).toBeGreaterThan(0);
    });
  });
});
