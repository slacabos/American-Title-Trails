# American Title Trails - Development TODO List

## 🎯 High Priority

### 1. Costco Tile System Redesign (Critical) ✅ COMPLETED

- [x] **COMPLETED**: Redesigned Costco tiles to follow proper Carcassonne city mechanics instead of road-like connections:
  - [x] **Updated tile definitions** to use complex city-like segments rather than simple edge-to-edge connections
  - [x] **Added multiple separate Costco areas** on single tiles (like cities can have multiple segments)
  - [x] **Implemented curved boundaries** that don't follow straight edge patterns
  - [x] **Added pennant system** for bonus scoring (e.g., "Gas Station" markers)
  - [x] **Created diverse tile varieties** matching original Carcassonne city tile complexity
  - [x] **Detailed Costco/City Area Behavior Requirements**:
    - [x] **Enclosure Rules**: Costco areas must form completely enclosed shopping districts (no open edges to fields)
    - [x] **Connection Logic**: Adjacent Costco edges automatically connect into larger shopping complexes
    - [x] **Separation Handling**: Multiple Costco segments on same tile remain separate unless explicitly connected
    - [x] **Curved Segments**: Costco areas can curve around tile corners (not limited to straight edge connections)
    - [x] **Peninsula Support**: Allow Costco segments that jut into field areas without connecting to edges
    - [x] **Bridge Connections**: Support Costco areas that span across field areas (like city bridges)
    - [x] **Size Validation**: Completed Costco areas must contain at least 2 tiles (prevent single-tile completion)
    - [x] **Edge Matching**: Costco edge segments must align properly with adjacent tiles' Costco segments
    - [x] **Field Boundaries**: Clear distinction between Costco commercial areas and surrounding field regions
    - [x] **Completion Detection**: Efficient algorithm to detect when Costco shopping districts are fully enclosed
    - [x] **Scoring Mechanics**:
      - Complete Costco: 2 points per tile + 2 points per pennant
      - Incomplete Costco: 1 point per tile + 1 point per pennant (end game)
      - Shared ownership: Points divided among players with most followers in area
- [x] Updated `costcoZones` data structure to support:
  - [x] Multiple separate Costco areas per tile
  - [x] Complex segment shapes and curves
  - [x] Pennant markers for bonus points
- [x] Redesigned visual rendering in `BoardCanvas.tsx`:
  - [x] Draw curved Costco boundaries instead of rectangular zones
  - [x] Add visual pennant indicators
  - [x] Support multiple separate Costco areas per tile
- [x] Updated completion logic in `board.ts`:
  - [x] Handle complex enclosed Costco areas properly
  - [x] Implement pennant bonus scoring
  - [x] Support multiple separate completable areas per tile
- [x] **Replaced starter tile** with proper CRFR-style starting tile:
  - [x] Current starter tile is 4-way road crossroads (not standard Carcassonne)
  - [x] Create new starter tile with: single Costco edge, straight road parallel to that edge, field occupying remainder
  - [x] Follow tile notation describing features clockwise from north (e.g., C-R-F-R pattern)
  - [x] Update game initialization to use proper starter tile

### 2. Testing Infrastructure (Critical) ✅ COMPLETED

