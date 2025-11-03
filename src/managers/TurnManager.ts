import { Tile } from "../tile";
import { PlayerState, GameState } from "../types";
import { GamePhase } from "../game";

/**
 * TurnManager handles turn progression and phase transitions.
 * Responsibilities:
 * - Manage current player rotation
 * - Handle phase transitions (PLACE_TILE -> CLAIM_FEATURE -> END_TURN)
 * - Draw tiles from deck
 * - Track turn numbers
 */
export class TurnManager {
  /**
   * Draws the next tile from the deck and assigns it to current tile
   * @param tileDeck - Array of remaining tiles
   * @returns The drawn tile, or undefined if deck is empty
   */
  public drawNextTile(tileDeck: Tile[]): Tile | undefined {
    if (tileDeck.length === 0) {
      return undefined;
    }
    return tileDeck.pop();
  }

  /**
   * Advances to the next player's turn
   * @param currentPlayerIndex - Current player index
   * @param totalPlayers - Total number of players
   * @returns New player index
   */
  public advanceToNextPlayer(
    currentPlayerIndex: number,
    totalPlayers: number
  ): number {
    return (currentPlayerIndex + 1) % totalPlayers;
  }

  /**
   * Checks if a new round has started (back to player 0)
   * @param currentPlayerIndex - Current player index
   * @returns True if starting a new round
   */
  public isNewRound(currentPlayerIndex: number): boolean {
    return currentPlayerIndex === 0;
  }

  /**
   * Ends the current turn and prepares for next player
   * @param state - Current game state (will be mutated)
   * @returns New phase (PLACE_TILE or GAME_OVER)
   */
  public endTurn(state: GameState): GamePhase {
    // Move to next player
    state.currentPlayerIndex = this.advanceToNextPlayer(
      state.currentPlayerIndex,
      state.players.length
    );

    // If we're back to the first player, increment turn number
    if (this.isNewRound(state.currentPlayerIndex)) {
      state.turnNumber++;
    }

    // Draw next tile for new player
    const nextTile = this.drawNextTile(state.tileDeck);
    state.currentTile = nextTile;

    if (nextTile) {
      return GamePhase.PLACE_TILE;
    } else {
      // No more tiles - game over
      state.isGameOver = true;
      return GamePhase.GAME_OVER;
    }
  }

  /**
   * Determines the next phase after tile placement
   * @param currentPlayer - Current player state
   * @param hasClaimableFeatures - Whether there are features available to claim
   * @returns Next game phase
   */
  public getPhaseAfterPlacement(
    currentPlayer: PlayerState,
    hasClaimableFeatures: boolean
  ): GamePhase {
    if (hasClaimableFeatures && currentPlayer.followers > 0) {
      return GamePhase.CLAIM_FEATURE;
    } else {
      return GamePhase.END_TURN;
    }
  }

  /**
   * Checks if the game should end
   * @param tileDeck - Remaining tiles
   * @returns True if no more tiles remain
   */
  public shouldGameEnd(tileDeck: Tile[]): boolean {
    return tileDeck.length === 0;
  }

  /**
   * Gets statistics about tile usage
   * @param tileDeck - Remaining tiles in deck
   * @param discardPile - Placed tiles
   * @param currentTile - Tile currently being placed (if any)
   * @returns Object with tile counts
   */
  public getTileStats(
    tileDeck: Tile[],
    discardPile: Tile[],
    currentTile?: Tile
  ): { remaining: number; placed: number; total: number } {
    const total = tileDeck.length + discardPile.length + (currentTile ? 1 : 0);
    const remaining = tileDeck.length;
    const placed = discardPile.length;

    return { remaining, placed, total };
  }

  /**
   * Validates if a phase transition is allowed
   * @param currentPhase - Current game phase
   * @param targetPhase - Desired target phase
   * @returns True if transition is valid
   */
  public isValidPhaseTransition(
    currentPhase: GamePhase,
    targetPhase: GamePhase
  ): boolean {
    const validTransitions: Record<GamePhase, GamePhase[]> = {
      [GamePhase.PLACE_TILE]: [GamePhase.CLAIM_FEATURE, GamePhase.END_TURN],
      [GamePhase.CLAIM_FEATURE]: [GamePhase.END_TURN],
      [GamePhase.SCORE_FEATURES]: [GamePhase.END_TURN],
      [GamePhase.END_TURN]: [GamePhase.PLACE_TILE, GamePhase.GAME_OVER],
      [GamePhase.GAME_OVER]: [],
    };

    return validTransitions[currentPhase]?.includes(targetPhase) || false;
  }
}
