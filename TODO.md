# American Title Trails - Development TODO List

## 🎯 High Priority

### 1. Performance Optimizations

- [ ] Canvas rendering improvements:
  - [ ] Implement `requestAnimationFrame` loop for smooth rendering
  - [ ] Add canvas dirty checking to avoid unnecessary redraws
  - [ ] Optimize tile rendering with sprite caching
- [ ] React component optimizations:
  - [ ] Add `useMemo` for expensive calculations (valid placements, game stats)
  - [ ] Implement `useCallback` for event handlers
  - [ ] Add `React.memo` for pure components
- [ ] Memory management:
  - [ ] Implement proper cleanup for event listeners
  - [ ] Add cleanup for AI timeouts on component unmount

## 🔧 Medium Priority

### 2. Carcassonne Core Mechanics Improvements

**See `CARCASSONNE_IMPROVEMENTS.md` for detailed analysis and implementation guide.**

**TERMINOLOGY MAPPING (Carcassonne → American Title Trails):**

- **City** = **Costco** (your implementation already has this)
- **Road** = **Road** (your implementation already has this)
- **Monastery** = **McDonald's** (your implementation already has this)
- **Field** = **Field** (exists as terrain type but NO SCORING currently implemented)
- **Meeple** = **Follower** (your implementation already has this)
- **Farmer** = **Follower placed on a field** (NOT YET IMPLEMENTED)

**WHAT ARE FIELDS IN YOUR GAME?**

- Fields are the green/grass terrain areas between roads and Costco shopping areas
- Currently in your code: `TerrainType = "road" | "field" | "costco" | "mcdonalds"`
- Fields appear on tile edges (e.g., `edges: { north: "field", east: "costco", ... }`)
- Fields also appear in tile centers (e.g., `center: "field"`)
- **PROBLEM**: Fields currently have ZERO gameplay impact - they're just filler terrain
- **SOLUTION**: Add farmer scoring system (see Phase 2 below)

**HOW FIELDS ARE DIVIDED:**

- A single tile can have MULTIPLE separate field areas
- Fields are separated by roads and Costco areas
- Example: A straight road tile has 2 separate fields (one on each side of the road)
- Example: A T-junction tile has 3 separate fields (one in each corner)
- Fields connect across tile edges when both edges are "field" terrain

#### Phase 1: Critical Fixes (1-2 days) - HIGH PRIORITY

- [ ] **Fix Majority Rule Calculation** (Currently Missing):

  - [ ] Update `getFeatureClaimants()` in `board.ts` to count followers per player
  - [ ] Only award points to player(s) with MOST followers on completed features
  - [ ] Handle ties: all tied players get FULL points
  - [ ] **Example**: Road completes with Player A having 2 followers and Player B having 1 follower → Only Player A scores
  - [ ] **Example**: Costco completes with Player A having 2 followers and Player B having 2 followers → Both score full points
  - [ ] Strategic implication: enables "hostile takeover" gameplay (connect your tile with more followers to steal points)
  - [ ] Add tests for majority rule scenarios (single winner, ties)

- [ ] **Remove 2-Tile Minimum for Cities** (Bug Fix):

  - [ ] Fix `isCostcoComplete()` in `board.ts` line 451
  - [ ] Remove `return feature.tiles.size >= 2;` requirement
  - [ ] **Explanation**: A single-tile Costco CAN be complete if all its edges connect to non-Costco terrain (field or road)
  - [ ] **Example**: Tile with Costco on North edge only, all other edges are fields → This is a complete 1-tile Costco worth 2 points
  - [ ] **Example**: Tile with Costco on North and East edges (corner) → If both connect to field/road, it's complete worth 2 points
  - [ ] Currently this incorrectly requires 2+ tiles to complete, blocking valid 1-tile completions
  - [ ] Add test for single-tile Costco completion

- [ ] **Add Feature Claim Validation** (Prevent Illegal Moves):
  - [ ] Create `canClaimFeature()` validation method
  - [ ] Prevent placing follower on already-claimed features
  - [ ] Exception: allow merging separate claimed/unclaimed features
  - [ ] Update UI to only show valid claimable features
  - [ ] Add tests for claim validation edge cases

#### Phase 2: Field/Farmer Mechanics (3-5 days) - MAJOR FEATURE

**WHAT THIS ADDS**: Currently fields are just empty grass with no gameplay purpose. This makes them strategically important!

**FARMER CONCEPT**:

