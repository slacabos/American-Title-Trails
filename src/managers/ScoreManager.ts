import {
  PlayerState,
  CompletedFeature,
  ScoreBreakdown,
  ScoreCategory,
  TerrainType,
  FieldCorner,
} from "../types";
import type { IBoard } from "../interfaces/IBoard";
import { GAME_RULES } from "../constants/gameRules";

/**
 * ScoreManager handles all scoring calculations for the game.
 * Responsibilities:
 * - Score completed features during gameplay
 * - Calculate final scores for incomplete features
 * - Manage feature-specific scoring rules
 */
export class ScoreManager {
  /**
   * Score completed features and award points to claiming players
   * Uses majority rule: only player(s) with most followers on feature receive points
   */
  public scoreCompletedFeatures(
    completedFeatures: CompletedFeature[],
    players: PlayerState[],
    scoreBreakdown?: ScoreBreakdown
  ): void {
    completedFeatures.forEach((feature) => {
      if (feature.claimedBy && feature.claimedBy.length > 0) {
        const followerCounts = this.countFollowersPerPlayer(feature.claimedBy);
        const majorityHolders = this.findMajorityHolders(followerCounts);
        const category = this.getCompletedFeatureCategory(feature.type);

        majorityHolders.forEach((playerId) => {
          this.awardPoints(
            players,
            playerId,
            feature.points,
            category,
            scoreBreakdown
          );
        });
      }
    });
  }

  /**
   * Count the number of followers each player has on a feature
   */
  private countFollowersPerPlayer(claimedBy: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    claimedBy.forEach((playerId) => {
      counts.set(playerId, (counts.get(playerId) || 0) + 1);
    });
    return counts;
  }

  /**
   * Find player(s) with the most followers on a feature
   */
  private findMajorityHolders(followerCounts: Map<string, number>): string[] {
    if (followerCounts.size === 0) return [];
    const maxCount = Math.max(...followerCounts.values());
    const majorityHolders: string[] = [];
    followerCounts.forEach((count, playerId) => {
      if (count === maxCount) majorityHolders.push(playerId);
    });
    return majorityHolders;
  }

  /**
   * Calculate final scores for all incomplete features at game end
   */
  public calculateFinalScores(
    players: PlayerState[],
    board: IBoard,
    scoreBreakdown?: ScoreBreakdown
  ): void {
    // Score incomplete Costco features
    this.scoreIncompleteCostcoFeatures(players, board, scoreBreakdown);

    // Score incomplete McDonald's features (1 point per tile in 3x3 area)
    this.scoreIncompleteMcDonaldsFeatures(players, board, scoreBreakdown);

    // Count each connected road once, including bridges and source roads.
    const roads = new Set<string>();
    for (const claim of board.getFeatureClaims().filter(claim => claim.type === "road")) {
      const [key, edge] = claim.edge.split(":");
      const position = this.parsePositionKey(key);
      const tile = board.getTile(position)?.tile;
      const connection = tile?.roadConnections.find(connection => connection.includes(edge));
      if (!connection) continue;
      const feature = board.traceRoadFeature(position, connection, new Set());
      const id = [...feature.edges].sort().join("|");
      if (roads.has(id)) continue;
      roads.add(id);
      const claimants = board.getFeatureClaimants(feature);
      for (const playerId of this.findMajorityHolders(this.countFollowersPerPlayer(claimants)))
        this.awardPoints(players, playerId, feature.tiles.size * GAME_RULES.ROAD_POINTS_PER_TILE, "incomplete_road", scoreBreakdown);
    }

    // Score farmer features (fields with farmers get points for adjacent completed Costcos)
    this.scoreFarmerFeatures(players, board, scoreBreakdown);
  }

  /**
   * Score incomplete McDonald's features at game end.
   * Scoring: 1 point per tile in the 3x3 area (including the McDonald's tile).
   */
  private scoreIncompleteMcDonaldsFeatures(
    players: PlayerState[],
    board: IBoard,
    scoreBreakdown?: ScoreBreakdown
  ): void {
    const claims = board
      .getFeatureClaims()
      .filter((claim) => claim.type === "mcdonalds");

    claims.forEach((claim) => {
      const edgeKey = claim.edge.split(":")[0];
      const position = this.parsePositionKey(edgeKey);
      const points = this.countMcDonaldsPoints(board, position);

      claim.players.forEach((playerId) => {
        this.awardPoints(
          players,
          playerId,
          points,
          "incomplete_mcdonalds",
          scoreBreakdown
        );
      });
    });
  }

  /**
   * Score incomplete Costco features at game end
   * Scoring: 1 point per tile + 1 point per pennant
   */
  private scoreIncompleteCostcoFeatures(
    players: PlayerState[],
    board: IBoard,
    scoreBreakdown?: ScoreBreakdown
  ): void {
    const allIncompleteFeatures = this.findAllIncompleteCostcoFeatures(board);

    allIncompleteFeatures.forEach((feature) => {
      // Create proper feature object for claimant lookup
      const featureForClaimants = {
        type: "costco" as const,
        tiles: feature.tiles,
        edges: feature.edges,
        isComplete: false,
        pennants: feature.pennants,
      };

      const claimants = board.getFeatureClaimants(featureForClaimants);
      if (claimants.length > 0) {
        // Incomplete Costco scoring: 1 point per tile + 1 point per pennant
        const tilePoints = feature.tiles.size;
        const pennantPoints = feature.pennants;
        const totalPoints = tilePoints + pennantPoints;

        const followerCounts = this.countFollowersPerPlayer(claimants);
        const majorityHolders = this.findMajorityHolders(followerCounts);

        majorityHolders.forEach((playerId) => {
          this.awardPoints(
            players,
            playerId,
            totalPoints,
            "incomplete_costco",
            scoreBreakdown
          );
        });
      }
    });
  }

