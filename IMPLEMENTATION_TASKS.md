# Implementation Tasks: Weeks 1-2

This document provides detailed, actionable tasks for the first two weeks of improvements based on the Project Review.

---

## Week 1: Type Safety & Critical Fixes

**Goal:** Eliminate `any` types and fix the critical majority rule bug.

---

### Day 1-2: Create Interface Files

#### Task 1.1: Create ITile Interface
**File:** `src/interfaces/ITile.ts`

```typescript
// Create new file: src/interfaces/ITile.ts
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
- [ ] Interface defines all public Tile methods
- [ ] Interface is importable without causing circular dependencies
- [ ] Tile class implements ITile interface

---

#### Task 1.2: Create IBoard Interface
**File:** `src/interfaces/IBoard.ts`

```typescript
// Create new file: src/interfaces/IBoard.ts
import { Position, FeatureClaim, TilePlacementResult, Direction } from "../types";
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
- [ ] Interface defines all public Board methods
- [ ] Interface includes methods needed by ScoreManager
- [ ] Board class implements IBoard interface

---

#### Task 1.3: Create Index File for Interfaces
**File:** `src/interfaces/index.ts`

```typescript
export { ITile } from "./ITile";
export { IBoard } from "./IBoard";
```

**Acceptance Criteria:**
- [ ] Clean barrel export for all interfaces

---

### Day 2-3: Replace `any` Types in types.ts

#### Task 1.4: Fix GameState Interface
**File:** `src/types.ts`

**Current (lines 117-130):**
```typescript
export interface GameState {
  board: any;
  currentTile?: any;
  tileDeck: any[];
  discardPile: any[];
  // ...
}
```

**Target:**
```typescript
import { IBoard } from "./interfaces/IBoard";
import { ITile } from "./interfaces/ITile";

export interface GameState {
  board: IBoard;
  currentTile?: ITile;
  tileDeck: ITile[];
  discardPile: ITile[];
  // ...
}
```

**Acceptance Criteria:**
- [ ] No `any` types in GameState interface
- [ ] TypeScript compiles without errors
- [ ] All existing tests pass

---

#### Task 1.5: Fix TileRecord Interface
**File:** `src/types.ts` (line 83)

**Current:**
```typescript
export interface TileRecord {
  tile: any;
  position: Position;
}
```

**Target:**
```typescript
export interface TileRecord {
  tile: ITile;
  position: Position;
}
```

---

#### Task 1.6: Fix PlacementResult Interface
**File:** `src/types.ts` (line 64)

**Current:**
```typescript
export interface PlacementResult {
  success: boolean;
  completedFeatures?: any[];
}
```

**Target:**
```typescript
export interface PlacementResult {
  success: boolean;
  completedFeatures?: CompletedFeature[];
}
```

---

### Day 3-4: Fix ScoreManager Private Method Access

#### Task 1.7: Make Board Methods Public
**File:** `src/board.ts`

Change these methods from private to public:
1. `getFeatureClaimants()` - Line ~350
2. `traceCostcoFeature()` - Line ~400
3. `isCostcoComplete()` - Line ~440

**Alternative approach:** Create `FeatureAnalyzer` class if methods are too implementation-specific.

**Acceptance Criteria:**
- [ ] ScoreManager can call Board methods without type casting
- [ ] Remove all `(board as any)` from ScoreManager.ts
- [ ] TypeScript compiles without errors

---

#### Task 1.8: Update ScoreManager to Use Typed Board
**File:** `src/managers/ScoreManager.ts`

**Current (line 70):**
```typescript
const claimants = (board as any).getFeatureClaimants(featureForClaimants);
```

**Target:**
```typescript
const claimants = board.getFeatureClaimants(featureForClaimants);
```

**Files to update:**
- Line 70: `getFeatureClaimants`
- Line 103: `tiles.forEach`
- Line 109: `traceCostcoFeature`
- Line 116: `isCostcoComplete`

**Acceptance Criteria:**
- [ ] Zero `as any` casts in ScoreManager.ts
- [ ] All scoring tests pass

---

### Day 4-5: Implement Majority Rule

#### Task 1.9: Update ScoreManager.scoreCompletedFeatures()
**File:** `src/managers/ScoreManager.ts`

**Current behavior:** All claimants get full points
**Required behavior:** Only majority holder(s) get points

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
- [ ] Single player with most followers gets all points
- [ ] Tied players all get full points
- [ ] Players with fewer followers get zero points
- [ ] All followers are returned after scoring

---

#### Task 1.10: Update Feature Tracking to Count Followers
**File:** `src/board.ts` or `src/managers/FeatureClaimManager.ts`

The `claimedBy` array needs to track individual follower placements, not unique player IDs.

