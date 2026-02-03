# Product Backlog: American Tile Trails

**Last Updated:** February 2026

This document contains prioritized tasks for improving American Tile Trails. Tasks are ordered by priority within each category.

---

## Critical Priority

### TASK-001: Create ITile Interface

**Problem:** Circular dependencies between `Tile` and `types.ts` force the use of `any` types throughout the codebase.

**Requirements:**
- Create `src/interfaces/ITile.ts` with all public Tile methods
- Interface must be importable without causing circular dependencies
- Update `Tile` class to implement `ITile`

**Interface Definition:**
```typescript
import { Direction, TerrainType, CostcoSegment } from "../types";

export interface ITile {
  readonly id: string;
  readonly name: string;
  readonly center: TerrainType;
  readonly roadConnections: string[][];
  readonly costcoZones: CostcoSegment[];
  readonly hasMcDonalds: boolean;
  readonly orientation: number;

  getEdge(direction: Direction): TerrainType;
  rotate(times: number): ITile;
  clone(): ITile;
}
```

**Acceptance Criteria:**
- [ ] Interface file created at `src/interfaces/ITile.ts`
- [ ] Tile class implements ITile
- [ ] No circular dependency errors
- [ ] All existing tests pass

---

### TASK-002: Create IBoard Interface

**Problem:** `Board` class methods are accessed via `(board as any)` casting in ScoreManager, violating type safety.

**Requirements:**
- Create `src/interfaces/IBoard.ts` with all public Board methods
- Include methods currently accessed privately by ScoreManager
- Update `Board` class to implement `IBoard`

**Interface Definition:**
```typescript
import { Position, FeatureClaim, TilePlacementResult, CostcoSegment } from "../types";
import { ITile } from "./ITile";

export interface IBoard {
  // Tile operations
  placeTile(tile: ITile, position: Position): TilePlacementResult;
  getTileAt(position: Position): ITile | null;
  hasTileAt(position: Position): boolean;

  // Placement validation
  getValidPlacements(tile: ITile): Position[];
  isValidPlacement(tile: ITile, position: Position): boolean;

  // Feature operations
  getFeatureClaims(): FeatureClaim[];
  getClaimableFeatures(position: Position, tile: ITile): ClaimableFeature[];

  // Feature analysis (needed by ScoreManager)
  getFeatureClaimants(feature: FeatureForClaimants): string[];
  traceCostcoFeature(position: Position, zone: CostcoSegment, visited: Set<string>): CostcoFeature;
  isCostcoComplete(feature: CostcoFeature): boolean;

  // Board state
  getAllTiles(): Map<string, TileRecord>;
  getBounds(): BoardBounds;
}
```

**Acceptance Criteria:**
- [ ] Interface file created at `src/interfaces/IBoard.ts`
- [ ] Board class implements IBoard
- [ ] Previously private methods are now public
- [ ] All existing tests pass

---

### TASK-003: Create Interfaces Index File

**Problem:** Need clean imports for interface files.

**Requirements:**
- Create `src/interfaces/index.ts` as barrel export

**Implementation:**
```typescript
export { ITile } from "./ITile";
export { IBoard } from "./IBoard";
```

**Acceptance Criteria:**
- [ ] File created at `src/interfaces/index.ts`
- [ ] Can import via `@/interfaces`

---

### TASK-004: Replace `any` Types in GameState Interface

**Problem:** `GameState` interface in `types.ts` uses `any` for board, currentTile, tileDeck, and discardPile.

**Location:** `src/types.ts` lines 117-130

**Current Code:**
```typescript
export interface GameState {
  board: any;
  currentTile?: any;
  tileDeck: any[];
  discardPile: any[];
}
```

**Required Code:**
```typescript
import { IBoard } from "./interfaces/IBoard";
import { ITile } from "./interfaces/ITile";

export interface GameState {
  board: IBoard;
  currentTile?: ITile;
  tileDeck: ITile[];
  discardPile: ITile[];
}
```

**Acceptance Criteria:**
- [ ] No `any` types in GameState
- [ ] TypeScript compiles without errors
- [ ] All tests pass

---

### TASK-005: Replace `any` Type in TileRecord Interface

**Problem:** `TileRecord.tile` is typed as `any`.

**Location:** `src/types.ts` line 83

**Current Code:**
```typescript
export interface TileRecord {
  tile: any;
  position: Position;
}
```

