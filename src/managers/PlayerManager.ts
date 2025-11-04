import { PlayerDefinition, PlayerState } from "../types";

/**
 * PlayerManager handles player-related operations.
 * Responsibilities:
 * - Initialize players from configurations
 * - Manage default colors
 * - Track current player
 */
export class PlayerManager {
  private players: PlayerState[];
  private readonly defaultColors = [
    "#FF0000",
    "#0000FF",
    "#00FF00",
    "#FFFF00",
    "#FF00FF",
  ];

  constructor(playerConfigs: PlayerDefinition[]) {
    this.players = this.initializePlayers(playerConfigs);
  }

  /**
   * Initialize players from configuration
   */
  private initializePlayers(playerConfigs: PlayerDefinition[]): PlayerState[] {
    return playerConfigs.map((config, index) => ({
      id: config.id || `player_${index + 1}`,
      name: config.name,
      isAI: config.isAI || false,
      score: 0,
      followers: config.followers || 7,
      color: config.color || this.getDefaultColor(index),
    }));
  }

  /**
   * Get default color for a player index
   */
  private getDefaultColor(index: number): string {
    return this.defaultColors[index % this.defaultColors.length];
  }

  /**
   * Get all players
   */
  public getPlayers(): PlayerState[] {
    return this.players;
  }

  /**
   * Get the current player by index
   */
  public getCurrentPlayer(currentPlayerIndex: number): PlayerState {
    return this.players[currentPlayerIndex];
  }

  /**
   * Decrease follower count for a player
   */
  public decreaseFollowerCount(playerId: string): void {
    const player = this.players.find((p) => p.id === playerId);
    if (player && player.followers > 0) {
      player.followers--;
    }
  }

  /**
   * Increase follower count for a player
   */
  public increaseFollowerCount(playerId: string, count: number = 1): void {
    const player = this.players.find((p) => p.id === playerId);
    if (player) {
      player.followers += count;
    }
  }
}
