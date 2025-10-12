# American Tile Trails

American Tile Trails is a Carcassonne-inspired board game engine with a built-in pixel art GUI. Place tiles across an American landscape where abbeys are McDonalds, castles are sprawling Costcos, and highways stitch everything together. Challenge two built-in AI opponents or take the code further with your own house rules.

## Getting started

```bash
npm install
npm start
```

Running `npm start` launches a lightweight Node.js server and opens the interactive board at [http://localhost:3000](http://localhost:3000). The interface includes:

- **Pixel art tile rendering** – Each tile is drawn with chunky asphalt roads, bright Costco warehouses, and the Golden Arches for McDonalds abbeys.
- **Human vs. AI play** – Take the first seat while two heuristic-driven AI planners expand the map alongside you.
- **Follower placement controls** – Choose whether to deploy a representative on a road, Costco edge, or McDonalds before finalizing each tile.
- **Activity log & scoreboard** – Track scoring events, follower counts, and the remaining tiles in the deck.

If you prefer the narrated console walkthrough from the original version you can still run it with `node src/index.js`.

## Game concepts

- **Tiles** – Each tile describes the terrain on its edges (roads, fields, or Costcos) along with optional road connections and Costco zones. Tiles can be rotated before placement to match neighboring edges.
- **Board** – Validates placement rules, tracks tile locations, and evaluates when features are completed. McDonalds score when all eight surrounding spaces are filled. Roads score one point per tile, while Costcos are worth two points per tile when enclosed.
- **Players** – Manage a supply of field representatives (followers) used to claim roads, Costcos, or McDonalds.
- **Game** – Shuffles a deck of American-themed tiles, enforces turn order, handles follower placement, and awards points when features are closed.
- **AI (SimpleAI)** – Uses a lightweight heuristic that prefers completing features, connecting to active networks, and securing lucrative Costco zones.

## Customizing the experience

The core classes remain exportable and can be incorporated into other applications:

- `Tile`, `buildDeck`, and `getStartTile` in `src/tileLibrary.js`
- `Board` in `src/board.js`
- `Player` in `src/player.js`
- `Game` in `src/game.js`
- `SimpleAI` in `src/ai.js`

Feel free to extend the deck with new tile definitions, tweak the AI weights, or wire the engine into a multiplayer backend.
