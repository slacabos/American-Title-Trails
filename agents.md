# AGENTS.md - AI Assistant Guide for American Tile Trails

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

- **TypeScript 5.2** with strict mode enabled
- **React 18** with hooks for state management
- **Vite 5** for development server and builds (port 3000)
- **HTML5 Canvas** for tile and board rendering
- **Tailwind CSS 4** with `@theme inline` configuration (no `tailwind.config.js`)
- **Radix UI** primitives with shadcn/ui component patterns
- **Vitest 3** for unit testing with 80% coverage thresholds
- **Storybook 9** for component documentation (stories colocated with components)
- **react-markdown** with remark-gfm and rehype-raw for help content rendering

---

## Architecture

### Core Design Principles

1. **Framework-agnostic game logic**: Core classes (`Game`, `Board`, `Tile`, `Player`) and managers contain pure TypeScript logic with no React dependencies
2. **Interface-based design**: `ITile` and `IBoard` interfaces enable testability and loose coupling between game engine and managers
3. **Listener pattern for React integration**: Game state changes trigger callbacks that update React components
4. **Immutable tiles**: Rotation creates new `Tile` instances rather than mutating existing ones
5. **Position-based spatial indexing**: Board uses `Map<string, TileRecord>` with `"x,y"` string keys
6. **Strategy pattern for AI**: Multiple AI difficulty levels implement a shared `AIStrategy` interface

### State Management Flow

```
User Action → Game Method → State Change → Listener Callback → React Re-render
                ↓
          Phase Transition: PLACE_TILE → CLAIM_FEATURE → SCORE_FEATURES → END_TURN
```

No external state library is used. React's built-in `useState`/`useEffect` hooks manage component state, with the `Game` class as the single source of truth for game state.

### Manager Classes (`src/managers/`)

The game logic is decomposed into single-responsibility managers:

| Manager               | Responsibility                                                    |
| --------------------- | ----------------------------------------------------------------- |
| `ScoreManager`        | Score calculation, final scoring, farmer scoring, score breakdown |
| `TurnManager`         | Turn flow, phase transitions, player rotation                     |
| `TileManager`         | Tile deck, drawing, rotation, valid placements                    |
| `FeatureClaimManager` | Feature claiming logic, claimable feature detection, label gen    |
| `PlayerManager`       | Player state (followers, colors, names), initialization           |

---

## Project Structure

```
src/
├── components/               # React UI components (stories colocated)
│   ├── App.tsx               # Root component, toggles setup/game views
│   ├── GameBoard.tsx         # Main game interface with controls and sidebar
│   ├── BoardCanvas.tsx       # HTML5 Canvas rendering with zoom/pan
│   ├── GameSetup.tsx         # Player configuration screen
│   ├── GameSetupSidebar.tsx  # Info sidebar for setup screen
│   ├── PlayerConfigRow.tsx   # Individual player config (name, AI toggle)
│   ├── TileRenderer.tsx      # Individual tile rendering component
│   ├── GameOverPanel.tsx     # End-game results with score breakdown
│   ├── FollowerDetails.tsx   # Follower count/breakdown display
│   ├── HelpModal.tsx         # Help documentation modal
│   ├── MarkdownRenderer.tsx  # Markdown content renderer
│   ├── *.stories.tsx         # Storybook stories (colocated with components)
│   └── ui/                   # shadcn/ui design system components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       └── separator.tsx
├── ai/                       # AI strategy implementations
│   ├── AIFactory.ts          # Factory for creating AI by difficulty
│   ├── AIStrategy.ts         # AIStrategy interface and AI types
│   ├── RandomAI.ts           # Easy difficulty (random valid moves)
│   ├── SimpleAI.ts           # Medium difficulty (weighted heuristics)
│   ├── StrategicAI.ts        # Hard + Expert difficulty (look-ahead search)
│   ├── index.ts              # Module exports
│   └── evaluators/           # AI evaluation sub-modules
│       ├── TilePlacementEvaluator.ts  # Scores position × rotation combos
│       └── FeatureAnalyzer.ts         # Estimates feature values
├── managers/                 # Game logic managers (see table above)
├── interfaces/               # TypeScript interfaces for game engine
│   ├── ITile.ts              # Tile contract (getEdge, rotate, clone)
│   ├── IBoard.ts             # Board contract (placement, tracing, claiming)
│   └── index.ts              # Re-exports
├── hooks/                    # Custom React hooks
│   └── useTranslations.ts    # i18n hook with interpolation support
├── constants/                # Game rules and color constants
│   ├── gameRules.ts          # All game rule constants (GAME_RULES)
│   └── colors.ts             # GAME_COLORS, TILE_COLORS, PLAYER_COLORS, UI_COLORS
├── content/                  # i18n and help content
│   ├── translations/         # JSON translation files (en.json)
│   └── help/                 # Markdown help content (en.md → en.ts)
├── utils/                    # Utility functions
│   ├── arrayUtils.ts         # shuffle() with custom RNG support
│   ├── tileRendering.ts      # Canvas drawing utilities
│   ├── followerUtils.ts      # Follower breakdown calculations
│   └── rng.ts                # Seeded RNG for deterministic testing
├── lib/                      # shadcn/ui utilities
│   └── utils.ts              # cn() class name merging
├── test/                     # Test files and setup (9 test files)
├── types/                    # Additional type declarations
│   └── json.d.ts             # JSON module declaration
├── assets/                   # Static assets (icon.png)
├── types.ts                  # All TypeScript interfaces and enums
├── game.ts                   # Game class (main orchestrator)
├── board.ts                  # Board class (tile placement, feature detection)
├── tile.ts                   # Tile class (immutable tile representation)
├── tileLibrary.ts            # 16 unique tile definitions, 52-tile deck
├── player.ts                 # Player class
├── directions.ts             # Direction utilities (DIRECTIONS, OPPOSITE, DELTAS)
└── main.tsx                  # React entry point
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
const key = `${x},${y}`; // Don't do this outside helpers
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
const rotatedTile = tile.rotate(1); // Returns new Tile
board.placeTile(rotatedTile, position);

// TileDefinition in tileLibrary.ts is the source of truth
```