**Example:**
- Player A places 2 followers on a road
- Player B places 1 follower on the same road (via connection)
- `claimedBy` should be `["playerA", "playerA", "playerB"]`
- Player A scores (2 > 1)

**Acceptance Criteria:**
- [ ] Feature claims track individual followers, not unique players
- [ ] Multiple followers from same player are counted correctly

---

### Day 5: Testing

#### Task 1.11: Add Majority Rule Tests
**File:** `src/test/scoreManager.test.ts` (new file)

```typescript
describe("ScoreManager", () => {
  describe("scoreCompletedFeatures", () => {
    it("should award points only to player with most followers", () => {
      // Player A: 2 followers, Player B: 1 follower
      // Only Player A should score
    });

    it("should award points to all tied players", () => {
      // Player A: 2 followers, Player B: 2 followers
      // Both should score full points
    });

    it("should not award points to minority follower holders", () => {
      // Player A: 3 followers, Player B: 1 follower
      // Player B should get 0 points
    });

    it("should handle single claimant correctly", () => {
      // Player A: 1 follower
      // Player A should score
    });

    it("should return all followers after scoring", () => {
      // All players should get followers back regardless of scoring
    });
  });
});
```

**Acceptance Criteria:**
- [ ] All 5 test cases pass
- [ ] Tests cover edge cases (ties, single claimant, no claimants)

---

## Week 2: Code Quality

**Goal:** Improve code maintainability through constants, linting, documentation, and tests.

---

### Day 1: Extract Constants

#### Task 2.1: Create Game Rules Constants
**File:** `src/constants/gameRules.ts` (new file)

```typescript
/**
 * Core game rule constants for American Tile Trails
 * Based on Carcassonne scoring rules with American theming
 */
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

  // Field scoring (future implementation)
  FIELD_POINTS_PER_COMPLETED_COSTCO: 3,

  // AI configuration
  AI_MOVE_DELAY_MS: 1000,
} as const;

export type GameRules = typeof GAME_RULES;
```

**Acceptance Criteria:**
- [ ] All magic numbers extracted from codebase
- [ ] Constants are typed with `as const`
- [ ] File is importable from `@/constants/gameRules`

---

#### Task 2.2: Update Files to Use Constants
**Files to update:**
- `src/player.ts` - `followers = 7`
- `src/managers/PlayerManager.ts` - `followers: 7`
- `src/board.ts` - McDonald's scoring (9 points, 8 tiles)
- `src/managers/ScoreManager.ts` - Costco scoring calculations
- `src/components/GameBoard.tsx` - AI delay (1000ms)

**Acceptance Criteria:**
- [ ] No hardcoded game rule numbers in source files
- [ ] All tests still pass
- [ ] Constants are documented with JSDoc

---

### Day 2: ESLint Configuration

#### Task 2.3: Install ESLint Dependencies
**Command:**
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks
```

---

#### Task 2.4: Create ESLint Configuration
**File:** `.eslintrc.cjs` (new file)

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
    // TypeScript
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

    // React
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // General
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "warn",
  },
  ignorePatterns: ["dist/", "node_modules/", "*.config.js", "*.config.ts"],
};
```

---

#### Task 2.5: Add Lint Scripts to package.json
**File:** `package.json`

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  }
}
```

**Acceptance Criteria:**
- [ ] `npm run lint` runs without crashing
- [ ] Warnings are reported for `any` types
- [ ] No errors block the build

---

### Day 3-4: JSDoc Documentation

#### Task 2.6: Document ScoreManager
**File:** `src/managers/ScoreManager.ts`

Add comprehensive JSDoc to all public methods:

```typescript
/**
 * Scores completed features and awards points to eligible players.
 *
 * Implements the majority rule: only player(s) with the most followers
 * on a feature receive points. In case of a tie, all tied players
 * receive full points.
 *
 * @param completedFeatures - Array of features that were just completed
 * @param players - Array of all players in the game
 *
 * @example
 * // Player A has 2 followers, Player B has 1 follower on a 5-tile road
 * // Player A receives 5 points, Player B receives 0 points
 * scoreManager.scoreCompletedFeatures([roadFeature], players);
 */
