export const DIRECTIONS = ['north', 'east', 'south', 'west'];

export const OPPOSITE = {
  north: 'south',
  east: 'west',
  south: 'north',
  west: 'east'
};

export const DELTAS = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 }
};

export const rotateDirection = (direction, times) => {
  if (direction === 'center') {
    return 'center';
  }
  const normalized = ((times % 4) + 4) % 4;
  const index = DIRECTIONS.indexOf(direction);
  if (index === -1) {
    throw new Error(`Unknown direction: ${direction}`);
  }
  const newIndex = (index + normalized) % DIRECTIONS.length;
  return DIRECTIONS[newIndex];
};
