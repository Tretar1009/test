
export const HARE_POINTS = 3;
export const STAG_POOL = 18;
export const DEFAULT_TIMEOUT = 20;
export const REVEAL_DURATION = 5; // Seconds to show results before next round

export const getThreshold = (playerCount: number): number => {
  if (playerCount <= 2) return 2;
  if (playerCount === 3) return 3;
  if (playerCount === 4) return 3;
  if (playerCount === 5) return 4;
  return Math.ceil(playerCount * 0.75);
};

export const getRandomRounds = (): number => {
  return Math.floor(Math.random() * (12 - 8 + 1)) + 8;
};