### Game Phases

```typescript
enum GamePhase {
  PLACE_TILE = "place_tile",       // Player placing tile on board
  CLAIM_FEATURE = "claim_feature", // Player optionally claiming a feature
  SCORE_FEATURES = "score_features", // Completed features scored
  END_TURN = "end_turn",           // Draw next tile, switch player
  GAME_OVER = "game_over",         // All tiles placed, final scoring done
}
```

### React State Subscription

```typescript
// In Game class
game.setStateChangeListener((state) => {
  setGameState(state); // Triggers React re-render
});

// All mutations go through Game methods
game.placeTile(position, rotation);
game.claimFeature(type, identifier);
game.skipClaim();
```

### Interface-Based Design

```typescript
// src/interfaces/ITile.ts - consumed by Board and managers
interface ITile {
  id: string;
  name: string;
  center: TerrainType;
  orientation: number;
  roadConnections: string[][];
  costcoZones: CostcoSegment[];
  fieldSegments: FieldSegment[];
  hasMcDonalds: boolean;
  isStart: boolean;
  getEdge(direction: Direction): TerrainType;
  rotate(times: number): ITile;
  clone(): ITile;
}

// src/interfaces/IBoard.ts - consumed by ScoreManager, AI evaluators, etc.
interface IBoard {
  placeTile(tile: ITile, position: Position): PlacementResult;
  canPlace(tile: ITile, position: Position): boolean;
  getPlacementCandidates(): Position[];
  traceCostcoFeature(...): Feature;
  traceRoadFeature(...): Feature;
  traceFieldFeature(...): Feature;
  findAdjacentCostcos(fieldFeature: Feature): CostcoFeature[];
  // ... more methods
}
```

---

## Development Workflow

### Essential Commands

| Command                        | Description                                           |
| ------------------------------ | ----------------------------------------------------- |
| `npm run dev`                  | Start Vite dev server (port 3000, auto-opens browser) |
| `npm run build`                | TypeScript check + Vite production build              |
| `npm run preview`              | Preview production build locally                      |
| `npx tsc --noEmit`             | Type check without emitting (run before commits)      |
| `npm test`                     | Run Vitest unit tests                                 |
| `npm run test:ui`              | Open Vitest browser UI                                |
| `npm run test:coverage`        | Generate coverage report                              |
| `npm run test:ai-sim`          | Run AI simulation tests                               |
| `npm run storybook`            | Launch Storybook (port 6006)                          |
| `npm run lint`                 | Run ESLint on src/                                    |
| `npm run lint:fix`             | Run ESLint with auto-fix                              |
| `npm run sync-help-content en` | Sync help markdown to TypeScript export               |

