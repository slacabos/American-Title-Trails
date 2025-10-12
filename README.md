# American Tile Trails

American Tile Trails is a Carcassonne-inspired board game built with **TypeScript** and **React**. Place tiles across an American landscape where abbeys are McDonalds, castles are sprawling Costcos, and highways stitch everything together. Challenge AI opponents in local multiplayer with support for up to 5 players (human + AI mix).

## Getting started

```bash
npm install
npm run dev
```

Running `npm run dev` launches the Vite development server and opens the interactive board at [http://localhost:3000](http://localhost:3000). The modern React interface includes:

- **Pixel art tile rendering** – Each tile is drawn with chunky asphalt roads, bright Costco warehouses, and the Golden Arches for McDonalds abbeys.
- **Local multiplayer** – Configure 2-5 players with any combination of human and AI players.
- **Follower placement controls** – Choose whether to deploy a representative on a road, Costco edge, or McDonalds before finalizing each tile.
- **Real-time scoreboard** – Track scoring events, follower counts, and turn indicators with player colors.
- **Activity log** – Live feed of game events and scoring updates.

## Technology Stack

- **TypeScript** – Full type safety and modern JavaScript features
- **React 18** – Component-based UI with hooks for state management
- **Vite** – Fast development server and optimized production builds
- **HTML5 Canvas** – Hardware-accelerated pixel art rendering
- **CSS3** – Custom styling with CSS variables and modern layout

## Game Features

- **Local Multiplayer**: 2-5 players on the same device
- **Smart AI**: Heuristic-driven AI opponents with configurable difficulty
- **Tile Management**: 41 unique tiles with rotation and validation
- **Feature Scoring**: Roads (1pt/tile), Costcos (2pts/tile), McDonalds (9pts)
- **Interactive Setup**: Choose player count, names, and human vs AI
- **Real-time Updates**: Live game state with visual feedback

## 🎮 How to Play

**Quick Start:**

1. Run `npm run dev` and open http://localhost:3000
2. Configure 2-5 players (human or AI)
3. Take turns placing tiles and claiming features
4. Score points when roads, Costcos, or McDonalds are completed
5. Player with the most points wins!

**📖 [Complete Gameplay Instructions](./GAMEPLAY_INSTRUCTIONS.md)** - Detailed rules, strategies, and tips

**Basic Gameplay:**

- **Place Tiles**: Click on green highlighted areas to place tiles
- **Rotate**: Use "Rotate Tile" button to change orientation
- **Claim Features**: After placing, optionally claim roads, Costcos, or McDonalds
- **Score Points**: Completed features score immediately and return followers
- **Win**: Highest score when all tiles are placed

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit
```

## Project Structure

```text
src/
├── components/           # React components
│   ├── GameSetup.tsx    # Player configuration
│   ├── GameBoard.tsx    # Main game interface
│   └── ...              # Additional UI components
├── types.ts             # TypeScript type definitions
├── game.ts              # Core game logic
├── board.ts             # Board state management
├── player.ts            # Player class
├── tile.ts              # Tile system
├── tileLibrary.ts       # Tile definitions
├── ai.ts                # AI player logic
├── directions.ts        # Direction utilities
└── main.tsx             # React entry point
```

## Game concepts

- **Tiles** – Each tile describes the terrain on its edges (roads, fields, or Costcos) along with optional road connections and Costco zones. Tiles can be rotated before placement to match neighboring edges.
- **Board** – Validates placement rules, tracks tile locations, and evaluates when features are completed. McDonalds score when all eight surrounding spaces are filled. Roads score one point per tile, while Costcos are worth two points per tile when enclosed.
- **Players** – Manage a supply of field representatives (followers) used to claim roads, Costcos, or McDonalds.
- **Game** – Shuffles a deck of American-themed tiles, enforces turn order, handles follower placement, and awards points when features are closed.
- **AI (SimpleAI)** – Uses a lightweight heuristic that prefers completing features, connecting to active networks, and securing lucrative Costco zones.

## Customizing the experience

The core classes are fully typed and can be easily extended:

- `Tile`, `buildDeck`, and `getStartTile` in `src/tileLibrary.ts`
- `Board` in `src/board.ts`
- `Player` in `src/player.ts`
- `Game` in `src/game.ts`
- `SimpleAI` in `src/ai.ts`

Feel free to extend the deck with new tile definitions, tweak the AI weights, add new React components, or integrate with a multiplayer backend.
