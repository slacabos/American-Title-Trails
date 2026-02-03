# CLAUDE.md - AI Assistant Guide for American Tile Trails

## Project Overview

American Tile Trails is a Carcassonne-inspired tile-placement board game built with TypeScript, React, and HTML5 Canvas. It features American-themed elements where abbeys are McDonald's, castles are Costco stores, and roads are highways. The game supports 2-5 players (human + AI mix) in local multiplayer.

### Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm test             # Run Vitest unit tests
npm run storybook    # Launch Storybook on port 6006
```

### Tech Stack

- **TypeScript** with strict mode enabled
- **React 18** with hooks for state management
- **Vite** for development server and builds (port 3000)
- **HTML5 Canvas** for tile rendering
- **Tailwind CSS 4** with shadcn/ui components
- **Vitest** for unit testing with 80% coverage thresholds
- **Storybook 9** for component documentation

---

## Architecture

### Core Design Principles

1. **Framework-agnostic game logic**: Core classes (`Game`, `Board`, `Tile`, `Player`, `SimpleAI`) contain pure TypeScript logic with no React dependencies
2. **Listener pattern for React integration**: Game state changes trigger callbacks that update React components
3. **Immutable tiles**: Rotation creates new `Tile` instances rather than mutating existing ones
4. **Position-based spatial indexing**: Board uses `Map<string, TileRecord>` with `"x,y"` string keys

### State Management Flow

```
User Action → Game Method → State Change → Listener Callback → React Re-render
                ↓
          Phase Transition: PLACE_TILE → CLAIM_FEATURE → END_TURN
```

### Manager Classes (`src/managers/`)

The game logic is decomposed into single-responsibility managers:

| Manager | Responsibility |
|---------|---------------|
| `ScoreManager` | Score calculation and final scoring |
| `TurnManager` | Turn flow, phase transitions, player rotation |
| `TileManager` | Tile deck, drawing, rotation, valid placements |
| `FeatureClaimManager` | Feature claiming logic and claimable feature detection |
| `PlayerManager` | Player state (followers, colors, names) |

---

## Project Structure

```
src/
├── components/           # React UI components
│   ├── GameBoard.tsx     # Main game interface with controls and sidebar
│   ├── BoardCanvas.tsx   # HTML5 Canvas rendering with zoom/pan
│   ├── GameSetup.tsx     # Player configuration screen
│   ├── TileRenderer.tsx  # Individual tile rendering component
│   ├── HelpModal.tsx     # Help documentation modal
│   └── ui/               # shadcn/ui design system components
├── managers/             # Game logic managers (see table above)
├── hooks/                # Custom React hooks
│   └── useTranslations.ts
├── content/              # i18n and help content
│   ├── translations/     # JSON translation files
│   └── help/             # Markdown help content
├── stories/              # Storybook stories
├── test/                 # Test files and setup
├── utils/                # Utility functions
│   ├── arrayUtils.ts     # shuffle(), etc.
│   └── tileRendering.ts  # Canvas drawing utilities
├── constants/            # Color constants, etc.
├── types.ts              # All TypeScript interfaces and enums
├── game.ts               # Game class (main orchestrator)
├── board.ts              # Board class (tile placement, feature detection)
├── tile.ts               # Tile class (immutable tile representation)
├── tileLibrary.ts        # 41 tile definitions
├── player.ts             # Player class
├── ai.ts                 # SimpleAI heuristic-based AI
├── directions.ts         # Direction utilities (DIRECTIONS, OPPOSITE, DELTAS)
└── main.tsx              # React entry point
```

---

## Key Code Patterns

### Position Handling

Always use helper functions for position-to-string conversion:

```typescript
// src/board.ts
const positionKey = ({ x, y }: Position): string => `${x},${y}`;
const parsePositionKey = (key: string): Position => {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
};

// CORRECT: Use helper functions
const key = positionKey(position);
const pos = parsePositionKey(key);

