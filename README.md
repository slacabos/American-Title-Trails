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
- 16 tile types, 52 tiles in the deck, plus a starting tile.
- Tile rotation with live placement validation.
- Feature claiming for roads, Costcos, McDonald's, and fields (farmers).
- Farmers stay on the board and score at game end.
- Real-time scoreboard, activity log, and turn/tile stats.
- Zoom, pan, and hover previews on the board canvas.
- In-app Help modal backed by markdown content.

## AI difficulty modes

- Easy (RandomAI): random valid placements, with a ~30% chance to claim a feature.
- Medium (SimpleAI): weighted heuristics for completion, adjacency, Costco preference, and extension. Uses value thresholds for claiming and avoids fields early game.
- Hard (StrategicAI): heuristic scoring plus defensive play and limited look-ahead (depth 2, ~400ms). More conservative follower usage and blocking bias.
- Expert (ExpertAI): stronger weights with deeper look-ahead (depth 3, ~600ms) and more defensive pressure.

## How to play (quick)

1. Place a tile on a valid highlighted position.
2. Optionally claim a feature with a follower.
3. Completed features score immediately; farmers score at game end.

For the full guide, see `src/content/help/en.md` (the in-app Help modal uses this file).

## Scoring summary

- Roads: 1 point per tile when completed.
- Costcos (completed): 2 points per tile, plus 2 points per pennant.
- Costcos (incomplete at game end): 1 point per tile, plus 1 point per pennant.
- McDonald's: 9 points when all 8 surrounding tiles are filled.
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
