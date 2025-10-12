# American Title Trails - AI Coding Instructions

## Project Overview

American Title Trails is a Carcassonne-inspired tile-placement board game built with TypeScript, React, and HTML5 Canvas. The game features American-themed elements (McDonald's abbeys, Costco castles, highway roads) with local multiplayer support and AI opponents.

## Architecture & Core Patterns

### Game State Architecture

- **Game Flow**: `Game` class manages state through phases (`GamePhase` enum): `PLACE_TILE` → `CLAIM_FEATURE` → `SCORE_FEATURES` → `END_TURN`
- **State Management**: Uses listener pattern with `setStateChangeListener()` for React component updates
- **Class Structure**: Core game logic in ES6 classes (`Game`, `Board`, `Tile`, `Player`, `SimpleAI`) with TypeScript interfaces for data contracts

### Key Architectural Decisions

- **Separation of Concerns**: Pure game logic classes are framework-agnostic; React components handle UI/UX only
- **Immutable Tile System**: Tiles are rotated via `tile.rotate(times)` creating new instances rather than mutating state
- **Position-Based Board**: Uses string keys `"x,y"` for tile positions with helper functions `positionKey()` and `parsePositionKey()`
- **Canvas Rendering**: All visual tile rendering happens in `BoardCanvas.tsx` using HTML5 Canvas for performance

### Data Flow Patterns

1. **React → Game Classes**: UI events call game methods directly (`game.placeTile()`, `game.claimFeature()`)
2. **Game Classes → React**: State changes propagate via registered listeners to update React state
3. **AI Integration**: AI moves processed asynchronously with 1-second delays in `useEffect` hooks

## Development Workflow

### Essential Commands

```bash
npm run dev        # Vite dev server on http://localhost:3000 (auto-opens browser)
npm run build      # TypeScript compilation + Vite production build
npx tsc --noEmit   # Type checking without building
```

### Project Structure Navigation

- **Core Logic**: `src/{game,board,tile,player,ai}.ts` - Pure TypeScript classes
- **Type Definitions**: `src/types.ts` - All shared interfaces and enums
- **Game Data**: `src/tileLibrary.ts` - 41 tile definitions with terrain/feature data
- **React Components**: `src/components/` - UI layer with shadcn/ui design system
- **Canvas Rendering**: `src/components/BoardCanvas.tsx` - Hardware-accelerated pixel art

### Configuration Details

- **Path Mapping**: Uses `@/*` alias pointing to `src/*` (configured in both `vite.config.ts` and `tsconfig.json`)
- **Strict TypeScript**: Enabled with `noUnusedLocals` and `noUnusedParameters` for code quality
- **Module System**: ES modules with `"type": "module"` in package.json

## Code Patterns & Conventions

### Tile System Pattern

```typescript
// Tiles are immutable - rotation creates new instances
const rotatedTile = tile.rotate(1); // 90° clockwise
const placement = board.canPlaceTile(tile, position); // Validation before placement
```

### Game State Updates

```typescript
// All state changes go through the Game class with listener notifications
game.setStateChangeListener((newState) => {
  setGameState(newState);
  // React components respond to state changes
});
```

### AI Decision Making

```typescript
// AI uses heuristic scoring with configurable weights
const ai = new SimpleAI({
  completionWeight: 6, // Prioritize completing features
  adjacencyWeight: 1, // Prefer connecting to existing tiles
  costcoWeight: 2, // Value Costco zones higher
});
```

### Canvas Interaction Pattern

```typescript
// Canvas handles viewport transformation and click-to-world coordinate conversion
const worldPos = screenToWorld(canvasPos, canvasState);
const validPlacements = board.getPlacementCandidates();
```

## Key Integration Points

### React-Game Class Bridge

- **State Synchronization**: `GameBoard.tsx` manages the bridge between React state and game class instances
- **Event Handling**: UI events (`onClick`, `useEffect` for AI turns) trigger game class methods
- **Async AI**: AI moves use `setTimeout()` for user-visible delays, with cleanup on component unmount

### Canvas-React Integration

- **Performance**: Canvas rendering happens in `requestAnimationFrame` loops for smooth updates
- **Input Handling**: Mouse events converted from screen coordinates to world coordinates using transformation matrix
- **State Binding**: Canvas re-renders when React state changes via `useEffect` dependencies

### UI Component Patterns

- **shadcn/ui Integration**: Uses Radix UI components (`@radix-ui/react-*`) with custom styling
- **Game Phase Conditional Rendering**: Components show/hide based on `gameState.phase` enum values
- **Player Color System**: CSS custom properties for dynamic player colors in UI

## Debugging & Common Issues

### Type Safety Patterns

- Always use interfaces from `src/types.ts` for cross-component communication
- Game class methods return structured results (`PlacementResult`, `ScoringEvent`) rather than success booleans
- Use TypeScript's strict mode to catch coordinate system mismatches early

### Canvas Debugging

- Enable `showGrid` and `showValidPlacements` props in `BoardCanvas` for visual debugging
- Check console for coordinate transformation errors when tiles don't place correctly
- Verify tile edge matching logic in `board.canPlaceTile()` for placement validation issues