// WRONG: Never manually construct position strings
const key = `${x},${y}`;  // Don't do this outside helpers
```

### Direction System

```typescript
// src/directions.ts
export const DIRECTIONS: Direction[] = ["north", "east", "south", "west"];
export const OPPOSITE: Record<Direction, Direction> = { north: "south", ... };
export const DELTAS: Record<Direction, Position> = { north: {x:0, y:-1}, ... };

// Rotation is clockwise by 90° increments
rotateDirection("north", 1);  // → "east"
rotateDirection("north", -1); // → "west"
```

### Tile Immutability

```typescript
// Tiles never mutate - rotation creates new instances
const rotatedTile = tile.rotate(1);  // Returns new Tile
board.placeTile(rotatedTile, position);

// TileDefinition in tileLibrary.ts is the source of truth
```

### Game Phases

```typescript
enum GamePhase {
  PLACE_TILE = "place_tile",       // Player placing tile
  CLAIM_FEATURE = "claim_feature", // Player claiming feature (optional)
  SCORE_FEATURES = "score_features",
  END_TURN = "end_turn",
  GAME_OVER = "game_over",
}
```

### React State Subscription

```typescript
// In Game class
game.setStateChangeListener((state) => {
  setGameState(state);  // Triggers React re-render
});

// All mutations go through Game methods
game.placeTile(position, rotation);
game.claimFeature(type, identifier);
game.skipClaim();
```

---

## Development Workflow

### Essential Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 3000, auto-opens browser) |
| `npm run build` | TypeScript check + Vite production build |
| `npx tsc --noEmit` | Type check without emitting (run before commits) |
| `npm test` | Run Vitest unit tests |
| `npm run test:ui` | Open Vitest browser UI |
| `npm run test:coverage` | Generate coverage report |
| `npm run storybook` | Launch Storybook (port 6006) |
| `npm run sync-help-content en` | Sync help markdown to TypeScript export |

### Testing

Tests are located in `src/test/` using Vitest with jsdom environment.

```typescript
// Game logic tests
describe("Game", () => {
  it("should initialize with correct state", () => {
    const game = new Game(players);
    expect(game.getState().phase).toBe(GamePhase.PLACE_TILE);
  });
});

// React component tests
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("should handle user interactions", async () => {
  render(<GameSetup onStart={mockFn} />);
  await userEvent.click(screen.getByText("Start Game"));
  expect(mockFn).toHaveBeenCalled();
});
```

Coverage thresholds (80% required):
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### Path Aliases

The `@/` alias resolves to `src/` in both Vite and TypeScript:

```typescript
import { Button } from "@/components/ui/button";
import useTranslations from "@/hooks/useTranslations";
```

---

## Game Concepts

### Terrain Types

```typescript
type TerrainType = "road" | "field" | "costco" | "mcdonalds" | "mixed";
```

| Type | Description | Scoring |
|------|-------------|---------|
| `road` | Highway connections | 1 pt/tile when complete |
| `costco` | Costco shopping areas (cities) | 2 pts/tile + 2 pts/pennant when complete |
| `mcdonalds` | McDonald's restaurants (monasteries) | 9 pts when surrounded by 8 tiles |
| `field` | Grass areas (no scoring yet) | End-game scoring (not implemented) |
| `mixed` | Combination terrain | Depends on features |

### Feature Completion

- **Roads**: Complete when forming a loop or terminating at road ends
- **Costcos**: Complete when fully enclosed (no open edges) with 2+ tiles
- **McDonalds**: Complete when all 8 surrounding positions have tiles

### Tile Definition Structure

```typescript
interface TileDefinition {
  id: string;
  name: string;
  edges: { north, east, south, west: TerrainType };
  center: TerrainType;
  roadConnections: string[][];      // e.g., [["north", "south"]]
  costcoZones: CostcoSegment[];     // Complex Costco area definitions
  isStart?: boolean;
}

interface CostcoSegment {
  id: string;
  segments: (Direction | "center")[];
  hasPennant?: boolean;
  shape?: "curved" | "straight" | "complex";
}
```

---

## Internationalization (i18n)

### Using Translations

```typescript
import useTranslations from "@/hooks/useTranslations";

