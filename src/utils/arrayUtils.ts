/**
 * Shuffle an array using the Fisher-Yates algorithm
 * Returns a new array, does not modify the original
 */
export const shuffle = <T>(array: T[], rng: () => number = Math.random): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
