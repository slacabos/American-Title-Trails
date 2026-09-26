# AGENTS.md - AI Assistant Guide for American Tile Trails

## Project Overview

American Tile Trails is a Carcassonne-inspired tile-placement board game built with TypeScript and React, drawn as a 3D tabletop with three.js. McDonald's stand in for monasteries, Costcos for castles, and highways for roads. Every game opens with a River. 2-5 players play locally, in any mix of humans and AI at four difficulty levels. Games autosave after every move and can be continued after a reload. The game has synthesized sound effects.

### Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000 (next free port if taken)
npm test             # Vitest unit tests (includes the AI balance simulation)
npm run test:browser # Playwright end-to-end tests in Chromium
npm run storybook    # Storybook on port 6006
```

### Tech Stack

- **TypeScript 6** in strict mode. `lib` is ES2020, so newer built-ins such as `Array.prototype.at` aren't available.
- **React 19** with hooks; no external state library. The React Compiler lint rules are on (`eslint-plugin-react-hooks` 7).
- **three.js r186 + React Three Fiber 9** for the board, tile preview and scenery, all procedural (no model or image files)
- **Vite 8** for the dev server and builds
- **Tailwind CSS 4** configured with `@theme inline` in `src/index.css` (there's no `tailwind.config.js`)
- **Radix UI** primitives in shadcn/ui-style components (`src/components/ui/`), with **lucide-react** icons
- **Web Audio API** for sound, synthesized in code (no audio files)
- **Vitest 4** for unit tests (jsdom) and for Storybook stories, which run in a real browser through Playwright
- **Playwright** for end-to-end tests (`e2e/`)
- **Storybook 10**, with stories colocated with their components
- **ESLint 10** flat config (`eslint.config.js`)
- **react-markdown** + remark-gfm for the in-app help

---

## Architecture

### Core Design Principles

1. **Framework-agnostic game logic:** `Game`, `Board`, `Tile` and the managers are plain TypeScript with no React dependencies.
2. **Interface-based design:** the `ITile` and `IBoard` interfaces decouple the engine from the managers and the AI.
3. **One source of truth:** the `Game` instance owns the state. React subscribes with a listener and gets a fresh `GameState` snapshot on every change.
4. **Immutable tiles:** `tile.rotate()` returns a new `Tile`; `orientation` counts quarter turns from the drawn tile.
5. **Deterministic games:** a seed fixes both deck shuffles. With the seed, the players and the list of moves (`GameAction[]`), `Game.replay` rebuilds any game exactly. Save/resume and take-back both rely on this.
6. **Strategy pattern for the AI:** each difficulty implements `AIStrategy`.
7. **3D code stays out of the main bundle:** `BoardScene` is lazy-loaded by `BoardView`. Code the HUD needs from the rendering side must not import `three` (see `src/rendering/landingTiming.ts`).

### State Management Flow

```
User action → Game method → state change → listener → setGameState → re-render
                   ↓
       phase: PLACE_TILE → CLAIM_FEATURE → (score, draw next tile) → next player's PLACE_TILE
