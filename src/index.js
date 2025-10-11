import { Game } from './game.js';

const formatScoreboard = game =>
  game.players.map(player => `${player.name}: ${player.score} pts (${player.followers} reps left)`).join(' | ');

const printBoard = board => {
  const placements = [...board.tiles.values()].sort((a, b) => {
    if (a.position.y === b.position.y) {
      return a.position.x - b.position.x;
    }
    return a.position.y - b.position.y;
  });

  console.log('\nCurrent board state:');
  placements.forEach(({ position, tile }) => {
    const orientation = (tile.orientation * 90) % 360;
    console.log(`  (${position.x}, ${position.y}) -> ${tile.name} [${tile.id}] facing ${orientation}°`);
  });
};

const drawSpecificTile = (game, tileId) => {
  const index = game.drawPile.findIndex(tile => tile.id === tileId);
  if (index === -1) {
    throw new Error(`Tile ${tileId} is not available in the draw pile.`);
  }
  return game.drawPile.splice(index, 1)[0];
};

const runDemo = () => {
  const game = new Game(['Jordan', 'Casey']);
  console.log('American Tile Trails demo starting!');
  console.log('Start tile placed at the origin as Route 66 Crossroads.');
  printBoard(game.board);

  const takeTurn = (player, tileId, position, options = {}) => {
    const tile = drawSpecificTile(game, tileId);
    console.log(`\n${player.name} draws ${tile.name}.`);
    const rotationText = options.rotation ? ` and rotates it ${options.rotation * 90}°` : '';
    console.log(`${player.name} places the tile at (${position.x}, ${position.y})${rotationText}.`);
    if (options.follower) {
      const claimDirection = options.follower.identifier ? ` on the ${options.follower.identifier} edge` : '';
      console.log(`${player.name} assigns a field representative to the ${options.follower.type}${claimDirection}.`);
    }

    const result = game.placeTile(player.id, tile, position, options);

    result.scored.forEach(event => {
      console.log(`  -> ${event.player} scores ${event.points} points for completing a ${event.feature}.`);
    });

    printBoard(game.board);
    console.log(`Scoreboard: ${formatScoreboard(game)}`);
    game.advanceTurn();
  };

  const [jordan, casey] = game.players;

  takeTurn(jordan, 'straight-road', { x: 1, y: 0 }, {
    rotation: 1,
    follower: { type: 'road', identifier: 'west' }
  });

  takeTurn(casey, 'road-costco-split', { x: 0, y: -1 }, {
    rotation: 0,
    follower: { type: 'costco', identifier: 'north' }
  });

  takeTurn(jordan, 'costco-cap', { x: 0, y: -2 }, { rotation: 2 });

  takeTurn(casey, 'road-end', { x: 2, y: 0 }, { rotation: 3 });

  takeTurn(jordan, 'mcdonalds-abbey', { x: 1, y: 1 }, {
    follower: { type: 'mcdonalds' }
  });

  console.log('\nFinal scores:');
  console.log(formatScoreboard(game));
  console.log('The McDonalds is still waiting for eight neighboring tiles before it can score.');
};

runDemo();