### Testing

Tests are located in `src/test/` using Vitest with jsdom environment.

**Test Files (9 total):**

| Test File               | Coverage Area                                       |
| ----------------------- | --------------------------------------------------- |
| `board.test.ts`         | Tile placement, feature tracing, completion detection|
| `ai.test.ts`            | All AI strategies (Random, Simple, Strategic, Expert)|
| `field.test.ts`         | Field tracing, adjacent Costco detection, farmers    |
| `scoreManager.test.ts`  | Complete/incomplete scoring, farmer scoring, majority|
| `game.test.ts`          | Turn flow, phase transitions, game end conditions    |
| `tile.test.ts`          | Tile rotation, edge matching, clone operations       |
| `ai.sim.test.ts`        | Full game simulations, AI performance benchmarks     |
| `gameSetup.test.tsx`    | GameSetup component UI interactions                  |
| `setup.ts`              | Vitest global config, @testing-library/jest-dom      |

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
type FollowerType = "standard" | "farmer";
type FieldCorner = "nw" | "ne" | "sw" | "se";
```

| Type        | Description                          | Completed Scoring                        | Incomplete Scoring (end-game)             |
| ----------- | ------------------------------------ | ---------------------------------------- | ----------------------------------------- |
| `road`      | Highway connections                  | 1 pt/tile                                | 1 pt/tile                                 |
| `costco`    | Costco shopping areas (cities)       | 2 pts/tile + 2 pts/pennant              | 1 pt/tile + 1 pt/pennant                  |
| `mcdonalds` | McDonald's restaurants (monasteries) | 9 pts (all 8 surrounding tiles filled)   | 1 pt per tile in 3×3 area                 |
| `field`     | Grass areas (farmers)                | N/A (end-game only)                      | 3 pts per adjacent completed Costco       |
| `mixed`     | Combination terrain                  | Depends on features                      | Depends on features                       |

### Feature Completion

- **Roads**: Complete when forming a loop or terminating at both ends (intersections, Costcos, dead-ends)
- **Costcos**: Complete when fully enclosed (no open edges) with 2+ tiles
- **McDonalds**: Complete when all 8 surrounding positions have tiles

### Follower System

- Each player starts with **7 followers** (configurable in `GAME_RULES.FOLLOWERS_PER_PLAYER`)
- **Standard followers**: Placed on roads, Costcos, or McDonald's; returned when features complete
- **Farmers**: Placed on fields (corner-based); remain on board until game end
- **Majority rule**: Only player(s) with the most followers on a feature score; ties award full points to all tied players
- A feature can only be claimed if no player already has a follower on it (but features can merge, creating shared claims)

### Scoring Categories

```typescript
const SCORE_CATEGORIES = [
  "completed_road",
  "completed_costco",
  "completed_mcdonalds",
  "incomplete_costco",
  "incomplete_road",
  "incomplete_mcdonalds",
  "farmers",
] as const;

type ScoreBreakdown = Record<string, Record<ScoreCategory, number>>;
```

### Game Rules Constants (`src/constants/gameRules.ts`)

```typescript
export const GAME_RULES = {
  FOLLOWERS_PER_PLAYER: 7,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 5,
  MCDONALDS_MAX_SCORE: 9,
  MCDONALDS_SURROUNDING_TILES: 8,
  MCDONALDS_POINTS_PER_TILE: 1,
  COSTCO_POINTS_PER_TILE_COMPLETE: 2,
  COSTCO_PENNANT_BONUS_COMPLETE: 2,
  COSTCO_POINTS_PER_TILE_INCOMPLETE: 1,
  COSTCO_PENNANT_BONUS_INCOMPLETE: 1,
  ROAD_POINTS_PER_TILE: 1,
  FARMER_POINTS_PER_COSTCO: 3,
  AI_MOVE_DELAY_MS: 1000,
  AI_CLAIM_THRESHOLD: 2,
  AI_DEFAULT_DIFFICULTY: "medium",
  AI_EASY_CLAIM_CHANCE: 0.15,
  AI_MEDIUM_MIN_FOLLOWERS: 1,
  AI_HARD_SEARCH_DEPTH: 2,
  AI_HARD_MAX_SEARCH_TIME_MS: 400,
  AI_EXPERT_SEARCH_DEPTH: 3,
  AI_EXPERT_MAX_SEARCH_TIME_MS: 600,
  TILE_ROTATIONS: 4,
} as const;
```

### Tile Definition Structure

```typescript
interface TileDefinition {
  id: string;
  name: string;
  edges: { north; east; south; west: TerrainType };
  center: TerrainType;
  roadConnections: string[][]; // e.g., [["north", "south"]]
  costcoZones: CostcoSegment[];
  fieldSegments?: FieldSegment[];
  isStart?: boolean;
}

