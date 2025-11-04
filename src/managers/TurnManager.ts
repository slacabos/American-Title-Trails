import { GamePhase, Position } from "../types";
import { Tile } from "../tile";

/**
 * TurnManager handles turn progression and game phase management.
 * Responsibilities:
 * - Manage game phases (PLACE_TILE, CLAIM_FEATURE, END_TURN, GAME_OVER)
 * - Handle turn transitions between players
 * - Track turn numbers
 * - Manage last placed tile position
 */
export class TurnManager {
  private phase: GamePhase;
  private currentPlayerIndex: number;
  private turnNumber: number;
  private lastPlacedPosition?: Position;

  constructor(startingPlayerIndex: number = 0) {
    this.phase = GamePhase.PLACE_TILE;
    this.currentPlayerIndex = startingPlayerIndex;
    this.turnNumber = 1;
  }

  /**
   * Get the current game phase
   */
  public getPhase(): GamePhase {
    return this.phase;
  }

  /**
   * Set the game phase
   */
  public setPhase(phase: GamePhase): void {
    this.phase = phase;
  }

  /**
   * Get the current player index
   */
  public getCurrentPlayerIndex(): number {
    return this.currentPlayerIndex;
  }

  /**
   * Get the current turn number
   */
  public getTurnNumber(): number {
    return this.turnNumber;
  }

  /**
   * Get the position of the last placed tile
   */
  public getLastPlacedPosition(): Position | undefined {
    return this.lastPlacedPosition;
  }

  /**
   * Set the position of the last placed tile
   */
  public setLastPlacedPosition(position: Position): void {
    this.lastPlacedPosition = position;
  }

  /**
   * Clear the last placed position (usually at start of new turn)
   */
  public clearLastPlacedPosition(): void {
    this.lastPlacedPosition = undefined;
  }

  /**
   * Transition to claim feature phase
   */
  public enterClaimPhase(): void {
    this.phase = GamePhase.CLAIM_FEATURE;
  }

  /**
   * Advance to the next player's turn
   * Returns the new current player index
   */
  public advanceToNextPlayer(totalPlayers: number): number {
    // Clear the last placed position for the new turn
    this.clearLastPlacedPosition();

    // Move to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % totalPlayers;

    // If we're back to the first player, increment turn number
    if (this.currentPlayerIndex === 0) {
      this.turnNumber++;
    }

    return this.currentPlayerIndex;
  }

  /**
   * Complete the current turn and prepare for the next turn
   * Returns true if there's a next tile, false if game should end
   */
  public completeTurn(
    nextTile: Tile | undefined,
    totalPlayers: number
  ): boolean {
    this.phase = GamePhase.END_TURN;
    this.advanceToNextPlayer(totalPlayers);

    if (nextTile) {
      this.phase = GamePhase.PLACE_TILE;
      return true;
    } else {
      this.phase = GamePhase.GAME_OVER;
      return false;
    }
  }

  /**
   * End the game and transition to game over phase
   */
  public endGame(): void {
    this.phase = GamePhase.GAME_OVER;
  }

  /**
   * Check if the game is in a specific phase
   */
  public isInPhase(phase: GamePhase): boolean {
    return this.phase === phase;
  }

  /**
   * Check if the game is over
   */
  public isGameOver(): boolean {
    return this.phase === GamePhase.GAME_OVER;
  }
}
