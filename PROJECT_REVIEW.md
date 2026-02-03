# Project Review: American Tile Trails

**Review Date:** February 2026
**Reviewer:** Claude Code

---

## Executive Summary

American Tile Trails is a well-architected Carcassonne-inspired game with solid foundational design patterns. The codebase demonstrates good separation of concerns through the manager pattern and maintains clean boundaries between game logic and UI. However, there are several areas requiring attention, primarily around **type safety**, **incomplete game mechanics**, and **performance optimizations**.

### Overall Assessment: **B+** (Good foundation, needs refinement)

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | A | Excellent manager decomposition, clean separation of concerns |
| Type Safety | C | 48+ instances of `any` type, circular dependency workarounds |
| Game Mechanics | B- | Core mechanics work, but missing majority rule and field scoring |
| Test Coverage | B | Good test foundation, 80% threshold set but needs verification |
| Code Quality | B+ | Clean patterns, but some files need decomposition |
| Documentation | A | Excellent CLAUDE.md, TODO.md, and inline guidance |

---

## Critical Issues (Address Immediately)

### 1. Type Safety Violations

**Impact:** High | **Effort:** Medium

The codebase has ~48 instances of `any` type, primarily used to avoid circular dependencies:

```typescript
// src/types.ts - Lines 64, 83, 117, 120-122
export interface PlacementResult {
  completed: any[];  // Should be CompletedFeature[]
}

export interface TileRecord {
  tile: any;  // Should be Tile
}

export interface GameState {
  board: any;       // Should be Board
  currentTile?: any; // Should be Tile
  tileDeck: any[];  // Should be Tile[]
  discardPile: any[]; // Should be Tile[]
}
```

**Recommendation:** Create interface files to break circular dependencies:

```typescript
// src/interfaces/ITile.ts
export interface ITile {
  id: string;
  getEdge(direction: Direction): TerrainType;
  rotate(times: number): ITile;
  // ... other public methods
}

// src/interfaces/IBoard.ts
export interface IBoard {
  placeTile(tile: ITile, position: Position): TilePlacementResult;
  getFeatureClaims(): FeatureClaim[];
  // ... other public methods
}
```

### 2. Private Method Access via Type Casting

**Impact:** High | **Effort:** Medium

`ScoreManager.ts` accesses private `Board` methods through unsafe casting:

```typescript
// src/managers/ScoreManager.ts - Lines 70, 103, 109, 116
const claimants = (board as any).getFeatureClaimants(featureForClaimants);
(board as any).tiles.forEach(...);
const feature = (board as any).traceCostcoFeature(...);
```

**Recommendation:** Either:
1. Make these methods public on `Board` class, or
2. Move feature analysis logic to a separate `FeatureAnalyzer` class that both `Board` and `ScoreManager` can use

### 3. Majority Rule Not Implemented

**Impact:** High | **Effort:** Low-Medium

The current scoring awards points to ALL players who have followers on a completed feature, regardless of count:

```typescript
// src/managers/ScoreManager.ts - Lines 20-28
feature.claimedBy.forEach((playerId: string) => {
  const player = players.find((p) => p.id === playerId);
  if (player) {
    player.score += feature.points;  // All claimants get full points
  }
});
```

**Correct behavior:** Only player(s) with the MOST followers should score. This is a core Carcassonne mechanic that enables strategic "hostile takeover" plays.

---

## High Priority Improvements

### 4. Board Class Decomposition

**Impact:** Medium | **Effort:** High

`board.ts` at 537 lines handles too many responsibilities:
- Tile placement and validation
- Feature completion detection
- Feature tracing (BFS algorithms)
- Claiming logic

**Recommendation:** Split into:
- `BoardState.ts` - Tile storage, placement, spatial queries
- `FeatureAnalyzer.ts` - Completion detection, feature tracing
- `FeatureTracker.ts` - Claiming and claimant management

### 5. Magic Numbers to Constants

**Impact:** Low | **Effort:** Low

Hardcoded values should be extracted:

```typescript
// Create src/constants/gameRules.ts
export const GAME_RULES = {
  FOLLOWERS_PER_PLAYER: 7,
  MCDONALDS_MAX_SCORE: 9,
  MCDONALDS_SURROUNDING_TILES: 8,
  COSTCO_POINTS_PER_TILE_COMPLETE: 2,
  COSTCO_POINTS_PER_TILE_INCOMPLETE: 1,
  COSTCO_PENNANT_BONUS: 2,
  ROAD_POINTS_PER_TILE: 1,
  // Future: FIELD_POINTS_PER_COMPLETED_COSTCO: 3
} as const;
```

### 6. React Performance Optimizations

**Impact:** Medium | **Effort:** Medium

Missing memoization in key components:

```typescript
// GameBoard.tsx - Add memoization
const validPlacements = useMemo(() =>
  game.getValidPlacements(),
  [gameState.currentTile, gameState.board]
);

const gameStats = useMemo(() =>
  calculateGameStats(gameState),
  [gameState.players, gameState.tileDeck]
);

// Add useCallback for event handlers
const handleTilePlacement = useCallback((position: Position) => {
  game.placeTile(position, selectedRotation);
}, [game, selectedRotation]);
```

---

## Medium Priority Improvements

### 7. Error Handling Enhancement

