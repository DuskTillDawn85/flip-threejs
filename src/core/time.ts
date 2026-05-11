export const BASE_FPS = 144;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const dtFactorFromNowMs = (nowMs: number, lastMs: number) => {
  const dtSec = clamp((nowMs - lastMs) / 1000, 0, 0.05);
  return dtSec * BASE_FPS;
};

