# American Tile Trails

American Tile Trails is a Carcassonne-inspired board game built with TypeScript and React. Place tiles across an American landscape where McDonald's stands in for monasteries, Costcos replace castles, and highways stitch everything together. Play locally with 2-5 players in any mix of humans and AI.

## Getting started

```bash
npm install
npm run dev
```

The Vite dev server runs at http://localhost:3000 and opens automatically.

## Game features

- Local multiplayer with 2-5 players.
- AI opponents with easy, medium, hard, and expert difficulty.
- A 12-tile River opening, followed by the existing 51 land tiles (63 tiles total).
- Curving water, lakeside restaurants, and road bridges on a 3D tabletop.
- Placed tiles drop onto the 3D tabletop with a small bounce and a puff of dust.
- Synthesized sound effects (no audio files) for landings, claims, completions and turns; M mutes.
- Tile rotation with live placement validation.
- Feature claiming for roads, Costcos, McDonald's, and fields (farmers).
- Farmers stay on the board and score at game end.
- Real-time scoreboard, activity log, and turn/tile stats.
- Zoom, pan, and hover previews on the board canvas.
- In-app Help modal backed by markdown content.

See [River rules and implementation](docs/river.md) for the opening sequence and publisher references.

## AI difficulty modes

- Easy (RandomAI): random valid placements, with a ~15% chance to claim a feature.
- Medium (SimpleAI): weighted heuristics for completion, adjacency, Costco preference, and extension. Uses value thresholds for claiming and avoids fields early game.
- Hard (StrategicAI): heuristic scoring plus defensive play and limited look-ahead (depth 2, ~400ms). More conservative follower usage and blocking bias.
- Expert (ExpertAI): stronger weights with deeper look-ahead (depth 3, ~600ms) and more aggressive scoring.

For the full architecture, scoring formulas, weight tables, and extension guide, see [docs/ai-system.md](docs/ai-system.md).

## How to play (quick)

1. Extend the river from its preplaced source through 10 shuffled tiles to the lake, then place land tiles on valid highlighted spaces.
2. Optionally claim a feature with a follower.
3. Completed features score immediately; farmers score at game end.

For the full guide, see `src/content/help/en.md` (the in-app Help modal uses this file).

## Scoring summary

- Roads: 1 point per tile when completed.
- Costcos (completed): 2 points per tile, plus 2 points per pennant.
- Costcos (incomplete at game end): 1 point per tile, plus 1 point per pennant.
- McDonald's (completed): 9 points when all 8 surrounding tiles are filled.
- McDonald's (incomplete at game end): 1 point per tile in the 3x3 area (including the McDonald's tile).
- Farmers (fields): 3 points per adjacent completed Costco at game end.

## Technology stack

- TypeScript + React 18
- Vite + Tailwind CSS v4
- Radix UI primitives
- HTML5 Canvas for board rendering
- Storybook for UI development
- Vitest + Playwright for tests

## Development commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Tests
npm run test
npm run test:ui
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Storybook
npm run storybook
npm run build-storybook

# Sync help content from markdown to TS
npm run sync-help-content en
```

## Requirements

- Node >= 20.19.5
- npm >= 10.8.2

## Localization

UI strings live in `src/content/translations/en.json` and are accessed via `src/hooks/useTranslations.ts`. The help content is markdown in `src/content/help/en.md` and can be synced to TS with `npm run sync-help-content en`.

### 3D tabletop

The game opens in an angled 3D view with miniature highways, Costco warehouses,
McDonald's restaurants, parking lots, vegetation, and colored followers. The
**Tabletop / Drone** switch swings the camera between that angled view and a
top-down drone view with north at the top. It preserves the current game and
remembers your choice. The game needs WebGL: if 3D graphics cannot start or stop
responding, the board shows a **Try again** button and the game state is kept.

- **Mouse:** hover over a green outline to preview; click to place. Drag to pan,
  scroll to zoom, and use **Fit board** to restore automatic framing.
- **Tablet:** drag to pan or pinch to zoom. Tap a legal space to preview, then
  press **Place tile**; **Cancel** dismisses the preview. A light grid fades into
  the tabletop around the board, with stronger outlines for legal placements.
- **Keyboard:** arrow keys or `WASD` move a placement cursor between legal
  spaces and `Enter` places the tile; `E` and `Q` rotate clockwise and
  counter-clockwise. In the claim phase `Up`/`Down` (or `W`/`S`) choose a
  feature, `Enter` or `1`–`9` claim it, and `X` skips. `+`/`-` zoom,
  `Shift+Arrows`/`Shift+WASD` pan, `F` fits, `V` switches view, `N` toggles
  night and `?` opens help, which lists every shortcut.
- **Rotation:** use the rotation buttons or the keys above before placing.
- **Claims:** hover or focus a claim button to highlight its feature. Standing
  pawns mark ordinary followers; reclining pawns mark farmers. Gold signs mark
  bonus pennants; small fences distinguish otherwise adjoining separate fields.

The board and current-tile preview share procedural scenery. No downloaded model
packs or image service are needed. The 3D code loads when selected, batches
repeated tile models, and renders on demand to avoid drawing while idle.

```bash
npm run test:browser       # Chromium: placement, touch, fallback, full-board checks
npm run test:coverage      # Unit + Storybook browser coverage; enforces the 80% gate
npm run storybook         # Game / 3D Tabletop: connected scenery, full deck, all rotations
```

Browser checks use Playwright Chromium; install it with `npx playwright install
chromium` if it is not available. The `e2e/tabletop.html` fixture is used only by the
development test server and is excluded from the production build. See
[3D rendering notes](docs/3d-rendering.md) for architecture and validation details.