  /**
   * Find all incomplete Costco features across the board
   */
  private findAllIncompleteCostcoFeatures(board: IBoard): Array<{
    tiles: Set<string>;
    pennants: number;
    edges: Set<string>;
  }> {
    const allFeatures: Array<{
      tiles: Set<string>;
      pennants: number;
      edges: Set<string>;
    }> = [];
    const processed = new Set<string>();
    board.getAllTiles().forEach(({ tile, position }) => {
      for (const zone of tile.costcoZones) {
        const feature = board.traceCostcoFeature(position, zone, new Set());
        const id = [...feature.edges].sort().join("|");
        if (processed.has(id)) continue;
        processed.add(id);
        if (!board.isCostcoComplete(feature)) allFeatures.push({
          tiles: feature.tiles, edges: feature.edges, pennants: feature.pennants || 0,
        });
      }
    });

    return allFeatures;
  }

  /**
   * Parse position key string to Position object
   */
  private parsePositionKey(key: string): { x: number; y: number } {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  }

  private countMcDonaldsPoints(
    board: IBoard,
    position: { x: number; y: number }
  ): number {
    const positions = [
      position,
      { x: position.x - 1, y: position.y - 1 },
      { x: position.x, y: position.y - 1 },
      { x: position.x + 1, y: position.y - 1 },
      { x: position.x - 1, y: position.y },
      { x: position.x + 1, y: position.y },
      { x: position.x - 1, y: position.y + 1 },
      { x: position.x, y: position.y + 1 },
      { x: position.x + 1, y: position.y + 1 },
    ];

    let count = 0;
    positions.forEach((pos) => {
      if (board.getTile(pos)) {
        count += GAME_RULES.MCDONALDS_POINTS_PER_TILE;
      }
    });

    return count;
  }

  /**
   * Score farmer features at game end
   * Farmers score 3 points per adjacent completed Costco
   */
  private scoreFarmerFeatures(
    players: PlayerState[],
    board: IBoard,
    scoreBreakdown?: ScoreBreakdown
  ): void {
    const processedFields = new Set<string>();

    // Find all field claims (farmers)
    const claims = board.getFeatureClaims();
    const farmerClaims = claims.filter(
      (claim) => claim.type === "field" && claim.followerType === "farmer"
    );

    farmerClaims.forEach((claim) => {
      // Parse the claim edge to get position and corner
      const [posKey, corner] = claim.edge.split(":");
      const position = this.parsePositionKey(posKey);

      // Get the tile at this position
      const tileRecord = board.getTile(position);
      if (!tileRecord) return;

      // Find the field segment that contains this corner
      const fieldSegment = tileRecord.tile.fieldSegments.find((fs) =>
        fs.corners.includes(corner as FieldCorner)
      );
      if (!fieldSegment) return;

      // Trace the full field feature
      const fieldFeature = board.traceFieldFeature(
        position,
        fieldSegment,
        new Set()
      );

      // Create a unique key for this field feature
      const fieldKey = Array.from(fieldFeature.edges).sort().join("|");
      if (processedFields.has(fieldKey)) return;
      processedFields.add(fieldKey);

      // Find all adjacent completed Costcos
      const adjacentCostcos = board.findAdjacentCostcos(fieldFeature);

      // Calculate points: 3 per completed adjacent Costco
      const points = adjacentCostcos.size * GAME_RULES.FARMER_POINTS_PER_COSTCO;

      if (points > 0) {
        // Get all claimants (farmers) on this field
        const claimants = board.getFeatureClaimants(fieldFeature);

        if (claimants.length > 0) {
          // Apply majority rule
          const followerCounts = this.countFollowersPerPlayer(claimants);
          const majorityHolders = this.findMajorityHolders(followerCounts);

          majorityHolders.forEach((playerId) => {
            this.awardPoints(
              players,
              playerId,
              points,
              "farmers",
              scoreBreakdown
            );
          });
        }
      }
    });
  }

  private awardPoints(
    players: PlayerState[],
    playerId: string,
    points: number,
    category?: ScoreCategory,
    scoreBreakdown?: ScoreBreakdown
  ): void {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    player.score += points;

    if (scoreBreakdown && category) {
      const breakdown = scoreBreakdown[playerId];
      if (breakdown) {
        breakdown[category] = (breakdown[category] || 0) + points;
      }
    }
  }

  private getCompletedFeatureCategory(
    type: TerrainType
  ): ScoreCategory | undefined {
    switch (type) {
      case "road":
        return "completed_road";
      case "costco":
        return "completed_costco";
      case "mcdonalds":
        return "completed_mcdonalds";
      default:
        return undefined;
    }
  }

}
