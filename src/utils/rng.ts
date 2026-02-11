export type RNG = () => number;

export const createSeededRng = (seed: number): RNG => {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

export const getRng = (options?: { rng?: RNG; seed?: number }): RNG => {
  if (options?.rng) return options.rng;
  if (options?.seed !== undefined) return createSeededRng(options.seed);
  return Math.random;
};
