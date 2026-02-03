import { PlayerOptions } from "./types";
import { GAME_RULES } from "./constants/gameRules";

export class Player {
  public readonly id: string;
  public readonly name: string;
  public followers: number;
  public score: number;
  public readonly isAI: boolean;
  public readonly color: string | null;

  constructor(name: string, options: PlayerOptions = {}) {
    this.id = options.id ?? name.toLowerCase().replace(/\s+/g, "-");
    this.name = name;
    this.followers = options.followers ?? GAME_RULES.FOLLOWERS_PER_PLAYER;
    this.score = 0;
    this.isAI = options.isAI ?? false;
    this.color = options.color ?? null;
  }

  canPlaceFollower(): boolean {
    return this.followers > 0;
  }

  useFollower(): void {
    if (!this.canPlaceFollower()) {
      throw new Error(`${this.name} has no followers left to place.`);
    }
    this.followers -= 1;
  }

  returnFollower(count = 1): void {
    this.followers += count;
  }

  addScore(points: number): void {
    this.score += points;
  }
}
