/**
 * AI Factory - Creates AI strategies by difficulty level.
 *
 * Provides a simple factory method to instantiate the appropriate
 * AI strategy based on the requested difficulty.
 */

import type { AIStrategy, AIDifficulty } from "./AIStrategy";
import { RandomAI } from "./RandomAI";
import { SimpleAI } from "./SimpleAI";
import { StrategicAI, ExpertAI } from "./StrategicAI";
import type { RNG } from "../utils/rng";

/**
 * Factory for creating AI strategies by difficulty level.
 */
export class AIFactory {
  /**
   * Create an AI strategy for the specified difficulty level.
   *
   * @param difficulty - The desired AI difficulty level
   * @returns An AI strategy instance
   */
  static create(difficulty: AIDifficulty, rng?: RNG): AIStrategy {
    switch (difficulty) {
      case "easy":
        return new RandomAI({ rng });

      case "medium":
        return new SimpleAI({ rng });

      case "hard":
        return new StrategicAI({ rng });

      case "expert":
        return new ExpertAI({ rng });

      default:
        // Default to medium difficulty
        return new SimpleAI({ rng });
    }
  }

  /**
   * Get all available difficulty levels.
   */
  static getDifficultyLevels(): AIDifficulty[] {
    return ["easy", "medium", "hard", "expert"];
  }

  /**
   * Get a human-readable name for a difficulty level.
   */
  static getDifficultyName(difficulty: AIDifficulty): string {
    const names: Record<AIDifficulty, string> = {
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      expert: "Expert",
    };
    return names[difficulty] || "Medium";
  }

  /**
   * Get a description for a difficulty level.
   */
  static getDifficultyDescription(difficulty: AIDifficulty): string {
    const descriptions: Record<AIDifficulty, string> = {
      easy: "Random moves with occasional claims",
      medium: "Weighted heuristics for balanced play",
      hard: "Strategic play with look-ahead",
      expert: "Advanced strategy with defensive play",
    };
    return descriptions[difficulty] || "";
  }
}