- A farmer is just a follower placed on a FIELD (instead of on a road/Costco/McDonald's)
- Farmers are placed "lying down" = they stay on the field PERMANENTLY until game end
- Regular followers on roads/Costcos return when those features complete
- Farmers NEVER return during the game (only at game end)
- At game end, farmers score based on how many COMPLETED Costcos touch their field

**SCORING EXAMPLE**:

- Player places farmer on field
- During game, 3 Costco shopping areas get completed adjacent to that field
- At game end: Farmer scores 3 Costcos × 3 points = 9 points
- This is often the highest-scoring strategy in Carcassonne!

- [ ] **Design Field System**:

  - [ ] Add `farmer` to `FollowerType` enum (currently only has road/costco/mcdonalds)
  - [ ] Create `FieldSegment` interface with boundaries and separators
  - [ ] Add `fieldSegments` property to `TileDefinition`
  - [ ] **Key concept**: Fields are the grass areas BETWEEN roads and Costcos
  - [ ] **Key concept**: Roads and Costcos ACT AS WALLS that separate different fields

- [ ] **Implement Field Detection**:

  - [ ] Create `FieldFeature` interface tracking segments and adjacent Costcos
  - [ ] Implement field boundary detection algorithm
  - [ ] Track which Costcos touch each field (this determines scoring!)
  - [ ] Handle field separation across tile placements
  - [ ] **Example detection**:
    - Straight road tile has 2 fields (left side and right side of road)
    - Road acts as separator between the two fields
    - If Costco touches left field, only farmers on LEFT field score for it
    - If Costco touches right field, only farmers on RIGHT field score for it

- [ ] **Add Farmer Placement**:

  - [ ] Farmers are placed "lying down" (permanent until game end)
  - [ ] Cannot be returned when features complete
  - [ ] Allow multiple farmers in same field (majority rule applies)
  - [ ] Update UI to show farmer placement option

- [ ] **Implement Field Scoring**:

  - [ ] At game end, score 3 points per COMPLETED Costco adjacent to field
  - [ ] **Important**: Only COMPLETED Costcos count (incomplete Costcos score 0 for farmers)
  - [ ] Apply majority rule for farmers in same field (same as roads/Costcos)
  - [ ] Update `ScoreManager.calculateFinalScores()` to include field scoring
  - [ ] **Example calculation**:
    - Field has 2 completed Costcos touching it
    - Player A has 2 farmers on this field, Player B has 1 farmer
    - Player A wins majority → Player A scores 2 Costcos × 3 points = 6 points
    - Player B scores nothing (didn't have majority)
  - [ ] Add comprehensive field scoring tests

- [ ] **Update Tile Library**:
  - [ ] Add field segment definitions to all 41 tiles in `tileLibrary.ts`
  - [ ] Define field boundaries for each tile type:
    - **Straight road**: 2 separate fields (left and right of road)
    - **Curved road**: 2 separate fields (inside curve and outside curve)
    - **T-junction**: 3 separate fields (one in each corner that doesn't have road)
    - **4-way crossroad**: 4 separate fields (one in each corner)
    - **Road with Costco**: Fields are in corners not occupied by road or Costco
    - **Costco-only tiles**: Field segments around the Costco edges
    - **McDonald's tiles**: Usually 1 large field surrounding the monastery
  - [ ] Document field separation patterns (what blocks field connection)
  - [ ] Document which Costco edges touch which field segments

#### Phase 3: Polish & Testing (1-2 days)

- [ ] **Update AI for New Mechanics**:

  - [ ] Add farmer placement strategy to `SimpleAI`
  - [ ] Consider field value in AI move planning
  - [ ] Implement hostile takeover strategy (placing more followers)
  - [ ] Late-game farmer placement logic

- [ ] **Comprehensive Testing**:

  - [ ] Add test cases for majority rule (single winner, ties)
  - [ ] Add test cases for field scoring:
    - Farmer scoring for adjacent completed Costcos
    - Field separation by roads and Costcos
    - Multiple farmers in same field (majority rule)
    - Fields that touch multiple Costcos
  - [ ] Add test cases for single-tile Costco completion
  - [ ] Add test cases for claim validation (illegal claims, merging)
  - [ ] Add edge case tests (road loops, complex field boundaries, Costco peninsulas)

- [ ] **Documentation Updates**:
  - [ ] Update help content with field/farmer mechanics explanation
  - [ ] Explain: "Farmers are followers placed on fields (grass areas between roads and Costcos)"
  - [ ] Explain: "Farmers stay on the field until game end, then score 3 points per completed Costco touching that field"
  - [ ] Document majority rule in game rules with examples
  - [ ] Add visual examples of field boundaries and separation
  - [ ] Update translation files with new terminology (farmer, field scoring, etc.)

### 3. Error Handling & Validation

- [ ] Create custom error types:
  ```typescript
  class GameError extends Error
  class InvalidMoveError extends GameError
  class InvalidPlayerConfigError extends GameError
  ```
- [ ] Add input validation:
  - [ ] Player name validation (length, special characters)
  - [ ] Color validation (hex format)
  - [ ] Game configuration validation
- [ ] Improve error boundaries:
  - [ ] Add React error boundary component
  - [ ] Better error messaging for users
  - [ ] Error logging and reporting

### 4. Code Quality & Documentation

- [ ] Add JSDoc comments to all public methods
- [ ] Improve TypeScript strict mode compliance:
  - [ ] Enable `strictNullChecks`
  - [ ] Fix any remaining `any` types
  - [ ] Add proper return type annotations
- [ ] Code organization:
  - [ ] Create `utils/` directory for helper functions
  - [ ] Separate constants into dedicated files
  - [ ] Organize types into domain-specific files
- [ ] Add linting rules:
  - [ ] Configure ESLint for React hooks
  - [ ] Add TypeScript-specific rules
  - [ ] Set up Prettier for code formatting

### 5. Accessibility Improvements

- [ ] Canvas accessibility:
  - [ ] Add ARIA labels for interactive canvas elements
  - [ ] Implement keyboard navigation for tile placement
  - [ ] Add screen reader support for game state
- [ ] UI accessibility:
  - [ ] Ensure proper color contrast ratios
  - [ ] Add focus indicators for all interactive elements
  - [ ] Implement proper tab order
- [ ] Game accessibility:
  - [ ] Add text alternatives for visual game elements
  - [ ] Sound effects for important game events
  - [ ] High contrast mode option

## 🎮 Low Priority

### 6. AI Enhancement

- [ ] Advanced AI algorithms:
  - [ ] Implement minimax algorithm for better decision making
  - [ ] Add Monte Carlo tree search for strategic planning
  - [ ] Create multiple AI personality types
- [ ] Difficulty levels:
  - [ ] Easy: Current simple heuristic AI
  - [ ] Medium: Improved heuristics with lookahead
  - [ ] Hard: Advanced algorithms with deep analysis
- [ ] AI improvements:
  - [ ] Better follower placement strategy (beyond just monasteries)
  - [ ] Long-term planning capabilities
  - [ ] Adaptive difficulty based on player performance
  - [ ] **NOTE**: Major AI strategy updates needed after Phase 2 (farmer mechanics) completed

### 7. Developer Experience

- [ ] Development tools:
  - [ ] Add debug mode with detailed game state logging
  - [ ] Create development overlay for testing
  - [ ] Add hot reload for game logic changes
- [ ] VS Code configuration:
  - [ ] Add `.vscode/settings.json` with project-specific settings
  - [ ] Create debug configurations
  - [ ] Add recommended extensions list
- [ ] Build improvements:
  - [ ] Optimize bundle size analysis
  - [ ] Add development vs production environment configs
  - [ ] Implement proper source maps for debugging

### 8. Feature Enhancements

- [ ] Game features:
  - [ ] Add game save/load functionality
  - [ ] Implement game replay system
  - [ ] Add statistics tracking (games played, win rates)
- [ ] UI improvements:
  - [ ] Add animations for tile placement and scoring
  - [ ] Implement themes (dark/light mode)
  - [ ] Add sound effects and background music
- [ ] Multiplayer:
  - [ ] Design architecture for online multiplayer
  - [ ] Add spectator mode
  - [ ] Implement game lobbies

## 📋 Quick Wins (Can be done immediately)

- [ ] Add proper README badges (build status, coverage, license)
- [ ] Create `.gitignore` improvements (add common IDE files)
- [ ] Add `engines` field validation in package.json
- [ ] Create issue and PR templates for GitHub
- [ ] Add `npm run format` script with Prettier
- [ ] Create `CONTRIBUTING.md` guidelines
- [ ] Add proper license header to source files

## 🔄 Ongoing Maintenance

- [ ] Regular dependency updates
- [ ] Security vulnerability scanning
- [ ] Performance monitoring and optimization
- [ ] User feedback collection and implementation
- [ ] Documentation updates
- [ ] Code review process establishment

---

## Priority Implementation Order

1. **Immediate Priority**: Carcassonne core mechanics fixes (Phase 1: Critical Fixes - 1-2 days)
   - Majority rule calculation
   - Remove 2-tile city minimum
   - Feature claim validation
2. **Week 1-2**: Carcassonne field/farmer mechanics (Phase 2 - 3-5 days)
   - Field system design and implementation
   - Farmer placement and scoring
   - Tile library updates
3. **Week 2**: Polish and testing (Phase 3 - 1-2 days)
   - Update AI for new mechanics
   - Comprehensive test coverage
   - Documentation updates
4. **Week 3**: Performance optimizations
5. **Week 4**: Error handling and validation
6. **Month 2**: Code quality improvements and accessibility
7. **Month 3+**: Advanced features and AI enhancements

## Notes

- Focus on high-impact, low-effort items first
- Maintain backward compatibility during refactoring
- Test thoroughly before implementing breaking changes
- Document architectural decisions and trade-offs