**Required Code:**
```typescript
export interface TileRecord {
  tile: ITile;
  position: Position;
}
```

**Acceptance Criteria:**
- [ ] TileRecord uses ITile type
- [ ] All usages compile correctly

---

### TASK-006: Replace `any` Type in PlacementResult Interface

**Problem:** `PlacementResult.completedFeatures` is typed as `any[]`.

**Location:** `src/types.ts` line 64

**Current Code:**
```typescript
export interface PlacementResult {
  success: boolean;
  completedFeatures?: any[];
}
```

**Required Code:**
```typescript
export interface PlacementResult {
  success: boolean;
  completedFeatures?: CompletedFeature[];
}
```

**Acceptance Criteria:**
- [ ] PlacementResult uses CompletedFeature[] type
- [ ] All usages compile correctly

---

### TASK-007: Remove Type Casting from ScoreManager

**Problem:** ScoreManager accesses Board methods via unsafe `(board as any)` casting.

**Location:** `src/managers/ScoreManager.ts` lines 70, 103, 109, 116

**Current Code:**
```typescript
const claimants = (board as any).getFeatureClaimants(featureForClaimants);
(board as any).tiles.forEach(...);
const feature = (board as any).traceCostcoFeature(...);
if (!(board as any).isCostcoComplete(feature)) {
```

**Required Code:**
```typescript
const claimants = board.getFeatureClaimants(featureForClaimants);
board.getAllTiles().forEach(...);
const feature = board.traceCostcoFeature(...);
if (!board.isCostcoComplete(feature)) {
```

**Dependencies:** TASK-002 (IBoard interface must exist first)

**Acceptance Criteria:**
- [ ] Zero `as any` casts in ScoreManager.ts
- [ ] All scoring functionality works correctly
- [ ] All tests pass

---

### TASK-008: Implement Majority Rule Scoring

**Problem:** Current scoring awards points to ALL players with followers on a completed feature. Correct Carcassonne rules award points only to player(s) with the MOST followers.

**Location:** `src/managers/ScoreManager.ts` method `scoreCompletedFeatures()`

**Current Behavior:**
- Player A has 2 followers on road, Player B has 1 follower
- Both players receive full points (incorrect)

**Required Behavior:**
- Player A has 2 followers on road, Player B has 1 follower
- Only Player A receives points (correct)
- If tied (2 vs 2), both receive full points

**Implementation:**
```typescript
public scoreCompletedFeatures(
  completedFeatures: CompletedFeature[],
  players: PlayerState[]
): void {
  completedFeatures.forEach((feature) => {
    if (!feature.claimedBy || feature.claimedBy.length === 0) return;

    // Count followers per player
    const followerCounts = this.countFollowersPerPlayer(feature);

    // Find maximum follower count
    const maxFollowers = Math.max(...Object.values(followerCounts));

    // Award points only to player(s) with most followers
    Object.entries(followerCounts).forEach(([playerId, count]) => {
      if (count === maxFollowers) {
        const player = players.find((p) => p.id === playerId);
        if (player) {
          player.score += feature.points;
        }
      }
    });

    // Return followers to all claimants
    this.returnFollowers(feature, players);
  });
}

private countFollowersPerPlayer(feature: CompletedFeature): Record<string, number> {
  const counts: Record<string, number> = {};
  feature.claimedBy?.forEach((playerId) => {
    counts[playerId] = (counts[playerId] || 0) + 1;
  });
  return counts;
}
```

**Acceptance Criteria:**
- [ ] Single majority holder receives all points
- [ ] Tied players all receive full points
- [ ] Minority holders receive zero points
- [ ] All followers are returned after scoring

---

### TASK-009: Update Feature Tracking for Multiple Followers

**Problem:** The `claimedBy` array tracks unique player IDs, not individual follower placements. This prevents majority rule from working correctly.

**Location:** `src/board.ts` or `src/managers/FeatureClaimManager.ts`

**Current Behavior:**
- `claimedBy: ["playerA", "playerB"]` - no follower counts

**Required Behavior:**
- `claimedBy: ["playerA", "playerA", "playerB"]` - Player A has 2, Player B has 1

**Acceptance Criteria:**
- [ ] Each follower placement adds an entry to claimedBy
- [ ] Multiple followers from same player are counted correctly
- [ ] Existing claim logic still works

---

### TASK-010: Add Majority Rule Tests

**Problem:** No test coverage for majority rule scoring scenarios.