```

`GameBoard.tsx` owns the `Game` instance, runs AI turns after `GAME_RULES.AI_MOVE_DELAY_MS`, and keeps the activity log. The board and players are updated in place, so code that compares two states must copy the values it needs first (see `soundSnapshot` in `src/audio/cues.ts`).

### Manager Classes (`src/managers/`)

| Manager               | Responsibility                                                    |
| --------------------- | ----------------------------------------------------------------- |
| `ScoreManager`        | Score calculation, final scoring, farmer scoring, score breakdown |
| `TurnManager`         | Turn flow, phase transitions, player rotation                     |
| `TileManager`         | Tile deck, drawing, rotation, valid placements                    |
| `FeatureClaimManager` | Feature claiming logic, claimable feature detection, labels       |
| `PlayerManager`       | Player state (followers, colors, names), initialization           |

### Moves, Saves and Take-back

- `Game` records each successful move with `getActions()`. A move is `place` (with position and absolute `orientation`), `claim`, `skip`, or `discard` (an AI tile with no legal spot).
- `Game.replay(players, seed, actions)` returns `undefined` if any move no longer applies, for example a save from an older tile library. It builds with `new this(...)` so subclasses (including test doubles) replay as themselves.
- `src/persistence/savedGame.ts` stores `{ version, savedAt, seed, players, actions, log, turnNumber }` under `american-tile-trails.save`. `GameBoard` autosaves after each move and clears the save when the game ends. `App` offers **Continue game** on the setup screen when a save still replays.
- Take-back replays every move except the last `place`, then turns the tile back to the orientation it was placed at. It's only offered to a human in the claim phase.
- A new game always gets a random seed, and `sceneSeed` (regional landscapes) defaults to it, so a resumed game looks the same.

### Rendering (`src/components/three/`, `src/rendering/`)

- `BoardScene.tsx`: camera, controls, placement grid, landing animation and scenery for the board. `Scenery.tsx`: instanced tile models. `PlacementGrid.tsx`: legal-space outlines.
- `src/rendering/`: pure, testable helpers such as tile layout, camera poses (tabletop and drone), keyboard mapping, the landing animation, level of detail, regions, vegetation, warehouse geometry, night mode and landmarks.
- The scene renders on demand and goes idle when nothing moves. The landing animation plays only when the board gains a tile, so a resumed game or a take-back never drops an older tile again.
- See [docs/3d-rendering.md](docs/3d-rendering.md) for coordinates, scenery, landmarks, regions, night mode and verification.

### Sound (`src/audio/`)

- `soundEngine.ts` synthesizes each `Cue` with oscillators and filtered noise. The `AudioContext` starts on the first pointer or key press (browser autoplay rules). Cues are dropped before then, or when Web Audio is missing.
- `cues.ts` is a pure function from the previous and next state snapshots to timed cues. That's how AI moves get sound too. The landing thud is timed to `LANDING_IMPACT_MS`.
- `useSound` (on/off, remembered, key **M**) and `useGameSounds` connect it to `GameBoard`.

### Preferences

Small settings (camera view, day/night, sound) each have a module that reads and writes one `localStorage` key inside try/catch (`src/rendering/cameraView.ts`, `src/rendering/timeOfDay.ts`, `src/audio/soundPreference.ts`). A hook keeps every component in sync with a custom window event (`useTimeOfDay`, `useSound`). Follow this pattern for new preferences.

---

## Project Structure

```
src/
├── App.tsx                   # Setup screen ⇄ game; offers to continue a saved game
├── main.tsx                  # React entry point
├── game.ts                   # Game class: orchestrates turns, AI, moves and replay
├── board.ts                  # Board: placement rules, feature tracing, claims
├── tile.ts                   # Immutable Tile
├── tileLibrary.ts            # Land tiles: 15 types, 51-tile deck (+ unused "starter-proper")
├── riverLibrary.ts           # 12 River tiles: source, 10 shuffled, lake
├── riverRules.ts             # River placement rules
├── directions.ts             # DIRECTIONS, OPPOSITE, DELTAS, rotateDirection
├── types.ts                  # Shared types and enums, including GameAction
├── ai/                       # AIStrategy, AIFactory, RandomAI, SimpleAI, StrategicAI + ExpertAI
│   └── evaluators/           # TilePlacementEvaluator, FeatureAnalyzer
├── managers/                 # See the table above
├── interfaces/               # ITile, IBoard
├── persistence/savedGame.ts  # Autosave, load and restore
├── audio/                    # soundEngine, cues, soundPreference
├── components/
│   ├── GameBoard.tsx         # The game screen: HUD, keyboard, AI turns, autosave, take-back
│   ├── BoardView.tsx         # Lazy-loads the 3D scene; view toggle, status, WebGL fallback
│   ├── GameSetup.tsx         # Player setup and the Continue panel
│   ├── PlayerConfigRow.tsx, GameOverPanel.tsx, FollowerDetails.tsx
│   ├── HelpModal.tsx, MarkdownRenderer.tsx, ErrorBoundary.tsx
│   ├── hud/                  # Scoreboard, TileDock, ActivityLog, ShortcutList, TimeToggle, SoundToggle, HudPanel
│   ├── three/                # BoardScene, Scenery, PlacementGrid
│   └── ui/                   # button, dialog, input, label, select
├── rendering/                # Pure 3D, camera and keyboard helpers (see Rendering)
├── hooks/                    # useTranslations, useTimeOfDay, useSound, useGameSounds
├── constants/                # gameRules.ts (GAME_RULES), colors.ts
├── content/
│   ├── translations/en.json  # UI strings
│   └── help/en.md → en.ts    # Help text (regenerate en.ts with sync-help-content)
├── utils/                    # arrayUtils (shuffle), followerUtils, rng (seeded RNG)
├── lib/utils.ts              # cn() class merging
├── examples/                 # Old translation migration notes
├── types/json.d.ts           # JSON module declaration
└── test/                     # Vitest tests, setup.ts and fixtures
e2e/                          # Playwright specs and test-only harness pages (tabletop.html, tiles.html, warehouses.html)
docs/                         # 3d-rendering.md, ai-system.md, river.md
scripts/                      # sync-help-content.js, merge-coverage.mjs
```

---

## Key Code Patterns

### Positions

Positions are keyed as `"x,y"` strings with a `positionKey` helper. `board.ts` and `riverRules.ts` each keep a private one, and `src/rendering/tileLayout.ts` exports one for the UI. Use a helper rather than building keys inline.

### Directions

```typescript
// src/directions.ts
DIRECTIONS; // ["north", "east", "south", "west"]
rotateDirection("north", 1); // "east": clockwise quarter turns
rotateDirection("north", -1); // "west"
```

### Game Phases

```typescript
enum GamePhase {
  PLACE_TILE = "place_tile",
  CLAIM_FEATURE = "claim_feature", // only entered when the tile offers a claim and the player has a follower
  SCORE_FEATURES = "score_features",
  END_TURN = "end_turn",
  GAME_OVER = "game_over",
}
```

### Mutating the Game

All changes go through `Game` methods: `placeTile(position, rotation)`, `claimFeature(type, identifier)`, `skipClaim()`, `rotateTile(times)` and `processAITurn()`. Moves are recorded only from these methods. The UI rotates the current tile first and then calls `placeTile(position)`; the AI passes a rotation instead.

### Keyboard Shortcuts

`SHORTCUT_GROUPS` in `src/rendering/keyboard.ts` is the single table of shortcuts; the help screen's list is rendered from it. `GameBoard.tsx` handles the keys. Add a new shortcut to both, plus a string under `shortcuts.*` and a line in `src/content/help/en.md`.

---

## Development Workflow

### Essential Commands

| Command                                                   | Description                                            |
| --------------------------------------------------------- | ------------------------------------------------------ |
| `npm run dev`                                             | Vite dev server (port 3000, opens the browser)         |
| `npm run build`                                           | Type check + production build                          |
| `npm run preview`                                         | Serve the production build                             |
| `npx tsc --noEmit`                                        | Type check only                                        |
| `npm run lint` / `npm run lint:fix`                       | ESLint on `src/`                                       |
| `npm test`                                                | All unit tests, including the AI simulation            |
| `npm run test:ai-sim`                                     | Only the AI balance simulation                         |
| `npx vitest run --config vite.config.ts --project storybook` | Every story, rendered and tested in Chromium        |
| `npm run test:browser`                                    | Playwright end-to-end tests (starts a dev server on 4173) |
| `npm run test:coverage`                                   | Unit + Storybook coverage, merged; enforces the 80% gate |
| `npm run storybook` / `npm run build-storybook`           | Storybook                                              |
| `npm run sync-help-content en`                            | Regenerate `src/content/help/en.ts` from `en.md`       |

Browser tests need Chromium: `npx playwright install chromium`. They use SwiftShader for WebGL, so they run without a GPU.

### Testing

- **Unit tests** live in `src/test/` (Vitest, jsdom), grouped roughly as:
  - rules and engine: `board`, `tile`, `field`, `river`, `game`, `gameGuards`, `scoreManager`
  - AI: `ai`, `ai.sim` (balance thresholds between difficulties)
  - save and replay: `savedGame`
  - sound: `cues`, `sound`
  - UI: `gameSetup`, `keyboardPlay`, `featureHighlight`, `boardView`
  - rendering helpers: `keyboard`, `tileLayout`, `landing`, `lod`, `regions`, `scenery`, `vegetation`, `warehouseLayout`, `completedCostcos`, `cameraView`, `timeOfDay`
- **Seed tests that play games** (`new Game(players, { seed })`) so they're deterministic. Several UI tests mock `@/game` with a seeded subclass.
- **Stories** double as browser tests through `@storybook/addon-vitest`. Add a story for new visual states.
- **End-to-end tests** in `e2e/` drive the real app (`/`), or test-only harness pages that expose `window.tabletopTest` for inspecting the scene.
- **Coverage:** `scripts/merge-coverage.mjs` fails below 80% for merged unit + Storybook coverage.
- A console warning, "THREE.Clock: This module has been deprecated", comes from React Three Fiber 9 and is expected.

### Path Aliases

`@/` resolves to `src/` in Vite, Vitest and TypeScript.

---

## Game Concepts

### Terrain Types

```typescript
type TerrainType = "road" | "field" | "costco" | "mcdonalds" | "mixed" | "river";
type FollowerType = "standard" | "farmer";
type FieldCorner = "nw" | "ne" | "sw" | "se";
```

| Type        | Description                          | Completed                               | Incomplete at game end            |
| ----------- | ------------------------------------ | --------------------------------------- | --------------------------------- |
| `road`      | Highways                             | 1 pt/tile                               | 1 pt/tile                         |
| `costco`    | Costco shopping areas (cities)       | 2 pts/tile + 2 pts/pennant              | 1 pt/tile + 1 pt/pennant          |
| `mcdonalds` | McDonald's restaurants (monasteries) | 9 pts (all 8 surrounding tiles filled)  | 1 pt per tile in the 3×3 area     |
| `field`     | Fields (farmers)                     | Scored at game end only                 | 3 pts per adjacent completed Costco |
| `river`     | Water: can't be claimed, scores nothing | –                                    | –                                 |

### The River Opening

The River source is placed at (0, 0). Players then place the 10 shuffled River tiles and the lake before the land deck starts. That's 63 tiles in all: 12 River tiles and 51 land tiles. See [docs/river.md](docs/river.md).

### Followers

- Each player has **7 followers** (`GAME_RULES.FOLLOWERS_PER_PLAYER`).
- Standard followers go on roads, Costcos or McDonald's and come back when the feature completes. Farmers go on fields and stay until the game ends.
- Majority rule: only the player(s) with the most followers on a feature score; ties score in full.
- You can only claim a feature nobody holds yet, but features can merge into shared ones.

### Rules Constants

All rule numbers live in `GAME_RULES` (`src/constants/gameRules.ts`): scoring values, follower count, player limits, AI thresholds, search depths and time limits, and `AI_MOVE_DELAY_MS`. Use them rather than literal numbers.

---

## AI System

Every difficulty implements `AIStrategy` (`evaluateTilePlacements`, `evaluateMeeplePlacement`, `getBestMove`). `AIFactory.create(difficulty, rng)` builds one.

| Difficulty | Class         | Strategy                                                |
| ---------- | ------------- | ------------------------------------------------------- |
| Easy       | `RandomAI`    | Random valid placements, 15% chance to claim            |
| Medium     | `SimpleAI`    | Weighted heuristics with feature analysis               |
| Hard       | `StrategicAI` | Look-ahead (depth 2, ~400 ms), defensive play           |
| Expert     | `ExpertAI`    | Deeper look-ahead (depth 3, ~600 ms), stronger weights (in `StrategicAI.ts`) |

`TilePlacementEvaluator` scores every position × rotation; `FeatureAnalyzer` estimates what a feature is worth. After changing the AI, run `npm run test:ai-sim` to check the balance thresholds. [docs/ai-system.md](docs/ai-system.md) has the full weights and formulas.

---

## Internationalization

- All UI strings are in `src/content/translations/en.json`, read with `const { t } = useTranslations()`. Use `{name}` placeholders: `t("messages.placedTile", { playerName, x, y })`.
- Help text is `src/content/help/en.md`. After editing it, run `npm run sync-help-content en` to regenerate `en.ts`.
- English is the only language so far. [TRANSLATIONS.md](TRANSLATIONS.md) explains what adding one involves.

---

## Common Tasks

### Adding a Tile Type

1. Add the definition to `src/tileLibrary.ts`, including `fieldSegments` so farmers work, and its count in `TILE_QUANTITIES`.
2. Add any landmark in `src/rendering/landmarks.ts`. Scenery is otherwise built from the tile's features in `src/rendering/scenery.ts`.
3. Check it in Storybook (Game / 3D Tabletop shows every tile and rotation) and in `e2e/tiles.spec.ts`.

### Modifying Scoring

Update `GAME_RULES`, then `ScoreManager.ts`, and `board.ts` if completion detection changes. Add tests in `src/test/scoreManager.test.ts`.

### Adding UI

Use the components in `src/components/ui/` and the Tailwind theme tokens in `src/index.css`. The display font is the `--font-game` variable (used by `.brand-wordmark`). Put strings in `en.json` and add a colocated story.

### Adding a Game Action

Anything that changes the game must go through a `Game` method that records a `GameAction` and is handled by `applyAction`, or saved games will stop replaying. Add a replay test in `src/test/savedGame.test.ts`. If the save format changes incompatibly, bump `VERSION` in `savedGame.ts`.

---

## Code Style

- No `any` types in new code; use the types in `src/types.ts` or `src/interfaces/`.
- Methods return structured results (`{ success, completedFeatures, message }`).
- Use JSDoc on public methods, and short comments that explain *why*.
- Prefer `@/` imports.
- Components are PascalCase `.tsx` files; rule numbers come from `GAME_RULES`.
- No emojis in code.
- Every `localStorage` access is wrapped in try/catch; storage can be unavailable.

---

## Git Workflow and Releases

- Before committing, run `npx tsc --noEmit`, `npm run lint` and `npm test`. For UI or 3D changes also run the Storybook tests and `npm run test:browser`. CI (`.github/workflows/ci.yml`) runs all of these on pushes to `main` and on pull requests.
- Commit messages are short, imperative sentences (for example "Add synthesized sound effects with a mute toggle").
- **Releases:** bump the version with `npm version X.Y.Z --no-git-tag-version`, commit "Release version X.Y.Z", then create an annotated tag `vX.Y.Z` with a one-line summary and push `main` and the tag.
