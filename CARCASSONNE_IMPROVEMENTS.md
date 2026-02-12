# Carcassonne Mechanics - Improvement Recommendations

## Terminology Mapping

**IMPORTANT**: Understanding how Carcassonne terms map to your American-themed implementation:

| Carcassonne Term | American Title Trails Term | Current Status                                        |
| ---------------- | -------------------------- | ----------------------------------------------------- |
| City             | **Costco**                 | ✅ Fully implemented with zones and pennants          |
| Road             | **Road**                   | ✅ Fully implemented with connections                 |
| Monastery        | **McDonald's**             | ✅ Fully implemented with 8-tile surrounding          |
| Field            | **Field**                  | ✅ Fully implemented with corner-based segments       |
| Meeple           | **Follower**               | ✅ Implemented (7 per player)                         |
| Farmer           | **Follower on Field**      | ✅ Fully implemented with end-game scoring            |
| Shield/Pennant   | **Gas Station (Pennant)**  | ✅ Implemented on Costcos                             |

**What are FIELDS in your game?**

- Fields are the green/grass terrain areas between roads and Costco shopping areas
- In your code: `TerrainType = "road" | "field" | "costco" | "mcdonalds"`
- Fields appear on tile edges (e.g., `edges: { north: "field", east: "costco", ... }`)
- Fields appear in tile centers (e.g., `center: "field"`)
- **Implementation**: Fields use corner-based segments (FieldSegment with FieldCorner[]) for accurate tracing
- **Scoring**: Farmers score 3 points per adjacent completed Costco at game end

**How FIELDS work**:

- A single tile can have MULTIPLE separate field areas
- Fields are SEPARATED by roads and Costco areas (these act as walls)
- Fields CONNECT across tile edges when both edges are "field" terrain
- **Example**: Straight road tile → 2 separate fields (one on each side of road)
- **Example**: T-junction tile → 3 separate fields (one in each corner without road)

---

## Executive Summary

Your American Title Trails implementation has solid fundamentals. This document outlines remaining gaps and provides implementation recommendations.

---

## Critical Issues

### 1. ✅ Majority Rule for Tied Features — Done (`ScoreManager.ts`)

**Current State:** Code collects all claimants but doesn't implement majority rule.

```typescript
// Current code (board.ts line 462)
private getFeatureClaimants(feature: Feature): string[] {
  const claimants = new Set<string>();
  feature.edges.forEach((edge) => {
    const claim = this.featureClaims.get(edge);
    if (claim) {
      claim.players.forEach((player) => claimants.add(player));
    }
  });
  return Array.from(claimants); // ❌ No majority calculation
}
```

**Standard Carcassonne Rule:**
When multiple players have followers on the same completed feature:

- Count followers for each player
- Player(s) with **most** followers get ALL the points
- Ties: ALL tied players get FULL points

**Fix Required:**

```typescript
private getFeatureClaimants(feature: Feature): string[] {
  const followerCounts = new Map<string, number>();

  // Count followers per player
  feature.edges.forEach((edge) => {
    const claim = this.featureClaims.get(edge);
    if (claim) {
      claim.players.forEach((player) => {
        followerCounts.set(player, (followerCounts.get(player) || 0) + 1);
      });
    }
  });

  if (followerCounts.size === 0) return [];

  // Find maximum follower count
  const maxFollowers = Math.max(...followerCounts.values());

  // Return all players with max followers (handles ties)
  return Array.from(followerCounts.entries())
    .filter(([_, count]) => count === maxFollowers)
    .map(([playerId, _]) => playerId);
}
```

**Strategic Implication:** This allows "hostile takeovers" - connecting your tile with 2 followers to an opponent's feature with 1 follower to steal points.

---

### 2. ✅ Single-Tile Costco Completion — Done (commit `8dcb6b7`)

**Current Code (board.ts line 451):**

```typescript
private isCostcoComplete(feature: Feature): boolean {
  // ... validation logic ...

  // ❌ INCORRECT: Minimum tile requirement
  return feature.tiles.size >= 2;
}
```

**Issue:** A single-tile Costco CAN be complete in Carcassonne if all its Costco edges connect to non-Costco terrain (field or road).

**Example Valid 1-Tile Costco:**

- Tile has Costco on North edge only, all other edges are fields
- Since the Costco edge connects to field (not open space or another Costco), it's COMPLETE
- Should score 2 points immediately
- Currently this is blocked by the 2-tile minimum requirement

**Another Example:**

