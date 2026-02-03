import { Tile } from "../tile";
import { Position, TerrainType, ClaimableFeature, Direction } from "../types";
import { Board } from "../board";

/**
 * FeatureClaimManager handles feature claiming logic.
 * Responsibilities:
 * - Identify claimable features on tiles
 * - Generate display labels for features
 * - Handle feature claiming and skipping
 */
export class FeatureClaimManager {
  /**
   * Get all claimable features on a tile with descriptive labels
   */
  public getClaimableFeatures(tile: Tile): ClaimableFeature[] {
    const claimable: ClaimableFeature[] = [];

    // Check road connections with descriptive labels
    tile.roadConnections.forEach((connection, index) => {
      const label = this.generateRoadLabel(tile, connection);
      claimable.push({
        type: "road",
        identifier: `road_${index}`,
        displayName: label,
      });
    });

    // Check Costco zones with descriptive labels
    tile.costcoZones.forEach((zone, index) => {
      const label = this.generateCostcoLabel(zone.segments);
      claimable.push({
        type: "costco",
        identifier: `costco_${index}`,
        displayName: label,
      });
    });

    // Check McDonalds
    if (tile.center === "mcdonalds") {
      claimable.push({ type: "mcdonalds" });
    }

    return claimable;
  }

  /**
   * Generate a descriptive label for a road connection
   */
  private generateRoadLabel(tile: Tile, connection: string[]): string {
    // Create a readable description of the road connection
    const directions = connection
      .filter((dir) => dir !== "center")
      .map((dir) => this.capitalizeFirstLetter(dir))
      .join("-");

    // If no directions (only center), use the directions that have roads on edges
    if (!directions) {
      const roadEdges = ["north", "east", "south", "west"]
        .filter((dir) => tile.getEdge(dir as Direction) === "road")
        .map((dir) => this.capitalizeFirstLetter(dir))
        .join("-");
      return roadEdges || "Center";
    }

    return directions;
  }

  /**
   * Generate a descriptive label for a Costco zone
   */
  private generateCostcoLabel(segments: (string | "center")[]): string {
    const directions = segments
      .filter((segment) => segment !== "center")
      .map((segment) => this.capitalizeFirstLetter(segment))
      .join("-");

    return directions || "Center";
  }

  /**
   * Capitalize the first letter of a string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Claim a feature on the board at the specified position
   */
  public claimFeature(
    board: Board,
    type: TerrainType,
    position: Position,
    identifier: string | undefined,
    playerId: string
  ): void {
    board.claimFeature(type, position, identifier, playerId);
  }
}
