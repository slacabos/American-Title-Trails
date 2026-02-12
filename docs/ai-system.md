# AI System

American Tile Trails ships four AI difficulty levels that share a common
architecture but differ in evaluation weights, search depth, and follower
management. This document covers the full design.

## Architecture

```
src/ai/
  AIStrategy.ts                  Interface + types (strategy pattern contract)
  AIFactory.ts                   Factory that maps difficulty -> class
  RandomAI.ts                    Easy
  SimpleAI.ts                    Medium
  StrategicAI.ts                 Hard + Expert (Expert extends StrategicAI)
  evaluators/
    TilePlacementEvaluator.ts    Six-factor tile scoring engine
    FeatureAnalyzer.ts           Feature value estimation by terrain type
    index.ts                     Barrel exports
```

The **Strategy pattern** lets the game engine call a uniform interface
(`AIStrategy`) regardless of difficulty. A **Factory** (`AIFactory.create`)
maps a difficulty string to the right class. Each AI is instantiated once per
player at game start and receives an optional seeded RNG for deterministic
replays and testing.

### Key interfaces

| Type              | Purpose                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `AIStrategy`      | Contract: `evaluateTilePlacements`, `evaluateMeeplePlacement`, `getBestMove`                                    |
| `AIContext`       | Snapshot passed to every evaluation: board, tile, players, valid positions, claimable features, full game state |
| `TilePlacement`   | `{ position, rotation, score }`                                                                                 |
| `MeeplePlacement` | `{ type, identifier, score, shouldClaim }`                                                                      |
| `AIDecision`      | Combines a tile placement with an optional meeple placement                                                     |

## Game loop integration

The game engine (`src/game.ts` `processAITurn`) drives AI turns in two phases:

### Phase 1 — PLACE_TILE

1. Gather all candidate positions from `board.getPlacementCandidates()`.
2. Build an `AIContext` with the board, current tile, players, and candidates.
3. Call `aiStrategy.evaluateTilePlacements(context)` which returns placements
   sorted best-first.
4. Execute the top result via `placeTile(position, rotation)`.
5. If no valid placement exists the tile is discarded and the turn ends.

### Phase 2 — CLAIM_FEATURE

1. Look up the position of the tile that was just placed.
2. Gather claimable features with `getClaimableFeaturesForCurrentTurn()`.
3. Build a new `AIContext` containing those features.
4. Call `aiStrategy.evaluateMeeplePlacement(context, lastPosition)`.
5. If the result says `shouldClaim`, call `claimFeature(type, identifier)`.
   Otherwise call `skipClaim()`.

A fallback path (`processAITurnFallback`) handles the unlikely case where no
strategy is found: it tries the first valid placement/rotation pair and claims
the first available feature if the player has more than `AI_CLAIM_THRESHOLD`
(2) followers.

## Tile placement scoring

`TilePlacementEvaluator` scores every valid (position, rotation) combination
using six factors, each multiplied by a configurable weight:

### Scoring factors

| Factor                | What it measures           | How it's calculated                                                          |
| --------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| **Completion**        | Points scored immediately  | `board.previewPlacement()` sums points from all features that would complete |
| **Adjacency**         | Connectivity preference    | Count of occupied neighbor positions (0-4)                                   |
| **Costco preference** | Bias toward Costco tiles   | 1 if tile center is `costco` or `mixed`, else 0                              |
| **Extension bonus**   | Extending own features     | +1 per neighboring tile that has a claim belonging to the current player     |
| **Blocking bonus**    | Interfering with opponents | +0.5 per neighboring tile that has an opponent claim                         |
| **Position (center)** | Central board preference   | `max(0, 5 - euclideanDistanceFromBoardCenter)`                               |

A small random factor (0-0.1) breaks ties.

### Final formula

```
totalScore =
    completion   * w.completion
  + adjacency    * w.adjacency
  + costco       * w.costcoPreference
  + extension    * w.extensionBonus
  + blocking     * w.blockingBonus
  + position     * w.centerBonus
  + random(0, 0.1)
```

## Feature value analysis

`FeatureAnalyzer` estimates the value of claiming each feature type. Every
estimate returns `{ currentPoints, potentialPoints, completionChance,
totalValue }`.

### Costco

- **Current points**: tile count x points-per-tile + pennants x pennant bonus
  (2/tile + 2/pennant if complete, 1/tile + 1/pennant if not).
- **Potential points**: assumes +2 tiles toward completion at full rates.
- **Completion chance**: `max(0.1, 1.0 - openEdges * 0.15)`. More open edges
  means harder to close.
- **Total value**: `current * chance + potential * (1 - chance) * 0.3`.

### Road

- **Current points**: tile count x 1.
- **Potential points**: (tile count + 3) x 1.
- **Completion chance**: `max(0.2, 1.0 - openEnds * 0.2)`. Roads have a
  higher base chance than Costcos because they only need two endpoints.
- **Total value**: `current * chance + potential * (1 - chance) * 0.4`.

### McDonald's

- **Current points**: (filled surrounding tiles + 1) x 1.
- **Potential points**: 9 (max 3x3 grid).
- **Completion chance**: 0.9 if >= 5 neighbors filled, 0.6 if >= 3, 0.3
  otherwise.
- **Total value**: `current * chance + potential * (1 - chance) * 0.5`.

### Field (farmer)

- Traces the field feature via `board.traceFieldFeature` and collects all
  adjacent Costco features.