- Tile with Costco on North and East edges (corner shape)
- If both Costco edges connect to field/road (not other Costcos), it's COMPLETE
- Should score 2 points (1 tile × 2 points)
- Currently blocked

**Fix:**

```typescript
private isCostcoComplete(feature: Feature): boolean {
  // A Costco is complete if it forms a closed area with no open edges
  for (const edge of feature.edges) {
    const [posKey, segment] = edge.split(":");
    if (DIRECTIONS.includes(segment as Direction)) {
      const position = parsePositionKey(posKey);
      const neighborPos = addDelta(position, segment as Direction);
      const neighbor = this.getTile(neighborPos);

      if (!neighbor) return false; // Open edge to empty space

      const oppositeDir = OPPOSITE[segment as Direction];
      const hasConnectingCostco = neighbor.tile.costcoZones.some(
        (zone: CostcoSegment) => zone.segments.includes(oppositeDir)
      );
      if (!hasConnectingCostco) return false; // Open edge to non-Costco
    }
  }

  return true; // ✅ Removed minimum tile requirement
}
```

---

### 3. ✅ Claim Validation — Done (`board.ts` `canClaimFeature()`)

**Current State:** No validation that a feature is already claimed before allowing placement.

**Standard Carcassonne Rule:**

- You **CANNOT** place a follower on a feature that already has a follower (yours or opponent's)
- **EXCEPTION:** If you connect two separate features (one unclaimed, one claimed), the merge is allowed

**Required Validation:**

```typescript
// In FeatureClaimManager or Board
public canClaimFeature(
  board: Board,
  type: TerrainType,
  position: Position,
  identifier: string | undefined,
  playerId: string
): { canClaim: boolean; reason?: string } {

  // Build the feature that would be created/extended by this claim
  const feature = this.traceFeatureFromPosition(board, type, position, identifier);

  // Check if any part of this feature already has a follower
  const existingClaims = board.getClaimsForFeature(feature);

  if (existingClaims.length > 0) {
    return {
      canClaim: false,
      reason: "This feature already has a follower"
    };
  }

  return { canClaim: true };
}
```

**UI Update:** Only show claimable features that pass this validation.

---

## Medium Priority Issues

### 4. ✅ Road Loop Edge Cases — Done (test added in `board.test.ts`)

**Current Road Detection:** Appears correct but verify edge cases:

- Dead-end roads (roads that connect to center)
- Roads that loop back to themselves

Test case needed:

```typescript
it("should complete a road that loops back to itself", () => {
  // Place tiles in a circle to create a road loop
  // Should complete when the loop closes
});
```

---

### 5. ✅ Tile Distribution — Done (53 tiles, balanced)

**Current Counts (from tileLibrary.ts):**

```
Total tiles in deck: ~51 tiles
- straight-road: 6
- curve-road: 6
- road-end: 5
- three-way-road: 4
- mcdonalds-abbey: 4
- costco variations: ~20
```

**Standard Carcassonne Base Game:** 72 tiles total

**Recommendation:**

- Verify tile distribution matches your intended game balance
- Consider adding more variety of tile types
- Standard Carcassonne ratios: ~40% roads, ~30% cities, ~15% monasteries, ~15% special

---

### 6. ✅ Final Scoring — Done (verified correct)

**Current Implementation (ScoreManager.ts):**

```typescript
// Score incomplete Costco: 1pt/tile + 1pt/pennant ✅ Correct
// Score other incomplete features: 1pt/tile ✅ Correct
```

**Verification needed:**

- Incomplete roads: 1 point per tile ✅
- Incomplete cities: 1 point per tile, 1 point per pennant ✅
- Incomplete monasteries: 1 point per tile (center + surrounding) ✅

This appears correct!

---

## Low Priority Enhancements

### 7. ✅ AI Strategy — Done (`StrategicAI.ts`)

**Current AI (ai.ts):**

- Only considers monastery placement for followers
- No farmer strategy
- No hostile takeover strategy

**Recommended Additions:**

```typescript
// Consider claiming valuable features
if (player.canPlaceFollower()) {
  // Priority 1: Large cities with pennants
  // Priority 2: Long roads
  // Priority 3: Monasteries
  // Priority 4: Strategic farmers (late game)

  const featureValue = this.evaluateFeatureValue(tile, position);
  if (featureValue > CLAIM_THRESHOLD) {
    validMove.follower = {
      type: this.selectBestFeatureType(tile, position),
    };
  }
}
```