interface CostcoSegment {
  id: string;
  segments: (Direction | "center")[];
  hasPennant?: boolean;
  shape?: "curved" | "straight" | "complex";
}

interface FieldSegment {
  id: string;
  corners: FieldCorner[]; // e.g., ["nw", "ne"]
}
```

There are **16 unique tile definitions** forming a **52-tile deck** (plus 1 starting tile).

---

## AI System

### Architecture

The AI uses a **strategy pattern** with four difficulty levels, all implementing the `AIStrategy` interface:

```typescript
interface AIStrategy {
  evaluateTilePlacements(context: AIContext): TilePlacement[];
  evaluateMeeplePlacement(context: AIContext, position: Position): MeeplePlacement | null;
  getBestMove(context: AIContext): AIDecision | null;
}
```

### Difficulty Levels

| Difficulty | Class          | Strategy                                              |
| ---------- | -------------- | ----------------------------------------------------- |
| Easy       | `RandomAI`     | Random valid placements, 15% feature claim chance     |
| Medium     | `SimpleAI`     | Weighted heuristic evaluation with feature analysis   |
| Hard       | `StrategicAI`  | Look-ahead search (depth 2, 400ms), defensive play    |
| Expert     | `ExpertAI`     | Deeper look-ahead (depth 3, 600ms), aggressive balance|

### AI Factory

```typescript
// src/ai/AIFactory.ts
const ai = AIFactory.create("hard"); // Returns StrategicAI instance
AIFactory.getDifficultyLevels();      // Returns metadata for all difficulties
AIFactory.getDifficultyName("hard");  // "Hard"
AIFactory.getDifficultyDescription("hard"); // Description string
```

### Tile Placement Evaluation (`src/ai/evaluators/TilePlacementEvaluator.ts`)

Evaluates all valid position × rotation combinations with weighted scoring factors:

- **Completion**: Immediate points from completing features
- **Adjacency**: Prefer positions with more neighbors
- **Costco preference**: Bonus for Costco-related placements
- **Extension**: Bonus for extending the player's own claimed features
- **Blocking**: Bonus for interfering with opponent features
- **Position**: Slight preference for center-of-board positions

### Feature Analyzer (`src/ai/evaluators/FeatureAnalyzer.ts`)

Estimates feature values by analyzing:

- Current points if completed now
- Potential points with growth
- Completion probability
- Total expected value

Feature-specific analysis for Costcos (size, open edges), roads (length, open ends), McDonald's (surrounding tile count), and fields (adjacent Costco count).

### AI Decision Flow

1. Get valid placement positions from board
2. Evaluate all position × rotation combinations (TilePlacementEvaluator)
3. Sort by score, select best placement
4. Place tile
5. If in claim phase, evaluate claimable features (FeatureAnalyzer)
6. Decide whether to claim based on feature value vs. difficulty thresholds
7. Strategic/Expert AI also considers follower conservation and game progress

### AI Delays

AI moves have a 1-second delay (`GAME_RULES.AI_MOVE_DELAY_MS`) for human observation, managed in `GameBoard.tsx`.

---

## Internationalization (i18n)

### Using Translations

```typescript
import useTranslations from "@/hooks/useTranslations";