- Each adjacent **completed** Costco is worth 3 points. Each incomplete
  adjacent Costco contributes `completionChance * 3`.
- **Total value** is the sum of expected points across all adjacent Costcos.

## Difficulty levels

### Easy — `RandomAI`

The simplest strategy. Every valid (position, rotation) pair gets a random
score, so placement is effectively random. Meeple placement fires with a flat
15% probability (`AI_EASY_CLAIM_CHANCE`) and picks a random claimable feature.
`getBestMove` picks randomly from the top 5 placements.

### Medium — `SimpleAI`

Uses `TilePlacementEvaluator` with the default weight set. Meeple decisions
use `FeatureAnalyzer` estimates with the following modifiers:

| Modifier         | Condition              | Effect               |
| ---------------- | ---------------------- | -------------------- |
| Completion bonus | completionChance > 70% | score x 1.3          |
| McDonald's bonus | currentPoints >= 5     | score x 1.4          |
| Costco bonus     | currentPoints >= 4     | score x 1.2          |
| Field avoidance  | game < 60% complete    | score = 0            |
| Field scaling    | game >= 60% complete   | score x gameProgress |

Claim thresholds (minimum score to commit a follower):

| Feature    | Threshold |
| ---------- | --------- |
| McDonald's | 4.0       |
| Costco     | 4.0       |
| Road       | 2.0       |
| Field      | 1.0       |

Keeps 0 followers in reserve (`minFollowersToKeep = 0`).

### Hard — `StrategicAI`

Builds on `TilePlacementEvaluator` with boosted weights and adds two layers
on top: **defensive analysis** and **look-ahead search**.

#### Defensive analysis

After the base score is computed, `evaluateDefensiveValue` adjusts it:

- **Completing a shared feature where we have majority**: +points x 0.5.
- **Completing a feature that only benefits opponents**: -points x 0.3.
- **Placing next to an opponent's Costco claim**: +defensiveWeight x 0.5
  (positioning to contest or block).

#### Look-ahead

`evaluateLookAhead` previews the placement and estimates:

- **Immediate scoring**: each completed feature we claim gets +points x 0.3.
- **Future potential** (`estimateFuturePotential`): +2 per open Costco zone,
  +1 per road connection, +4 if McDonald's has >= 6 empty surrounding cells.
  Weighted x 0.2.

Look-ahead is time-bounded (`maxSearchTimeMs = 400`) — if the wall clock
exceeds the budget, remaining placements skip the look-ahead step.

#### Meeple modifiers (hard)

| Modifier                 | Condition                     | Effect                     |
| ------------------------ | ----------------------------- | -------------------------- |
| Completion bonus         | chance > 80%                  | score x 1.5                |
| Completion penalty       | chance < 30%                  | score x 0.5                |
| McDonald's bonus         | currentPoints >= 6            | score x 1.6                |
| McDonald's bonus         | currentPoints >= 4            | score x 1.25               |
| Costco bonus             | currentPoints >= 6            | score x 1.4                |
| Field avoidance          | game < 50% complete           | score = 0                  |
| Field scaling            | game >= 50% complete          | score x gameProgress x 1.5 |
| Last follower protection | followers <= 1 and score < 10 | score = 0                  |

Claim thresholds:

| Feature    | Threshold |
| ---------- | --------- |
| McDonald's | 5.0       |
| Costco     | 5.5       |
| Road       | 3.5       |
| Field      | 2.5       |

#### Follower management

Dynamic threshold based on game progress:

| Game phase | Progress | Min followers to keep |
| ---------- | -------- | --------------------- |
| Early      | < 30%    | 1                     |
| Mid        | 30-70%   | 1                     |
| Late       | > 70%    | 0                     |

### Expert — `ExpertAI`

Extends `StrategicAI` with no new logic, just more aggressive tuning:

- Deeper search (depth 3, 600ms budget).
- Lower `defensiveWeight` (1.5 vs 2.0) — less penalty for helping opponents,
  more focus on own scoring.
- All claim threshold and meeple modifier logic is inherited from
  `StrategicAI`.

## Weight comparison

| Weight             | Default (medium) | Hard | Expert |
| ------------------ | ---------------- | ---- | ------ |
| `completion`       | 6                | 8    | 12     |
| `adjacency`        | 1                | 1.5  | 2.2    |
| `costcoPreference` | 2                | 3    | 5      |
| `extensionBonus`   | 3                | 5    | 7      |
| `blockingBonus`    | 2                | 4    | 5.5    |
| `centerBonus`      | 0.5              | 0.3  | 0.6    |

The expert profile pushes completion and extension weights roughly 2x above
the medium baseline. The hard profile sits in between, with a notably lower
`centerBonus` to avoid over-valuing central positions.

## Search parameters

| Parameter             | Hard | Expert |
| --------------------- | ---- | ------ |
| `searchDepth`         | 2    | 3      |
| `maxSearchTimeMs`     | 400  | 600    |
| `defensiveWeight`     | 2.0  | 1.5    |
| `claimThresholdScale` | 1    | 1      |

## Testing

### Unit tests — `src/test/ai.test.ts`

- Verifies all four difficulty levels produce valid placements.
- Tests factory creation and custom configuration overrides.
- Integration test: runs a full AI-vs-AI game to completion.

### Simulation tests — `src/test/ai.sim.test.ts`

- Runs 100 games per difficulty pairing (easy vs medium, medium vs hard, etc.).
- Asserts that the higher difficulty wins >= 53% of games.
- Uses seeded RNG for reproducible results.
