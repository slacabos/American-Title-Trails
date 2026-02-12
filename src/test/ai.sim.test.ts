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

const DEFAULT_GAMES_PER_PAIR = 100;
const gamesPerPairOverride = Number.parseInt(
  process.env.AI_SIM_GAMES_PER_PAIR ?? "",
  10
);
const GAMES_PER_PAIR =
  Number.isFinite(gamesPerPairOverride) && gamesPerPairOverride > 0
    ? gamesPerPairOverride
    : DEFAULT_GAMES_PER_PAIR;
const MAX_TURNS = 10000;
const BASE_SEED = 1337;
const minHighWinOverride = Number.parseFloat(
  process.env.AI_SIM_MIN_HIGH_WIN_RATE ?? ""
);
const maxLowWinOverride = Number.parseFloat(
  process.env.AI_SIM_MAX_LOW_WIN_RATE ?? ""
);
const MIN_HIGH_WIN_RATE =
  Number.isFinite(minHighWinOverride) && minHighWinOverride >= 0
    ? minHighWinOverride
    : 0.6;
const MAX_LOW_WIN_RATE =
  Number.isFinite(maxLowWinOverride) && maxLowWinOverride >= 0
    ? maxLowWinOverride
    : 0.4;
const TEST_TIMEOUT_MS = Math.max(60000, GAMES_PER_PAIR * 700);

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
    { timeout: TEST_TIMEOUT_MS },
    () => {
      const pairings: Array<[AIDifficulty, AIDifficulty]> = [];
      for (let i = 0; i < DIFFICULTIES.length; i += 1) {
        for (let j = i + 1; j < DIFFICULTIES.length; j += 1) {
          pairings.push([DIFFICULTIES[i], DIFFICULTIES[j]]);
        }
      }

      const summaryLines: string[] = [];
      const tableRows: string[] = [
        "pairing | highWinRate | lowWinRate | ties | result",
        "--- | ---: | ---: | ---: | ---",
      ];

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
        const passed =
          highWinRate >= MIN_HIGH_WIN_RATE && lowWinRate <= MAX_LOW_WIN_RATE;

        const summary = `${high} vs ${low}: highWinRate=${highWinRate.toFixed(
          3
        )} lowWinRate=${lowWinRate.toFixed(3)} ties=${ties}`;
        summaryLines.push(summary);
        tableRows.push(
          `${high} vs ${low} | ${highWinRate.toFixed(3)} | ${lowWinRate.toFixed(
            3
          )} | ${ties} | ${passed ? "PASS" : "FAIL"}`
        );

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
      console.log(
        `[AI SIM] gamesPerPair=${GAMES_PER_PAIR}, thresholds high>=${MIN_HIGH_WIN_RATE.toFixed(
          2
        )}, low<=${MAX_LOW_WIN_RATE.toFixed(2)}`
      );
      tableRows.forEach((line) => {
        console.log(`[AI SIM TABLE] ${line}`);
      });
    }
  );
});
