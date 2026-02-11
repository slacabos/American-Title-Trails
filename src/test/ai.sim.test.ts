import { describe, it, expect } from "vitest";
import { Game } from "../game";
import type { AIDifficulty, PlayerDefinition } from "../types";

const DIFFICULTIES: AIDifficulty[] = ["easy", "medium", "hard", "expert"];
const RANK: Record<AIDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  expert: 3,
};

const GAMES_PER_PAIR = 100;
const MAX_TURNS = 10000;
const BASE_SEED = 1337;
const MIN_HIGH_WIN_RATE = 0.53;
const MAX_LOW_WIN_RATE = 0.47;

const playGame = (
  difficultyA: AIDifficulty,
  difficultyB: AIDifficulty,
  seed: number
): { scoreA: number; scoreB: number } => {
  const playerConfigs: PlayerDefinition[] = [
    {
      id: "ai1",
      name: "AI 1",
      isAI: true,
      aiDifficulty: difficultyA,
      color: "#FF0000",
    },
    {
      id: "ai2",
      name: "AI 2",
      isAI: true,
      aiDifficulty: difficultyB,
      color: "#0000FF",
    },
  ];

  const game = new Game(playerConfigs, { seed });

  let turnCount = 0;
  while (!game.getState().isGameOver && turnCount < MAX_TURNS) {
    game.processAITurn();
    turnCount++;
  }

  if (!game.getState().isGameOver) {
    throw new Error(
      `Game did not finish in ${MAX_TURNS} turns (${difficultyA} vs ${difficultyB})`
    );
  }

  const state = game.getState();
  return { scoreA: state.players[0].score, scoreB: state.players[1].score };
};

describe("AI difficulty balance (simulation)", () => {
  it(
    "should favor higher difficulties across all pairings",
    { timeout: 60000 },
    () => {
      const pairings: Array<[AIDifficulty, AIDifficulty]> = [];
      for (let i = 0; i < DIFFICULTIES.length; i += 1) {
        for (let j = i + 1; j < DIFFICULTIES.length; j += 1) {
          pairings.push([DIFFICULTIES[i], DIFFICULTIES[j]]);
        }
      }

      const summaryLines: string[] = [];

      pairings.forEach(([low, high], pairIndex) => {
        if (RANK[low] >= RANK[high]) {
          throw new Error(`Invalid pairing order: ${low} vs ${high}`);
        }

        let highWins = 0;
        let lowWins = 0;
        let ties = 0;

        for (let gameIndex = 0; gameIndex < GAMES_PER_PAIR; gameIndex += 1) {
          const seed = BASE_SEED + pairIndex * 1000 + gameIndex;
          const highFirst = gameIndex % 2 === 0;
          const [diffA, diffB] = highFirst ? [high, low] : [low, high];

          const { scoreA, scoreB } = playGame(diffA, diffB, seed);

          if (scoreA === scoreB) {
            ties += 1;
            continue;
          }

          const winner = scoreA > scoreB ? diffA : diffB;
          if (winner === high) {
            highWins += 1;
          } else {
            lowWins += 1;
          }
        }

        const highWinRate = (highWins + ties * 0.5) / GAMES_PER_PAIR;
        const lowWinRate = (lowWins + ties * 0.5) / GAMES_PER_PAIR;

        const summary = `${high} vs ${low}: highWinRate=${highWinRate.toFixed(
          3
        )} lowWinRate=${lowWinRate.toFixed(3)} ties=${ties}`;
        summaryLines.push(summary);

        expect(
          highWinRate,
          `${high} vs ${low} highWinRate=${highWinRate.toFixed(
            3
          )} ties=${ties}`
        ).toBeGreaterThanOrEqual(MIN_HIGH_WIN_RATE);
        expect(
          lowWinRate,
          `${high} vs ${low} lowWinRate=${lowWinRate.toFixed(3)} ties=${ties}`
        ).toBeLessThanOrEqual(MAX_LOW_WIN_RATE);
      });

      summaryLines.forEach((line) => {
        console.log(`[AI SIM] ${line}`);
      });
    }
  );
});
