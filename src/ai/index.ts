/**
 * AI module exports for American Title Trails.
 *
 * Provides AI strategies at different difficulty levels
 * using the strategy pattern.
 */

// Core types and interfaces
export type {
  AIStrategy,
  AIDifficulty,
  AIContext,
  TilePlacement,
  MeeplePlacement,
  AIDecision,
} from "./AIStrategy";

// AI Implementations
export { RandomAI } from "./RandomAI";
export type { RandomAIOptions } from "./RandomAI";

export { SimpleAI } from "./SimpleAI";
export type { SimpleAIOptions } from "./SimpleAI";

export { StrategicAI, ExpertAI } from "./StrategicAI";
export type { StrategicAIOptions } from "./StrategicAI";

// Factory
export { AIFactory } from "./AIFactory";

// Evaluators
export {
  FeatureAnalyzer,
  TilePlacementEvaluator,
  DEFAULT_WEIGHTS,
} from "./evaluators";
export type {
  FeatureValueEstimate,
  EvaluationWeights,
  PlacementScore,
} from "./evaluators";