- [x] **Upgraded to Node 20.19.5** for better compatibility with modern testing tools
- [x] Install testing framework: `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- [x] Create `vitest.config.ts` configuration file with jsdom environment
- [x] Create test setup file (`src/test/setup.ts`) with proper cleanup
- [x] Add test scripts to `package.json` (`test`, `test:ui`, `test:run`, `test:coverage`)
- [x] Write unit tests for core game logic - **135 passing tests, 72% overall coverage**:
  - [x] **`Tile` class** - 23 tests, 97% coverage
    - [x] Constructor and property initialization  
    - [x] Edge terrain queries
    - [x] Rotation (0°, 90°, 180°, 270°, 360°, negative)
    - [x] Road connections rotation
    - [x] Costco zones rotation and pennant preservation
    - [x] Tile cloning and immutability guarantees
  - [x] **`Player` class** - 26 tests, 100% coverage
    - [x] Constructor with all options (id, followers, isAI, color)
    - [x] ID generation from name
    - [x] Follower management (`canPlaceFollower`, `useFollower`, `returnFollower`)
    - [x] Score tracking (`addScore`) with positive, negative, and large values
    - [x] Error handling for invalid moves
    - [x] Integration scenarios
  - [x] **`Board` class** - 26 tests, 78% coverage
    - [x] Board initialization and `isEmpty()`
    - [x] Tile placement and retrieval
    - [x] Neighbor detection (all directions)
    - [x] Bounds calculation with multiple tiles
    - [x] Placement validation (`canPlace`) with edge matching
    - [x] Placement candidates generation
    - [x] Integration scenarios
  - [x] **`Game` class** - 38 tests, 44% coverage
    - [x] Game initialization with multiple players
    - [x] Player configuration (followers, colors, AI status, IDs)
    - [x] State management and getters
    - [x] State change listeners
    - [x] Tile placement validation and execution
    - [x] Phase management (PLACE_TILE, CLAIM_FEATURE, END_TURN)
    - [x] Turn progression and player cycling
    - [x] Turn number tracking
    - [x] Edge cases (1 player, 6 players)
  - [x] **`SimpleAI` class** - 22 tests, 100% coverage
    - [x] Constructor with custom weights
    - [x] Move planning with various board states
    - [x] Placement candidate evaluation
    - [x] Rotation selection (0-3)
    - [x] Completion scoring
    - [x] Adjacency preferences
    - [x] Costco zone preferences
    - [x] McDonalds follower placement
    - [x] Edge cases and null handling
- [x] Write integration tests for React components - **37 passing tests, 75% overall coverage**:
  - [x] **`GameSetup` component** - 37 tests, 88% coverage
    - [x] Initial render and UI elements
    - [x] Player count selection (2-5 players)
    - [x] Default player configuration (You, Player 2, Player 3)
    - [x] Player name input and validation
    - [x] Player type selection (Human/AI)
    - [x] Player color indicators
    - [x] Start game functionality and callback
    - [x] Player data validation and trimming
    - [x] Sequential player ID assignment
    - [x] Help modal opening and closing
    - [x] Edge cases (special characters, long names, multiple clicks)
    - [x] Accessibility (labels, buttons, heading hierarchy)
    - [x] Styling and layout structure
  - [ ] `GameBoard` component state management (complex mocking required - deferred)
  - [ ] Canvas interaction handling (deferred)
- [x] Set up test coverage reporting with v8 provider (HTML, JSON, text reports)
- [x] **Final Coverage Summary** (172 total tests):
  - **Overall: 75.41% statements, 63.87% branches, 74.54% functions**
  - Core Classes: Player 100%, SimpleAI 100%, Tile 97%, TileLibrary 94%, Directions 92%, Board 79%, Game 45%
  - Components: HelpModal 100%, GameSetup 88%, MarkdownRenderer 76%
  - UI Components: Input 100%, Label 100%, ScrollArea 100%, Button 100%, Select 92%, Dialog 82%
  - Content: Help files 100%, Utils 100%
- [x] Created `.nvmrc` file for Node version consistency (20.19.5)

**Testing Summary:**
- ✅ **172 passing tests** across 6 test suites  
- ✅ **75.41% overall code coverage**
- ✅ **Unit Tests (135 tests)**: Core game logic classes (Tile, Player, Board, Game, SimpleAI)
- ✅ **Integration Tests (37 tests)**: React components (GameSetup, Help Modal interaction)
- ✅ **100% coverage**: Player, SimpleAI, HelpModal, Input, Label, ScrollArea, Button, Utils
- ✅ **90%+ coverage**: Tile (97%), TileLibrary (94%), Select (92%), Directions (92%)
- ✅ **Good coverage**: GameSetup (88%), Dialog (82%), Board (79%), MarkdownRenderer (76%)
- ✅ **Baseline coverage**: Game class (45% - complex orchestration logic, good baseline)
- ✅ Vitest configured with jsdom environment for React component testing
- ✅ Test scripts: `npm test` (watch), `npm run test:run`, `npm run test:coverage`, `npm run test:ui`
- ✅ Automated test cleanup with afterEach hooks
- ✅ Mock support with Vitest's built-in vi utilities
- ✅ React Testing Library with user-event for realistic user interactions

**Note**: GameBoard and Canvas integration tests require more sophisticated mocking patterns for the Game class and Canvas API. These are deferred as they require additional infrastructure (test helpers, mock factories). Current test suite provides excellent coverage of business logic and simpler UI components.

### 3. State Management Refactoring ✅ COMPLETED

- [x] **COMPLETED**: Refactored monolithic `Game` class into focused manager classes:
  - [x] Created `ScoreManager` - Handles all scoring logic (105 lines)
    - [x] `scoreCompletedFeatures()` - Awards points during gameplay
    - [x] `calculateFinalScores()` - Scores incomplete features at game end
    - [x] `determineWinner()` - Winner determination with tie handling
    - [x] `calculateFeaturePoints()` - Point calculation utility
    - [x] **100% test coverage** with 24 comprehensive tests
  - [x] Created `TurnManager` - Handles turn progression and phase management (130 lines)
    - [x] `drawNextTile()` - Tile drawing from deck
    - [x] `advanceToNextPlayer()` - Player rotation logic
    - [x] `endTurn()` - Complete turn transition handling
    - [x] `getPhaseAfterPlacement()` - Phase determination logic
    - [x] `getTileStats()` - Tile count calculations
    - [x] `isValidPhaseTransition()` - Phase validation
    - [x] **100% test coverage** with 34 comprehensive tests
  - [x] Refactored `Game` class to use manager delegation pattern
    - [x] Reduced complexity by extracting ~150 lines to managers
    - [x] Maintained all existing functionality
    - [x] All 172 existing tests still passing
- [x] Replaced `any` types with proper TypeScript interfaces:
  - [x] Fixed `gameState` type in `GameBoard.tsx` (was `any`, now `GameState | null`)
  - [x] Created `GameState`, `PlayerState`, `TilePlacementResult` interfaces in `types.ts`
  - [x] Added proper null checks for type safety
  - [x] Moved shared types to central `types.ts` for better organization
- [x] Improved state management patterns:
  - [x] Manager classes use pure functions with no side effects
  - [x] Clear separation of concerns (scoring vs turn logic)
  - [x] Better testability through focused responsibilities
  - [x] Type-safe state transitions

**Refactoring Summary:**
- ✅ **230 passing tests** (up from 172)
- ✅ **77.6% overall coverage** (up from 75.41%)
- ✅ **New manager classes**: Both with 100% test coverage
- ✅ **Type safety**: Eliminated `any` types in critical components
- ✅ **Code organization**: Managers in dedicated `src/managers/` directory
- ✅ **No regressions**: All existing tests still pass after refactoring

### 4. Performance Optimizations

- [ ] Canvas rendering improvements:
  - [ ] Implement `requestAnimationFrame` loop for smooth rendering
  - [ ] Add canvas dirty checking to avoid unnecessary redraws
  - [ ] Optimize tile rendering with sprite caching
- [ ] React component optimizations:
  - [ ] Add `useMemo` for expensive calculations (valid placements, game stats)
  - [ ] Implement `useCallback` for event handlers
  - [ ] Add `React.memo` for pure components
- [ ] Memory management:
  - [ ] Limit activity log to last 100 entries (currently grows indefinitely)
  - [ ] Implement proper cleanup for event listeners
  - [ ] Add cleanup for AI timeouts on component unmount

## 🔧 Medium Priority

### 4. Error Handling & Validation

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

### 5. Code Quality & Documentation

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

### 6. Accessibility Improvements

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

### 7. AI Enhancement

- [ ] Advanced AI algorithms:
  - [ ] Implement minimax algorithm for better decision making
  - [ ] Add Monte Carlo tree search for strategic planning
  - [ ] Create multiple AI personality types
- [ ] Difficulty levels:
  - [ ] Easy: Current simple heuristic AI
  - [ ] Medium: Improved heuristics with lookahead
  - [ ] Hard: Advanced algorithms with deep analysis
- [ ] AI improvements:
  - [ ] Better follower placement strategy
  - [ ] Long-term planning capabilities
  - [ ] Adaptive difficulty based on player performance


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

1. **Week 1**: ✅ Testing infrastructure setup + Quick wins
2. **Week 2**: ✅ State management refactoring (COMPLETED)
3. **Week 3**: Performance optimizations (NEXT)
4. **Week 4**: Error handling and validation
5. **Month 2**: Code quality improvements and accessibility
6. **Month 3+**: Advanced features and AI enhancements

## Notes

- Focus on high-impact, low-effort items first
- Maintain backward compatibility during refactoring
- Test thoroughly before implementing breaking changes
- Document architectural decisions and trade-offs