const MyComponent = () => {
  const { t } = useTranslations();

  return <h1>{t("app.title")}</h1>;

  // With interpolation
  const msg = t("messages.placedTile", { playerName: "Alice", x: 5, y: 3 });
};
```

### Translation Files

Located in `src/content/translations/`:
- `en.json` - English translations (default)

Key namespaces: `app.*`, `setup.*`, `game.*`, `features.*`, `messages.*`, `help.*`

### Adding New Translations

1. Add key to `src/content/translations/en.json`
2. Use `t('namespace.key')` in components
3. For variables: use `{variableName}` in JSON, pass object to `t()`

---

## AI System

The `SimpleAI` class uses weighted heuristics for move selection:

```typescript
// Default weights (src/ai.ts)
const defaultWeights = {
  completion: 6,      // Weight for completing features
  adjacency: 1,       // Weight for placing next to existing tiles
  costcoPreference: 2 // Preference for Costco tiles
};
```

AI evaluates all valid placements across 4 rotations and selects the highest-scoring move. The AI:
- Prioritizes completing features
- Prefers higher adjacency counts
- Always claims McDonald's when available with sufficient followers

### AI Delays

AI moves have a 1-second delay for human observation (see `GameBoard.tsx` useEffect).

---

## Known Issues & TODOs

See `TODO.md` for detailed development roadmap. Key items:

### Critical Fixes Needed
- Majority rule calculation (currently awards to all claimants, not just majority)
- Remove 2-tile minimum for Costco completion
- Add feature claim validation (prevent illegal claims)

### Missing Features
- Field/farmer mechanics (farmers on fields scoring for adjacent Costcos)
- Performance optimizations (requestAnimationFrame, memoization)
- Strict null checks disabled in tsconfig

---

## Common Tasks

### Adding a New Tile Type

1. Add definition to `src/tileLibrary.ts`
2. Include in `buildDeck()` with quantity
3. Define edges, center, roadConnections, and costcoZones
4. Add visual rendering in `src/utils/tileRendering.ts` if needed

### Adding a New Game Phase

1. Add to `GamePhase` enum in `src/types.ts`
2. Update `TurnManager` for phase transitions
3. Add conditional rendering in `GameBoard.tsx`
4. Update tests

### Modifying Scoring

1. Edit `ScoreManager.ts` for calculation logic
2. Update `board.ts` completion detection if needed
3. Add tests in `src/test/game.test.ts`

### Adding UI Components

1. Use shadcn/ui patterns from `src/components/ui/`
2. Follow existing Tailwind class conventions
3. Use `font-game` class for game-specific typography
4. Create stories in `src/components/*.stories.tsx`

---

## Debugging Tips

### Canvas Issues

```typescript
// Log canvas state for debugging
console.log("Screen pos:", mouseEvent.clientX, mouseEvent.clientY);
console.log("Canvas pos:", canvasX, canvasY);
console.log("World pos:", worldPos.x, worldPos.y);
```

### Tile Placement Failures

Check edge matching in `board.ts`:
```typescript
// Tiles must match terrain types on adjacent edges
const neighborEdge = neighborTile.getEdge(OPPOSITE[direction]);
if (tile.getEdge(direction) !== neighborEdge) {
  return false;  // Invalid placement
}
```

### State Debugging

```typescript
// In React components
console.log("Game phase:", gameState.phase);
console.log("Current player:", gameState.players[gameState.currentPlayerIndex]);
console.log("Valid placements:", game.getValidPlacements());
```

---

## Code Style

- **No `any` types**: Replace with proper interfaces from `src/types.ts`
- **Structured results**: Methods return objects with `.success`, `.completedFeatures`, etc.
- **JSDoc comments**: Add to public methods
- **Import aliases**: Prefer `@/` over relative paths for src imports
- **Component files**: PascalCase `.tsx` files in `src/components/`
- **No emojis in code** unless explicitly requested

---

## Git Workflow

- Run `npx tsc --noEmit` before commits
- Run `npm test` to ensure tests pass
- Coverage must meet 80% thresholds
- Commit messages should be descriptive and reference related issues