**Location:** `src/test/scoreManager.test.ts` (new file)

**Test Cases:**
```typescript
describe("ScoreManager", () => {
  describe("scoreCompletedFeatures - majority rule", () => {
    it("should award points only to player with most followers");
    it("should award full points to all tied players");
    it("should not award points to minority follower holders");
    it("should handle single claimant correctly");
    it("should return all followers after scoring");
    it("should handle features with no claimants");
  });
});
```

**Acceptance Criteria:**
- [ ] All 6 test cases implemented and passing
- [ ] Tests cover edge cases (ties, single claimant, no claimants)
- [ ] Test file follows project conventions

---

## High Priority

### TASK-011: Extract Game Rule Constants

**Problem:** Magic numbers are hardcoded throughout the codebase (followers = 7, McDonald's max score = 9, etc.).

**Requirements:**
- Create `src/constants/gameRules.ts`
- Extract all game rule numbers
- Update all files to use constants

**Implementation:**
```typescript
export const GAME_RULES = {
  // Player configuration
  FOLLOWERS_PER_PLAYER: 7,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 5,

  // McDonald's (Monastery) scoring
  MCDONALDS_MAX_SCORE: 9,
  MCDONALDS_SURROUNDING_TILES: 8,
  MCDONALDS_POINTS_PER_TILE: 1,

  // Costco (City) scoring
  COSTCO_POINTS_PER_TILE_COMPLETE: 2,
  COSTCO_POINTS_PER_TILE_INCOMPLETE: 1,
  COSTCO_PENNANT_BONUS_COMPLETE: 2,
  COSTCO_PENNANT_BONUS_INCOMPLETE: 1,

  // Road scoring
  ROAD_POINTS_PER_TILE: 1,

  // Field scoring (future)
  FIELD_POINTS_PER_COMPLETED_COSTCO: 3,

  // AI configuration
  AI_MOVE_DELAY_MS: 1000,
} as const;
```

**Files to Update:**
- `src/player.ts` - followers initialization
- `src/managers/PlayerManager.ts` - followers initialization
- `src/board.ts` - McDonald's scoring logic
- `src/managers/ScoreManager.ts` - all scoring calculations
- `src/components/GameBoard.tsx` - AI delay

**Acceptance Criteria:**
- [ ] Constants file created
- [ ] No hardcoded game rule numbers in source files
- [ ] All tests pass
- [ ] Constants have JSDoc documentation

---

### TASK-012: Configure ESLint

**Problem:** Current ESLint config only has Storybook rules. Need comprehensive TypeScript and React linting.

**Requirements:**
- Install ESLint dependencies
- Create comprehensive configuration
- Add npm scripts

**Dependencies to Install:**
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks
```

**Configuration File:** `.eslintrc.cjs`
```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:storybook/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "warn",
  },
  ignorePatterns: ["dist/", "node_modules/", "*.config.js", "*.config.ts"],
};
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  }
}
```

**Acceptance Criteria:**
- [ ] ESLint dependencies installed
- [ ] Configuration file created
- [ ] `npm run lint` executes without crashing
- [ ] `npm run lint:fix` auto-fixes issues
- [ ] Warnings reported for `any` types

---

### TASK-013: Add JSDoc Documentation to ScoreManager

**Problem:** ScoreManager methods lack documentation for public API.

**Location:** `src/managers/ScoreManager.ts`

**Required Documentation:**
```typescript
/**
 * ScoreManager handles all scoring calculations for American Tile Trails.
 *
 * Responsibilities:
 * - Score completed features during gameplay (with majority rule)
 * - Calculate final scores for incomplete features at game end
 * - Manage feature-specific scoring rules
 *
 * @example
 * const scoreManager = new ScoreManager();
 * scoreManager.scoreCompletedFeatures(completedFeatures, players);
 */
export class ScoreManager {
  /**
   * Scores completed features and awards points to eligible players.
   *
   * Implements the majority rule: only player(s) with the most followers
   * on a feature receive points. In case of a tie, all tied players
   * receive full points.
   *
   * @param completedFeatures - Array of features completed this turn
   * @param players - Array of all players in the game
   *
   * @example
   * // Player A has 2 followers, Player B has 1 follower on a 5-tile road
   * // Result: Player A receives 5 points, Player B receives 0 points
   * scoreManager.scoreCompletedFeatures([roadFeature], players);
   */
  public scoreCompletedFeatures(...) { }

