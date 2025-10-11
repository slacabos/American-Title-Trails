import { DIRECTIONS, DELTAS, OPPOSITE } from './directions.js';

const positionKey = ({ x, y }) => `${x},${y}`;
const parsePositionKey = key => {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
};

const addDelta = (position, direction) => {
  const delta = DELTAS[direction];
  return { x: position.x + delta.x, y: position.y + delta.y };
};

const makeSignature = (type, parts) => `${type}:${[...parts].sort().join('|')}`;

export class Board {
  constructor() {
    this.tiles = new Map();
    this.featureClaims = new Map();
  }

  isEmpty() {
    return this.tiles.size === 0;
  }

  getTile(position) {
    return this.tiles.get(positionKey(position));
  }

  getNeighbors(position) {
    return DIRECTIONS.reduce((neighbors, direction) => {
      const neighborPosition = addDelta(position, direction);
      const record = this.getTile(neighborPosition);
      if (record) {
        neighbors[direction] = { position: neighborPosition, tile: record.tile };
      }
      return neighbors;
    }, {});
  }

  getBounds() {
    if (this.tiles.size === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.tiles.forEach(({ position }) => {
      if (position.x < minX) minX = position.x;
      if (position.x > maxX) maxX = position.x;
      if (position.y < minY) minY = position.y;
      if (position.y > maxY) maxY = position.y;
    });

    return { minX, maxX, minY, maxY };
  }

  getPlacementCandidates() {
    if (this.isEmpty()) {
      return [{ x: 0, y: 0 }];
    }

    const candidates = new Set();

    this.tiles.forEach(({ position }) => {
      DIRECTIONS.forEach(direction => {
        const neighborPosition = addDelta(position, direction);
        if (this.getTile(neighborPosition)) {
          return;
        }
        candidates.add(positionKey(neighborPosition));
      });
    });

    return [...candidates].map(parsePositionKey);
  }

  canPlace(tile, position) {
    if (!this.isEmpty() && this.getTile(position)) {
      return false;
    }

    const neighbors = this.getNeighbors(position);
    const neighborEntries = Object.entries(neighbors);
    if (!this.isEmpty() && neighborEntries.length === 0) {
      return false;
    }

    return neighborEntries.every(([direction, neighbor]) => {
      const oppositeEdge = neighbor.tile.edgeAt(OPPOSITE[direction]);
      const currentEdge = tile.edgeAt(direction);
      return oppositeEdge === currentEdge;
    });
  }

  placeTile(tile, position) {
    if (!this.canPlace(tile, position)) {
      throw new Error(`Invalid placement for tile ${tile.name} at (${position.x}, ${position.y})`);
    }

    const key = positionKey(position);
    this.tiles.set(key, { tile: tile.clone(), position: { ...position } });

    const completed = this.evaluateCompletedFeatures(position);
    return { completed };
  }

  previewPlacement(tile, position) {
    if (!this.canPlace(tile, position)) {
      return null;
    }

    const key = positionKey(position);
    this.tiles.set(key, { tile: tile.clone(), position: { ...position } });
    const completed = this.evaluateCompletedFeatures(position);
    this.tiles.delete(key);
    return { completed };
  }

  evaluateCompletedFeatures(position) {
    const placed = this.getTile(position);
    const completed = [];
    const processed = new Set();

    const tile = placed.tile;

    tile.roadConnections.forEach(connection => {
      connection.forEach(direction => {
        if (!DIRECTIONS.includes(direction)) {
          return;
        }
        const traversal = this.walkRoad(position, direction);
        if (!traversal) {
          return;
        }
        const signature = makeSignature('road', traversal.edges);
        if (processed.has(signature)) {
          return;
        }
        processed.add(signature);
        if (!traversal.open) {
          completed.push({ type: 'road', edges: traversal.edges, tiles: traversal.tiles });
        }
      });
    });

    tile.costcoZones.forEach(zone => {
      zone.forEach(direction => {
        if (!DIRECTIONS.includes(direction)) {
          return;
        }
        const traversal = this.walkCostco(position, direction);
        if (!traversal) {
          return;
        }
        const signature = makeSignature('costco', traversal.edges);
        if (processed.has(signature)) {
          return;
        }
        processed.add(signature);
        if (!traversal.open) {
          completed.push({ type: 'costco', edges: traversal.edges, tiles: traversal.tiles });
        }
      });
    });

    if (tile.center === 'mcdonalds') {
      const signature = `mcdonalds:${positionKey(position)}`;
      if (this.isMcDonaldsComplete(position)) {
        completed.push({ type: 'mcdonalds', edges: new Set([signature]), tiles: new Set([positionKey(position)]) });
      }
      processed.add(signature);
    }

    return completed;
  }

  walkRoad(position, direction) {
    const visited = new Set();
    const edgeSet = new Set();
    const tileSet = new Set();
    const stack = [{ position, direction }];
    let open = false;

    while (stack.length > 0) {
      const current = stack.pop();
      const edgeKey = `${positionKey(current.position)}:${current.direction}`;
      if (visited.has(edgeKey)) {
        continue;
      }
      visited.add(edgeKey);
      edgeSet.add(edgeKey);

      const placedTile = this.getTile(current.position);
      if (!placedTile) {
        open = true;
        continue;
      }
      tileSet.add(positionKey(current.position));
      const tile = placedTile.tile;
      const connection = tile.roadConnections.find(conn => conn.includes(current.direction));
      if (!connection) {
        open = true;
      } else {
        connection.forEach(nextDirection => {
          if (nextDirection === current.direction || nextDirection === 'center') {
            return;
          }
          stack.push({ position: current.position, direction: nextDirection });
        });

        const neighborPosition = addDelta(current.position, current.direction);
        const neighborTile = this.getTile(neighborPosition);
        if (!neighborTile) {
          open = true;
        } else {
          const oppositeDirection = OPPOSITE[current.direction];
          const neighborConnection = neighborTile.tile.roadConnections.find(conn => conn.includes(oppositeDirection));
          if (!neighborConnection) {
            open = true;
          } else {
            stack.push({ position: neighborPosition, direction: oppositeDirection });
          }
        }
      }
    }

    return { open, edges: edgeSet, tiles: tileSet };
  }

  walkCostco(position, direction) {
    const visited = new Set();
    const edgeSet = new Set();
    const tileSet = new Set();
    const stack = [{ position, direction }];
    let open = false;

    while (stack.length > 0) {
      const current = stack.pop();
      const edgeKey = `${positionKey(current.position)}:${current.direction}`;
      if (visited.has(edgeKey)) {
        continue;
      }
      visited.add(edgeKey);
      edgeSet.add(edgeKey);

      const placedTile = this.getTile(current.position);
      if (!placedTile) {
        open = true;
        continue;
      }
      tileSet.add(positionKey(current.position));
      const tile = placedTile.tile;
      const zone = tile.costcoZones.find(conn => conn.includes(current.direction));
      if (!zone) {
        open = true;
      } else {
        zone.forEach(nextDirection => {
          if (nextDirection === current.direction || nextDirection === 'center') {
            return;
          }
          stack.push({ position: current.position, direction: nextDirection });
        });

        const neighborPosition = addDelta(current.position, current.direction);
        const neighborTile = this.getTile(neighborPosition);
        if (!neighborTile) {
          open = true;
        } else {
          const oppositeDirection = OPPOSITE[current.direction];
          const neighborZone = neighborTile.tile.costcoZones.find(conn => conn.includes(oppositeDirection));
          if (!neighborZone) {
            open = true;
          } else {
            stack.push({ position: neighborPosition, direction: oppositeDirection });
          }
        }
      }
    }

    return { open, edges: edgeSet, tiles: tileSet };
  }

  isMcDonaldsComplete(position) {
    const neighborOffsets = [
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ];

    return neighborOffsets.every(offset => {
      const neighbor = this.getTile({ x: position.x + offset.x, y: position.y + offset.y });
      return Boolean(neighbor);
    });
  }

  claimFeature(type, position, identifier, playerId) {
    let traversal;
    if (type === 'road') {
      if (!DIRECTIONS.includes(identifier)) {
        throw new Error('Road followers must be placed on a specific edge direction.');
      }
      traversal = this.walkRoad(position, identifier);
      if (!traversal) {
        throw new Error('Invalid road selection for follower placement.');
      }
    } else if (type === 'costco') {
      if (!DIRECTIONS.includes(identifier)) {
        throw new Error('Costco followers must be placed on an edge that belongs to the warehouse.');
      }
      traversal = this.walkCostco(position, identifier);
      if (!traversal) {
        throw new Error('Invalid Costco selection for follower placement.');
      }
    } else if (type === 'mcdonalds') {
      const placedTile = this.getTile(position);
      if (!placedTile || placedTile.tile.center !== 'mcdonalds') {
        throw new Error('McDonalds can only be claimed on a McDonalds tile.');
      }
      const signature = `mcdonalds:${positionKey(position)}`;
      if (this.featureClaims.has(signature)) {
        throw new Error('This McDonalds already has a manager.');
      }
      this.featureClaims.set(signature, { type, players: new Set([playerId]) });
      return { type, edges: new Set([signature]) };
    } else {
      throw new Error(`Unknown feature type: ${type}`);
    }

    traversal.edges.forEach(edge => {
      if (this.featureClaims.has(edge)) {
        throw new Error('This feature is already claimed by another player.');
      }
    });

    traversal.edges.forEach(edge => {
      this.featureClaims.set(edge, { type, players: new Set([playerId]) });
    });

    return { type, edges: traversal.edges };
  }

  releaseFeature(feature) {
    const players = new Set();

    feature.edges.forEach(edge => {
      const claim = this.featureClaims.get(edge);
      if (!claim) {
        return;
      }
      claim.players.forEach(player => players.add(player));
      this.featureClaims.delete(edge);
    });

    return [...players];
  }

  getFeatureClaims() {
    return [...this.featureClaims.entries()].map(([edge, claim]) => ({
      edge,
      type: claim.type,
      players: [...claim.players]
    }));
  }
}