public scoreCompletedFeatures(
  completedFeatures: CompletedFeature[],
  players: PlayerState[]
): void {
```

---

#### Task 2.7: Document TurnManager
**File:** `src/managers/TurnManager.ts`

Document phase transitions and turn flow:

```typescript
/**
 * TurnManager handles the game's turn-based flow and phase transitions.
 *
 * Phase Flow:
 * 1. PLACE_TILE - Active player places a tile
 * 2. CLAIM_FEATURE - Active player optionally claims a feature
 * 3. SCORE_FEATURES - Completed features are scored
 * 4. END_TURN - Turn ends, next player becomes active
 *
 * The manager ensures phases transition correctly and validates
 * that actions are only allowed in appropriate phases.
 */
export class TurnManager {
```

---

#### Task 2.8: Document TileManager
**File:** `src/managers/TileManager.ts`

Document tile deck operations:

```typescript
/**
 * TileManager handles the tile deck and placement validation.
 *
 * Responsibilities:
 * - Building and shuffling the initial tile deck
 * - Drawing tiles for players
 * - Validating tile placements against the board
 * - Managing tile rotation
 * - Handling discarded tiles (when no valid placement exists)
 */
export class TileManager {
```

---

#### Task 2.9: Document FeatureClaimManager
**File:** `src/managers/FeatureClaimManager.ts`

---

#### Task 2.10: Document PlayerManager
**File:** `src/managers/PlayerManager.ts`

---

### Day 5: ScoreManager Tests

#### Task 2.11: Create ScoreManager Test File
**File:** `src/test/scoreManager.test.ts` (new file)

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
    it("should award points to single claimant", () => {
      const feature: CompletedFeature = {
        type: "road",
        points: 5,
        claimedBy: ["p1"],
        tiles: [],
      };

      scoreManager.scoreCompletedFeatures([feature], players);

      expect(players[0].score).toBe(5);
      expect(players[1].score).toBe(0);
    });

    it("should award points only to majority holder", () => {
      const feature: CompletedFeature = {
        type: "road",
        points: 5,
        claimedBy: ["p1", "p1", "p2"], // p1 has 2, p2 has 1
        tiles: [],
      };

      scoreManager.scoreCompletedFeatures([feature], players);

      expect(players[0].score).toBe(5); // p1 wins majority
      expect(players[1].score).toBe(0); // p2 gets nothing
    });

    it("should award full points to all tied players", () => {
      const feature: CompletedFeature = {
        type: "costco",
        points: 10,
        claimedBy: ["p1", "p1", "p2", "p2"], // tie: 2 each
        tiles: [],
      };

      scoreManager.scoreCompletedFeatures([feature], players);

      expect(players[0].score).toBe(10); // both get full points
      expect(players[1].score).toBe(10);
    });

    it("should handle features with no claimants", () => {
      const feature: CompletedFeature = {
        type: "road",
        points: 5,
        claimedBy: [],
        tiles: [],
      };

      scoreManager.scoreCompletedFeatures([feature], players);

      expect(players[0].score).toBe(0);
      expect(players[1].score).toBe(0);
    });

    it("should score multiple features in sequence", () => {
      const features: CompletedFeature[] = [
        { type: "road", points: 3, claimedBy: ["p1"], tiles: [] },
        { type: "costco", points: 8, claimedBy: ["p2"], tiles: [] },
      ];

      scoreManager.scoreCompletedFeatures(features, players);

      expect(players[0].score).toBe(3);
      expect(players[1].score).toBe(8);
    });
  });

  describe("calculateFinalScores", () => {
    it("should score incomplete Costco features", () => {
      // Test with mock board containing incomplete Costco
    });

    it("should score incomplete roads", () => {
      // Test with mock board containing incomplete roads
    });
  });
});
```

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] Coverage for scoreCompletedFeatures >= 80%
- [ ] Coverage for calculateFinalScores >= 60%

---

## Summary Checklist

### Week 1: Type Safety & Critical Fixes
- [ ] Task 1.1: Create ITile interface
- [ ] Task 1.2: Create IBoard interface
- [ ] Task 1.3: Create interfaces index file
- [ ] Task 1.4: Fix GameState interface
- [ ] Task 1.5: Fix TileRecord interface
- [ ] Task 1.6: Fix PlacementResult interface
- [ ] Task 1.7: Make Board methods public
- [ ] Task 1.8: Update ScoreManager to use typed Board
- [ ] Task 1.9: Update ScoreManager for majority rule
- [ ] Task 1.10: Update feature tracking for follower counts
- [ ] Task 1.11: Add majority rule tests

### Week 2: Code Quality
- [ ] Task 2.1: Create game rules constants
- [ ] Task 2.2: Update files to use constants
- [ ] Task 2.3: Install ESLint dependencies
- [ ] Task 2.4: Create ESLint configuration
- [ ] Task 2.5: Add lint scripts
- [ ] Task 2.6: Document ScoreManager
- [ ] Task 2.7: Document TurnManager
- [ ] Task 2.8: Document TileManager
- [ ] Task 2.9: Document FeatureClaimManager
- [ ] Task 2.10: Document PlayerManager
- [ ] Task 2.11: Create ScoreManager tests

---

## Notes

- Run `npm test` after each task to ensure no regressions
- Run `npx tsc --noEmit` before committing to catch type errors
- Commit after each major task completion
- Update TODO.md to mark completed items