  /**
   * Calculates final scores for all incomplete features at game end.
   *
   * Scoring rules for incomplete features:
   * - Costco: 1 point per tile + 1 point per pennant
   * - Roads: 1 point per tile
   * - McDonald's: 1 point per surrounding tile (including self)
   *
   * @param players - Array of all players
   * @param board - The game board with all placed tiles
   */
  public calculateFinalScores(...) { }
}
```

**Acceptance Criteria:**
- [ ] Class-level JSDoc with responsibilities and example
- [ ] All public methods have JSDoc with @param, @returns, @example
- [ ] Documentation accurately describes majority rule behavior

---

### TASK-014: Add JSDoc Documentation to TurnManager

**Problem:** TurnManager methods lack documentation.

**Location:** `src/managers/TurnManager.ts`

**Required Documentation:**
```typescript
/**
 * TurnManager handles the game's turn-based flow and phase transitions.
 *
 * Game Phase Flow:
 * 1. PLACE_TILE - Active player must place current tile on board
 * 2. CLAIM_FEATURE - Active player may claim a feature (optional)
 * 3. SCORE_FEATURES - Completed features are scored automatically
 * 4. END_TURN - Turn ends, next player becomes active
 *
 * The manager ensures phases transition correctly and validates
 * that actions are only allowed in appropriate phases.
 */
export class TurnManager { }
```

**Acceptance Criteria:**
- [ ] Class-level JSDoc with phase flow documentation
- [ ] All public methods documented

---

### TASK-015: Add JSDoc Documentation to TileManager

**Location:** `src/managers/TileManager.ts`

**Required Documentation:**
```typescript
/**
 * TileManager handles the tile deck and placement validation.
 *
 * Responsibilities:
 * - Building and shuffling the initial tile deck (72 tiles)
 * - Drawing tiles for players
 * - Validating tile placements against board edges
 * - Managing tile rotation (4 orientations)
 * - Handling discarded tiles when no valid placement exists
 */
export class TileManager { }
```

**Acceptance Criteria:**
- [ ] Class-level JSDoc with responsibilities
- [ ] All public methods documented

---

### TASK-016: Add JSDoc Documentation to FeatureClaimManager

**Location:** `src/managers/FeatureClaimManager.ts`

**Acceptance Criteria:**
- [ ] Class-level JSDoc
- [ ] All public methods documented

---

### TASK-017: Add JSDoc Documentation to PlayerManager

**Location:** `src/managers/PlayerManager.ts`

**Acceptance Criteria:**
- [ ] Class-level JSDoc
- [ ] All public methods documented

---

### TASK-018: Create Comprehensive ScoreManager Tests

**Problem:** No test coverage for ScoreManager class.

**Location:** `src/test/scoreManager.test.ts`

**Test Suites:**
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { ScoreManager } from "../managers/ScoreManager";
import { Board } from "../board";
import { PlayerState, CompletedFeature } from "../types";

describe("ScoreManager", () => {
  let scoreManager: ScoreManager;
  let players: PlayerState[];

  beforeEach(() => {
    scoreManager = new ScoreManager();
    players = [
      { id: "p1", name: "Alice", score: 0, followers: 7, color: "red" },
      { id: "p2", name: "Bob", score: 0, followers: 7, color: "blue" },
    ];
  });

  describe("scoreCompletedFeatures", () => {
    it("should award points to single claimant");
    it("should award points only to majority holder");
    it("should award full points to all tied players");
    it("should not award points to minority holders");
    it("should handle features with no claimants");
    it("should score multiple features in sequence");
    it("should return followers after scoring");
  });

  describe("calculateFinalScores", () => {
    it("should score incomplete Costco at 1 point per tile");
    it("should add pennant bonus for incomplete Costco");
    it("should score incomplete roads");
    it("should score incomplete McDonald's");
    it("should handle empty board");
  });
});
```

**Acceptance Criteria:**
- [ ] All test cases implemented
- [ ] Coverage >= 80% for ScoreManager
- [ ] Tests follow project conventions

---

## Medium Priority

### TASK-019: Add React Memoization to GameBoard

**Problem:** Expensive calculations re-run on every render without memoization.

**Location:** `src/components/GameBoard.tsx`