Create proper error types:

```typescript
// src/errors/GameError.ts
export class GameError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GameError';
  }
}

export class InvalidPlacementError extends GameError {
  constructor(reason: string) {
    super(`Invalid tile placement: ${reason}`, 'INVALID_PLACEMENT');
  }
}

export class InvalidClaimError extends GameError {
  constructor(reason: string) {
    super(`Invalid feature claim: ${reason}`, 'INVALID_CLAIM');
  }
}
```

### 8. ESLint Configuration

The current ESLint config is minimal (only Storybook rules):

```javascript
// .eslintrc.js (new file)
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:storybook/recommended'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
};
```

### 9. Canvas Performance

**Current issue:** No requestAnimationFrame loop, full redraws on every change

```typescript
// BoardCanvas.tsx improvements
useEffect(() => {
  let animationFrameId: number;
  let isDirty = true;

  const render = () => {
    if (isDirty) {
      drawCanvas();
      isDirty = false;
    }
    animationFrameId = requestAnimationFrame(render);
  };

  render();

  return () => cancelAnimationFrame(animationFrameId);
}, [/* dependencies */]);
```

---

## Quick Wins (Implement First)

These can be done immediately with minimal risk:

| Item | File | Effort |
|------|------|--------|
| Add `CONTRIBUTING.md` | Root | 15 min |
| Add GitHub issue templates | `.github/` | 15 min |
| Extract game rule constants | `src/constants/` | 30 min |
| Add `npm run lint` script | `package.json` | 5 min |
| Fix `PlacementResult.completed` type | `types.ts:64` | 5 min |
| Add `.vscode/settings.json` | `.vscode/` | 10 min |
| Document all public methods in managers | `src/managers/` | 1 hour |

---

## Feature Gaps vs. Original Carcassonne

| Feature | Status | Priority |
|---------|--------|----------|
| Tile placement | Implemented | - |
| Road scoring | Implemented | - |
| Costco (city) scoring | Implemented | - |
| McDonald's (monastery) scoring | Implemented | - |
| Majority rule | **Missing** | Critical |
| Field/Farmer scoring | **Missing** | High |
| Single-tile Costco completion | **Bug** | High |
| Feature claim validation | **Missing** | Medium |
| River expansion | Not planned | Low |

---

## Testing Recommendations

### Current Test Files
- `game.test.ts` (268 lines) - Game flow and phases
- `board.test.ts` (246 lines) - Tile placement
- `ai.test.ts` (279 lines) - AI move planning
- `tile.test.ts` (221 lines) - Tile rotation
- `gameSetup.test.tsx` (96 lines) - React component

### Missing Test Coverage
1. **Scoring scenarios** - No tests for ScoreManager
2. **Majority rule** - No tests (feature missing)
3. **Edge cases** - Road loops, complex Costco shapes
4. **Integration tests** - Full game simulations
5. **React hooks** - No tests for useTranslations

### Recommended New Tests
```typescript
// src/test/scoreManager.test.ts
describe('ScoreManager', () => {
  describe('scoreCompletedFeatures', () => {
    it('should award points only to majority follower holder');
    it('should award full points to all players on tie');
    it('should handle features with no claimants');
  });

  describe('calculateFinalScores', () => {
    it('should score incomplete Costcos at 1 point per tile');
    it('should score incomplete roads correctly');
    // Future: it('should score farmers for adjacent completed Costcos');
  });
});
```

---

## Architecture Diagram

```
                    ┌─────────────────┐
                    │   GameBoard.tsx │ (React UI)
                    └────────┬────────┘
                             │ State Change Listener
                    ┌────────▼────────┐
                    │      Game       │ (Orchestrator)
                    └────────┬────────┘
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│  TurnManager    │ │   TileManager   │ │ FeatureClaimMgr │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                    ┌────────▼────────┐
                    │      Board      │ (State + Logic)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │      Tile       │ (Immutable)
                    └─────────────────┘
```

---

## Recommended Implementation Order

1. **Week 1: Type Safety & Critical Fixes**
   - Extract interfaces to break circular dependencies
   - Replace `any` types with proper interfaces
   - Fix ScoreManager private method access
   - Implement majority rule

2. **Week 2: Code Quality**
   - Set up proper ESLint configuration
   - Extract magic numbers to constants
   - Add missing JSDoc documentation
   - Add ScoreManager tests

3. **Week 3: Performance**
   - Add React memoization (useMemo, useCallback)
   - Implement canvas RAF loop
   - Add dirty checking for redraws

4. **Week 4+: Features**
   - Field/Farmer scoring system
   - AI improvements for new mechanics
   - Enhanced error handling

---

## Conclusion

American Tile Trails has excellent architectural bones with its manager pattern and clean separation between game logic and UI. The primary technical debt centers around type safety compromises made to avoid circular dependencies. Addressing the type system issues will make the codebase significantly more maintainable and catch bugs at compile time rather than runtime.

The missing game mechanics (majority rule, field scoring) are well-documented in TODO.md and should be prioritized after the type safety issues are resolved. The performance optimizations can be implemented incrementally without blocking feature development.

**Recommended first action:** Create interface files for `ITile` and `IBoard` to eliminate the `any` type usage in `types.ts` and `ScoreManager.ts`.
