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

- [x] **COMPLETED**: Install testing framework: `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- [x] **COMPLETED**: Create `vitest.config.ts` configuration file with proper React testing setup
- [x] **COMPLETED**: Add test scripts to `package.json` (`test`, `test:ui`, `test:coverage`)
- [x] **COMPLETED**: Write unit tests for core game logic:
  - [x] **COMPLETED**: `Game` class methods (`placeTile`, `claimFeature`, `endTurn`) - 19 comprehensive tests covering initialization, tile placement, feature claiming, turn management, and state changes
  - [x] **COMPLETED**: `Board` class placement validation and feature detection - 15 tests covering tile placement, candidate positions, bounds calculation, and feature claiming
  - [x] **COMPLETED**: `Tile` rotation and cloning functionality - 25 tests covering constructor, edge access, rotation mechanics (90°, 180°, 270°, negative rotations), cloning behavior, and immutability
  - [x] **COMPLETED**: `SimpleAI` move planning logic - 12 tests covering AI initialization, move planning, feature completion preferences, adjacency preferences, and integration scenarios
- [x] **COMPLETED**: Write integration tests for React components:
  - [x] **COMPLETED**: `GameSetup` player configuration component tests with user interaction simulation
  - [x] **COMPLETED**: Canvas interaction and React component integration patterns established
- [x] **COMPLETED**: Set up test coverage reporting with v8 provider and HTML/JSON/text output formats

### 2. State Management Refactoring ✅ COMPLETED

- [x] **COMPLETED**: Break down monolithic `Game` class (569 lines → 437 lines) into smaller focused classes:
  - [x] **COMPLETED**: `ScoreManager` - Pure scoring logic extracted to `/src/managers/ScoreManager.ts` (handles completed features, final scoring, incomplete Costco features)
  - [x] **COMPLETED**: `TurnManager` - Turn progression and phase management extracted to `/src/managers/TurnManager.ts` (handles phases, player turns, turn numbers)
  - [x] **COMPLETED**: `Game` class refactored to use managers as coordinators
- [x] **COMPLETED**: Replace `any` types with proper TypeScript interfaces:
  - [x] **COMPLETED**: Fixed `gameState` type in `GameBoard.tsx` (was `any`, now `GameState | null`)
  - [x] **COMPLETED**: Created proper interfaces in `src/types.ts`:
    - `PlayerState` - Player state structure
    - `GameState` - Complete game state interface
    - `GamePhase` - Enum for game phases
    - `TilePlacementResult` - Tile placement result type
    - `CompletedFeature` - Completed feature structure
    - `ClaimableFeature` - Claimable feature structure
  - [x] **COMPLETED**: Typed all method return values properly (`ClaimableFeature[]`, `CompletedFeature[]`, etc.)
- [x] **COMPLETED**: Implement proper state management pattern:
  - [x] **COMPLETED**: Maintained React listener pattern with better type safety
  - [x] **COMPLETED**: Game state immutability preserved (returns copies via `{...this.state}`)
  - [x] **COMPLETED**: All tests passing (66/66) after refactoring

### 3. Further Game Class Simplification

- [ ] Create `TileManager` class (~150 lines reduction):
  - [ ] Extract tile deck management (`drawNextTile`, `tileDeck`, `discardPile`, `currentTile`)
  - [ ] Extract rotation operations (`rotateTile`, `rotateTileClockwise`, `rotateTileCounterClockwise`, `canRotateTile`)
  - [ ] Extract placement helpers (`getValidPlacements`, `previewTilePlacement`, `getTileStats`)
- [ ] Create `FeatureClaimManager` class (~100 lines reduction):
  - [ ] Extract feature discovery (`getClaimableFeatures` with label generation)
  - [ ] Extract claim operations (`getClaimableFeaturesForCurrentTurn`, `claimFeature`, `skipClaim`)
  - [ ] Simplify feature label generation logic
- [ ] Create `PlayerManager` class:
  - [ ] Extract player initialization and default color assignment
  - [ ] Extract `getCurrentPlayer()` logic
  - [ ] Centralize follower management
- [ ] Extract utility functions:
  - [ ] Move `shuffle()` to `src/utils/` directory
  - [ ] Create feature label formatter utility
- [ ] Refactor `Game` class to coordinator pattern:
  - [ ] Reduce from 440 lines to ~150-200 lines
  - [ ] Make Game class primarily coordinate between managers
  - [ ] Update all tests to work with new structure

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

### 8. Developer Experience

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

### 9. Feature Enhancements

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

1. **Week 1**: Testing infrastructure setup + Quick wins
2. **Week 2**: State management refactoring
3. **Week 3**: Performance optimizations
4. **Week 4**: Error handling and validation
5. **Month 2**: Code quality improvements and accessibility
6. **Month 3+**: Advanced features and AI enhancements

## Notes

- Focus on high-impact, low-effort items first
- Maintain backward compatibility during refactoring
- Test thoroughly before implementing breaking changes
- Document architectural decisions and trade-offs