const MyComponent = () => {
  const { t, language, changeLanguage, availableLanguages } = useTranslations();

  return <h1>{t("app.title")}</h1>;

  // With interpolation
  const msg = t("messages.placedTile", { playerName: "Alice", x: 5, y: 3 });
};
```

### Translation Files

Located in `src/content/translations/`:

- `en.json` - English translations (default)

Key namespaces: `app.*`, `setup.*`, `game.*`, `features.*`, `messages.*`, `help.*`

### Help Content

Located in `src/content/help/`:

- `en.md` - English help content (Markdown)
- `en.ts` - Generated TypeScript export (use `npm run sync-help-content en` to regenerate)

### Adding New Translations

1. Add key to `src/content/translations/en.json`
2. Use `t('namespace.key')` in components
3. For variables: use `{variableName}` in JSON, pass object to `t()`

---

## Storybook

Stories are **colocated with their components** in `src/components/`. There are **10 story files**:

| Story File                        | Component Covered          |
| --------------------------------- | -------------------------- |
| `TileRenderer.stories.tsx`        | All tile types + rotations |
| `GameSetup.stories.tsx`           | Game setup screen          |
| `GameSetupSidebar.stories.tsx`    | Setup sidebar panel        |
| `PlayerConfigRow.stories.tsx`     | Player configuration row   |
| `GameOverPanel.stories.tsx`       | End-game score breakdown   |
| `FollowerDetails.stories.tsx`     | Follower count display     |
| `HelpModal.stories.tsx`           | Help modal dialog          |
| `MarkdownRenderer.stories.tsx`    | Markdown rendering         |
| `ui/button.stories.tsx`           | Button variants            |

Storybook addons: `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-vitest`, `@chromatic-com/storybook`

---

## Common Tasks

### Adding a New Tile Type

1. Add definition to `src/tileLibrary.ts` (include `fieldSegments` for farmer support)
2. Include in `buildDeck()` with quantity
3. Define edges, center, roadConnections, costcoZones, and fieldSegments
4. Add visual rendering in `src/utils/tileRendering.ts` if needed

### Adding a New Game Phase

1. Add to `GamePhase` enum in `src/types.ts`
2. Update `TurnManager` for phase transitions
3. Add conditional rendering in `GameBoard.tsx`
4. Update tests

### Modifying Scoring

1. Update constants in `src/constants/gameRules.ts`
2. Edit `ScoreManager.ts` for calculation logic
3. Update `board.ts` completion detection if needed
4. Add tests in `src/test/scoreManager.test.ts`

### Adding UI Components

1. Use shadcn/ui patterns from `src/components/ui/`
2. Follow existing Tailwind class conventions
3. Use `font-game` class for game-specific typography (Press Start 2P)
4. Create colocated stories in `src/components/*.stories.tsx`

### Modifying AI Behavior

1. Adjust weights in the relevant AI class (`src/ai/SimpleAI.ts`, `src/ai/StrategicAI.ts`)
2. Tune constants in `src/constants/gameRules.ts` (search depth, timeouts, thresholds)
3. Update evaluators in `src/ai/evaluators/` for new scoring factors
4. Run `npm run test:ai-sim` to validate AI performance

---

## Utilities

### Seeded RNG (`src/utils/rng.ts`)

```typescript
import { createSeededRng, getRng } from "@/utils/rng";

// Deterministic RNG for testing
const rng = createSeededRng(42);
const value = rng(); // Always produces same sequence

// Default RNG (Math.random)
const rng = getRng();
```

### Follower Breakdown (`src/utils/followerUtils.ts`)

```typescript
import { getFollowerBreakdown } from "@/utils/followerUtils";

// Returns { available, onRoads, onCostcos, onMcDonalds, onFields }
const breakdown = getFollowerBreakdown(playerId, availableCount, board);
```

### Array Shuffle (`src/utils/arrayUtils.ts`)

```typescript
import { shuffle } from "@/utils/arrayUtils";

const shuffled = shuffle(array, rng); // Fisher-Yates with custom RNG
```

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
  return false; // Invalid placement
}
```

### State Debugging

```typescript
// In React components
console.log("Game phase:", gameState.phase);
console.log("Current player:", gameState.players[gameState.currentPlayerIndex]);
console.log("Valid placements:", game.getValidPlacements());
```

### AI Debugging

```typescript
// Enable detailed AI logging by examining evaluator output
const placements = evaluator.evaluateTilePlacements(context);
console.log("Top 5 moves:", placements.slice(0, 5));
```

---

## Code Style

- **No `any` types**: Replace with proper interfaces from `src/types.ts` or `src/interfaces/`
- **Structured results**: Methods return objects with `.success`, `.completedFeatures`, etc.
- **JSDoc comments**: Add to public methods
- **Import aliases**: Prefer `@/` over relative paths for src imports
- **Component files**: PascalCase `.tsx` files in `src/components/`
- **Game constants**: Use `GAME_RULES` from `src/constants/gameRules.ts` instead of magic numbers
- **No emojis in code** unless explicitly requested

---

## Git Workflow

- Run `npx tsc --noEmit` before commits
- Run `npm test` to ensure tests pass
- Run `npm run lint` to check for style issues
- Coverage must meet 80% thresholds
- Commit messages should be descriptive and reference related issues
