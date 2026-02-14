import type { ITile, IBoard } from "../interfaces";
import { Position, CompletedFeature } from "../types";

/**
 * TileManager handles all tile-related operations.
 * Responsibilities:
 * - Manage tile deck, discard pile, and current tile
 * - Handle tile drawing and rotation
 * - Provide tile placement helpers
 */
export class TileManager {
  private tileDeck: ITile[];
  private discardPile: ITile[];
  private currentTile?: ITile;

  constructor(initialDeck: ITile[]) {
    this.tileDeck = initialDeck;
    this.discardPile = [];
    this.currentTile = undefined;
  }

  /**
   * Draw the next tile from the deck
   * Returns true if a tile was drawn, false if deck is empty
   */
  public drawNextTile(): boolean {
    if (this.tileDeck.length === 0) {
      this.currentTile = undefined;
      return false;
    }

    this.currentTile = this.tileDeck.pop();
    return true;
  }

  /**
   * Get the current tile
   */
  public getCurrentTile(): ITile | undefined {
    return this.currentTile;
  }

  /**
   * Get the tile deck
   */
  public getTileDeck(): ITile[] {
    return this.tileDeck;
  }

  /**
   * Get the discard pile
   */
  public getDiscardPile(): ITile[] {
    return this.discardPile;
  }

  /**
   * Discard the current tile and clear it
   */
  public discardCurrentTile(): void {
    if (this.currentTile) {
      this.discardPile.push(this.currentTile);
      this.currentTile = undefined;
    }
  }

  /**
   * Check if a tile can be rotated (i.e., there is a current tile)
   */
  public canRotateTile(): boolean {
    return !!this.currentTile;
  }

  /**
   * Rotate the current tile by a number of 90-degree increments
   * Positive = clockwise, negative = counter-clockwise
   */
  public rotateTile(times: number = 1): void {
    if (this.currentTile) {
      this.currentTile = this.currentTile.rotate(times);
    }
  }

  /**
   * Rotate the current tile clockwise (90 degrees)
   */
  public rotateTileClockwise(): void {
    this.rotateTile(1);
  }

  /**
   * Rotate the current tile counter-clockwise (270 degrees)
   */
  public rotateTileCounterClockwise(): void {
    this.rotateTile(-1);
  }

  /**
   * Get valid placement positions for the current tile
   */
  public getValidPlacements(board: IBoard): Position[] {
    if (!this.currentTile) {
      return [];
    }

    return board
      .getPlacementCandidates()
      .filter(
        (position: Position) =>
          this.currentTile && board.canPlace(this.currentTile, position)
      );
  }

  /**
   * Preview what would happen if the current tile were placed at a position
   */
  public previewTilePlacement(board: IBoard, position: Position): { completed: CompletedFeature[] } | null {
    if (!this.currentTile) {
      return null;
    }

    return board.previewPlacement(this.currentTile, position);
  }

  /**
   * Get statistics about tiles (remaining, placed, total)
   */
  public getTileStats(): { remaining: number; placed: number; total: number } {
    const total =
      this.tileDeck.length +
      this.discardPile.length +
      (this.currentTile ? 1 : 0);
    const remaining = this.tileDeck.length;
    const placed = this.discardPile.length;

    return { remaining, placed, total };
  }

  /**
   * Apply rotation to the current tile and return the rotated version
   */
  public getRotatedCurrentTile(rotation: number): ITile | undefined {
    if (!this.currentTile) {
      return undefined;
    }

    let rotatedTile = this.currentTile.clone();
    for (let i = 0; i < rotation; i++) {
      rotatedTile = rotatedTile.rotate(1);
    }
    return rotatedTile;
  }
}