**Required Changes:**
```typescript
// Memoize valid placements
const validPlacements = useMemo(
  () => game.getValidPlacements(),
  [gameState.currentTile, gameState.board]
);

// Memoize game statistics
const gameStats = useMemo(
  () => calculateGameStats(gameState),
  [gameState.players, gameState.tileDeck]
);

// Memoize event handlers
const handleTilePlacement = useCallback(
  (position: Position) => {
    game.placeTile(position, selectedRotation);
  },
  [game, selectedRotation]
);

const handleRotate = useCallback(() => {
  setSelectedRotation((r) => (r + 1) % 4);
}, []);
```

**Acceptance Criteria:**
- [ ] useMemo added for expensive calculations
- [ ] useCallback added for event handlers passed to children
- [ ] No unnecessary re-renders (verify with React DevTools)

---

### TASK-020: Implement Canvas RAF Loop

**Problem:** Canvas redraws completely on every state change. Should use requestAnimationFrame with dirty checking.

**Location:** `src/components/BoardCanvas.tsx`

**Implementation:**
```typescript
useEffect(() => {
  let animationFrameId: number;
  let isDirty = true;

  const markDirty = () => {
    isDirty = true;
  };

  const render = () => {
    if (isDirty && canvasRef.current) {
      drawCanvas();
      isDirty = false;
    }
    animationFrameId = requestAnimationFrame(render);
  };

  render();

  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}, [/* stable dependencies */]);
```

**Acceptance Criteria:**
- [ ] RAF loop implemented
- [ ] Dirty flag prevents unnecessary redraws
- [ ] Cleanup cancels animation frame
- [ ] Visual performance improved

---

### TASK-021: Create Custom Error Types

**Problem:** Errors are thrown as generic Error objects without structured codes.

**Location:** `src/errors/GameError.ts` (new file)

**Implementation:**
```typescript
export class GameError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "GameError";
  }
}

export class InvalidPlacementError extends GameError {
  constructor(reason: string) {
    super(`Invalid tile placement: ${reason}`, "INVALID_PLACEMENT");
  }
}

export class InvalidClaimError extends GameError {
  constructor(reason: string) {
    super(`Invalid feature claim: ${reason}`, "INVALID_CLAIM");
  }
}

export class InvalidPhaseError extends GameError {
  constructor(expectedPhase: string, actualPhase: string) {
    super(
      `Action not allowed in phase ${actualPhase}. Expected: ${expectedPhase}`,
      "INVALID_PHASE"
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Error classes created
- [ ] Game logic uses custom errors
- [ ] Error codes can be used for i18n

---

### TASK-022: Add Feature Claim Validation

**Problem:** Players can potentially claim features that are already claimed or invalid.

**Location:** `src/managers/FeatureClaimManager.ts`

**Required Validations:**
- Cannot claim feature already occupied by another follower
- Cannot claim if player has no available followers
- Cannot claim feature that doesn't exist on the placed tile

**Acceptance Criteria:**
- [ ] Validation logic implemented
- [ ] Appropriate errors thrown for invalid claims
- [ ] Tests cover validation scenarios

---

## Low Priority

### TASK-023: Add VS Code Settings

**Problem:** No shared VS Code configuration for consistent development experience.

**Location:** `.vscode/settings.json` (new file)

**Implementation:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

**Acceptance Criteria:**
- [ ] Settings file created
- [ ] Format on save works
- [ ] ESLint fixes on save

---

### TASK-024: Add GitHub Issue Templates

**Problem:** No standardized issue templates for bug reports and feature requests.

**Location:** `.github/ISSUE_TEMPLATE/`

**Files to Create:**
- `bug_report.md`
- `feature_request.md`

**Acceptance Criteria:**
- [ ] Bug report template with reproduction steps
- [ ] Feature request template with use case

---

### TASK-025: Add CONTRIBUTING.md

**Problem:** No contribution guidelines for external contributors.

**Location:** `CONTRIBUTING.md`

**Content:**
- Development setup instructions
- Code style guidelines
- Pull request process
- Testing requirements

**Acceptance Criteria:**
- [ ] File created with all sections
- [ ] Links to CLAUDE.md for detailed guidelines

---

## Future Considerations (Not Scheduled)

These items are noted for future planning but not part of the current backlog:

1. **Field/Farmer Scoring System** - Major feature adding ~30% strategic depth
2. **AI Improvements** - Better heuristics for new mechanics
3. **Multiplayer Backend** - Real-time online play
4. **Accessibility** - ARIA labels, keyboard navigation
5. **Mobile Responsiveness** - Touch controls, responsive canvas
6. **River Expansion** - Additional tile set
