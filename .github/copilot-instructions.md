# American Title Trails - AI Coding Instructions

## Project Overview

American Title Trails is a Carcassonne-inspired tile-placement board game built with TypeScript, React, and HTML5 Canvas. The game features American-themed elements (McDonald's abbeys, Costco castles, highway roads) with local multiplayer support and AI opponents.

## Architecture & Core Patterns

### Game State Architecture

The game uses a **listener pattern** for React integration, separating pure game logic from UI:

```typescript
// Game class manages state through phases
enum GamePhase {
  PLACE_TILE → CLAIM_FEATURE → SCORE_FEATURES → END_TURN → GAME_OVER
}

// React components subscribe to state changes
game.setStateChangeListener((state) => {
  setGameState(state);  // Triggers re-render
});

// All game mutations happen through Game class methods
game.placeTile(position, rotation);  // Returns PlacementResult
game.claimFeature(type, identifier); // Returns boolean success
```

**Critical**: Game logic classes (`Game`, `Board`, `Tile`, `Player`, `SimpleAI`) are framework-agnostic. React components in `src/components/` only handle UI/UX.

### Position-Based Board System

The board uses **string keys** for spatial indexing (not 2D arrays):

```typescript
// Helper functions in src/board.ts
const positionKey = ({ x, y }: Position): string => `${x},${y}`;
const parsePositionKey = (key: string): Position => {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
};

// Board storage
private readonly tiles: Map<string, TileRecord>;  // Key: "x,y"
```

**When editing board logic**: Always use `positionKey()` to convert Position→string for Map operations. Never manually construct `"x,y"` strings outside these helpers.

### Immutable Tile System

Tiles **never mutate** - rotation creates new instances:

```typescript
// src/tile.ts pattern
rotate(times: number): Tile {
  // Rotates edges, connections, and costcoZones
  return new Tile(/* rotated definition */);
}

// Usage in game code
const rotatedTile = tile.rotate(rotation); // Creates new tile
board.placeTile(rotatedTile, position);     // Places immutable tile
```

**When modifying tiles**: Always return new `Tile` instances. The `TileDefinition` in `tileLibrary.ts` is the source of truth.

### Costco Zone Complex Features

Costco areas follow Carcassonne city mechanics (not road-like):

```typescript
// src/types.ts - Support curved boundaries, pennants, multiple segments
interface CostcoSegment {
  id: string; // Unique within tile
  segments: (Direction | "center")[]; // Areas this covers
  hasPennant?: boolean; // Gas station marker
  shape?: "curved" | "straight" | "complex";
}
```

**Key behavior** (see `board.ts` completion logic):

- Costco areas must be **fully enclosed** (no open edges)
- Adjacent Costco edges auto-connect into larger complexes
- Completion detection uses flood-fill from each segment
- Scoring: 2pts/tile + 2pts/pennant (complete), 1pt/tile + 1pt/pennant (incomplete)

## Development Workflow

### Essential Commands

```bash
npm run dev        # Vite dev server on http://localhost:3000 (auto-opens)
npm run build      # TypeScript + Vite production build
npx tsc --noEmit   # Type check without emitting (run this before commits)

npm test           # Run Vitest unit tests
npm run test:ui    # Open Vitest browser UI
npm run test:coverage  # Generate coverage report (80% thresholds)

npm run storybook  # Launch Storybook on port 6006 for component development
npm run build-storybook  # Build static Storybook for deployment
```

### Testing Infrastructure (Vitest)

**Test setup** (see `vitest.config.ts`):

- Uses jsdom environment for React testing
- Path alias `@/` resolves to `src/`
- Coverage thresholds: 80% branches/functions/lines/statements
- Setup file: `src/test/setup.ts` imports @testing-library/jest-dom

**Test patterns** (see `src/test/*.test.ts`):

```typescript
// Core game logic tests
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

**When adding features**: Write tests in `src/test/` alongside implementation. Mock AI delays with `vi.fn()`.

### Project Structure Navigation

- **Core Logic**: `src/{game,board,tile,player,ai}.ts` - Pure TypeScript classes (569, 537, 100+ lines)
- **Type Definitions**: `src/types.ts` - All shared interfaces (`Position`, `TileDefinition`, `GamePhase`, etc.)
- **Game Data**: `src/tileLibrary.ts` - 41 tile definitions with `costcoZones`, `roadConnections`
- **React Components**: `src/components/{GameSetup,GameBoard,BoardCanvas}.tsx` - UI layer
- **UI Components**: `src/components/ui/` - shadcn/ui design system components (Button, Card, Dialog, etc.)
- **Utilities**: `src/directions.ts` - Direction helpers (`OPPOSITE`, `DELTAS`, `rotateDirection`)
- **Canvas Rendering**: `src/utils/tileRendering.ts` + `BoardCanvas.tsx` - Pixel art drawing
- **Content System**: `src/content/{translations,help}/` - i18n strings and help documentation
- **Hooks**: `src/hooks/useTranslations.ts` - Translation hook for internationalization
- **Stories**: `src/components/*.stories.tsx` + `src/stories/` - Storybook component documentation

### Configuration Details

- **Path Mapping**: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.json`)
- **Strict TypeScript**: Enabled with `noUnusedLocals`, `noUnusedParameters`, `downlevelIteration` for Set/Map ops
- **Module System**: ES modules with `"type": "module"` in package.json
- **Dev Server**: Vite on port 3000 with auto-open browser
- **Storybook**: Port 6006, configured in `.storybook/main.ts` with addons for docs, a11y, and vitest integration

## Storybook Component Development

### Story Structure

Stories are located in `src/components/*.stories.tsx` and `src/stories/`:

```typescript
// src/components/TileRenderer.stories.tsx pattern
import type { Meta, StoryObj } from "@storybook/react";
import { TileRenderer } from "./TileRenderer";

const meta: Meta<typeof TileRenderer> = {
  title: "Game/TileRenderer",
  component: TileRenderer,
  parameters: {
    layout: "centered",
  },
};
```

**When creating stories**:

- Use descriptive titles with category prefixes (e.g., `"Game/TileRenderer"`)
- Include accessibility addon tests (`@storybook/addon-a11y`)
- Document component props and usage in story metadata
- Create multiple stories showing different states (default, edge cases, interactions)

### Key Stories

- `TileRenderer.stories.tsx` - Individual tile rendering with rotation controls
- `TileGallery.stories.tsx` - Visual gallery of all tile types
- `TileQuantities.stories.tsx` - Tile distribution and deck composition

**Storybook addons configured**:

- `@chromatic-com/storybook` - Visual regression testing
- `@storybook/addon-docs` - Auto-generated documentation
- `@storybook/addon-a11y` - Accessibility testing
- `@storybook/addon-vitest` - Component testing integration

## Internationalization (i18n) System

### Translation Hook Pattern

All user-facing strings use the `useTranslations` hook:

```typescript
// In any component
import useTranslations from "@/hooks/useTranslations";

const MyComponent = () => {
  const { t } = useTranslations();

  // Simple translation
  return <h1>{t("app.title")}</h1>;

  // With variable interpolation
  const message = t("messages.placedTile", {
    playerName: "Alice",
    x: 5,
    y: 3,
  });
  // Result: "Alice placed tile at (5, 3)"
};
```

### Translation File Structure

Located in `src/content/translations/`:

- `en.json` - English translations (default)
- `index.ts` - Exports for centralized access

**Key translation namespaces**:

- `app.*` - Application-level strings (title, tagline)
- `setup.*` - Game setup screen
- `game.*` - Main game interface
- `features.*` - Feature claiming UI
- `messages.*` - User feedback and log messages
- `help.*` - Help documentation content

**When adding UI text**:

1. Add key to `src/content/translations/en.json`
2. Use `t()` function with dot notation: `t('namespace.key')`
3. For variables, use `{variableName}` syntax in JSON and pass object to `t()`
4. Test that missing keys trigger console warnings

### Help Content System

Help documentation in `src/content/help/`:

- `en.md` - Markdown-formatted help content
- `en.ts` - TypeScript export of help text
- Rendered in `HelpModal.tsx` using `react-markdown`

**When updating help**:

- Edit the `.md` file for readability
- Run `npm run sync-help-content en` to sync to `.ts` file
- Supports GitHub Flavored Markdown (tables, task lists, etc.)

## Code Patterns & Conventions

### Direction System (Critical for Tile Logic)

```typescript
// src/directions.ts - Used everywhere in game logic
export const DIRECTIONS: Direction[] = ["north", "east", "south", "west"];
export const OPPOSITE: Record<Direction, Direction> = { north: "south", ... };
export const DELTAS: Record<Direction, Position> = { north: {x:0, y:-1}, ... };

// Rotation is always clockwise by 90° increments
rotateDirection(direction, times); // times=1 → 90° CW, times=-1 → 90° CCW
```

**When editing placement logic**: Use `DELTAS[direction]` to get neighbor positions. Use `OPPOSITE[direction]` to validate edge matching.

### Game Phase Conditional Logic

React components render conditionally based on `gameState.phase`:

```typescript
// src/components/GameBoard.tsx pattern
{
  gameState.phase === GamePhase.CLAIM_FEATURE &&
    claimableFeatures.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {claimableFeatures.map((feature) => (
          <Button
            onClick={() => handleClaimFeature(feature.type, feature.identifier)}
          >
            {feature.displayName}
          </Button>
        ))}
      </div>
    );
}
```

**When adding game phases**: Update the `GamePhase` enum in `src/game.ts`, then add conditional rendering in `GameBoard.tsx`.

### AI Integration Pattern

AI moves are **async with delays** for UX (see `GameBoard.tsx` lines 45-65):

```typescript
useEffect(() => {
  if (
    !game ||
    !gameState ||
    !gameState.players[gameState.currentPlayerIndex]?.isAI
  )
    return;

  const timeoutId = setTimeout(() => {
    // AI decision logic here
    game.autoPlayAI();
  }, 1000); // 1-second delay for human observation

  return () => clearTimeout(timeoutId); // Cleanup on unmount
}, [gameState?.currentPlayerIndex, gameState?.phase]);
```

**When modifying AI**: Edit heuristic weights in `src/ai.ts` (`SimpleAI` class). AI uses `planMove()` to evaluate all valid placements with scoring.

### Canvas Rendering Patterns

Tile rendering happens in `BoardCanvas.tsx` with coordinate transformation:

```typescript
// Canvas state includes viewport offset and zoom
const canvasState = { offsetX, offsetY, scale, tileSize };

// Mouse clicks convert to world coordinates
const worldPos = screenToWorld(clickPos, canvasState);

// Rendering loop
tiles.forEach((record) => {
  const x = (record.position.x - minX) * scaledTileSize + offsetX;
  const y = (record.position.y - minY) * scaledTileSize + offsetY;
  renderTileToCanvas(ctx, record.tile, x, y, scaledTileSize);
});
```

**When debugging rendering**: Log `canvasState` to check viewport transformation. Use browser DevTools to inspect canvas pixel output.

**Future enhancement**: Consider implementing `requestAnimationFrame` loop for smoother rendering (currently renders on state changes).

## Key Integration Points

### Feature Completion Detection

Feature completion is **complex** (see `board.ts` lines 140-470):

1. **Roads**: Flood-fill from placed tile through `roadConnections` until dead-end or loop
2. **Costco**: Flood-fill through `costcoZones` segments, check all edges are enclosed
3. **McDonalds**: Check if all 8 surrounding tiles exist

```typescript
// Pattern for adding new feature types
const feature: Feature = {
  type: "costco",
  tiles: new Set(["0,0", "1,0"]), // Position keys
  edges: new Set(["0,0:north"]), // Open edges
  isComplete: edges.size === 0, // No open edges
  pennants: 2, // Bonus scoring
};
```

### Follower Placement System

Followers claim features via `board.claimFeature()`:

```typescript
// src/board.ts - Creates feature claim record
this.featureClaims.set(featureKey, {
  edge: `${positionKey(position)}:${identifier}`,
  type: "costco",
  players: [playerId]
});

// Followers return when features complete
const claimedBy = /* determine majority owners from featureClaims */;
completedFeature.claimedBy = claimedBy;
```

**When scoring**: Use `featureClaims` Map to find which players claimed completed features. Remove claims after scoring.

## Debugging & Common Issues

### Type Safety Patterns

- **Never use `any`**: Current `gameState` in `GameBoard.tsx` has a TODO comment to replace with proper interface from `src/types.ts`
- **Structured Results**: Methods return `PlacementResult`, `ScoringEvent`, not booleans. Check `.success` and `.completed` fields.
- **Strict Null Checks**: Enable in tsconfig for better safety (currently disabled).

### Canvas Debugging

```typescript
// Add to BoardCanvas.tsx for visual debugging
const showGrid = true; // Draw grid lines
const showValidPlacements = true; // Highlight green squares

// Common coordinate issues
console.log("Screen pos:", mouseEvent.clientX, mouseEvent.clientY);
console.log("Canvas pos:", canvasX, canvasY);
console.log("World pos:", worldPos.x, worldPos.y);
```

### Common Edge-Matching Issues

Tiles must match terrain types on adjacent edges:

```typescript
// src/board.ts validation
const neighborTile = neighbors[direction]?.tile;
const neighborEdge = neighborTile.getEdge(opposite[direction]);
if (tile.getEdge(direction) !== neighborEdge) {
  return false; // Invalid placement
}
```

**When tiles won't place**: Check `tile.edges` in tileLibrary.ts. Ensure rotated edges align with neighbors using `OPPOSITE` mapping.
