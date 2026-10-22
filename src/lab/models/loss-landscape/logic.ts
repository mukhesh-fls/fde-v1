/**
 * Episode 3, model 4: gradient descent on a two-weight error surface.
 * The surface has a deep basin (the best weights), a shallower basin (a local minimum) and a ridge between.
 */

export type W = [number, number];

export const DOMAIN = 3; // weights range over -3..3

/** Error for a pair of weights. Higher is worse. */
export function loss([a, b]: W): number {
  return (
    0.07 * (a * a + b * b) +
    1.6 -
    1.45 * Math.exp(-((a - 1.2) ** 2 + (b + 0.8) ** 2) / 1.1) -
    0.85 * Math.exp(-((a + 1.5) ** 2 + (b - 1.3) ** 2) / 0.55) +
    0.45 * Math.exp(-((a + 0.1) ** 2 + (b - 0.25) ** 2) / 0.5)
  );
}

/** The slope of the surface at a point, by central differences. Points uphill. */
export function gradient(w: W, h = 1e-4): W {
  return [(loss([w[0] + h, w[1]]) - loss([w[0] - h, w[1]])) / (2 * h), (loss([w[0], w[1] + h]) - loss([w[0], w[1] - h])) / (2 * h)];
}

const clampW = (v: number) => Math.max(-DOMAIN, Math.min(DOMAIN, v));

/** One step of gradient descent: move against the slope, scaled by the learning rate. */
export function step(w: W, lr: number): W {
  const g = gradient(w);
  return [clampW(w[0] - lr * g[0]), clampW(w[1] - lr * g[1])];
}

export function descend(start: W, lr: number, steps: number): W[] {
  const path: W[] = [start];
  for (let i = 0; i < steps; i++) path.push(step(path[path.length - 1], lr));
  return path;
}

export const START: W = [-0.6, -2.4];
export const LOCAL_START: W = [-2.4, 2.2];
/** The best weights, found once by a long careful descent. */
export const GLOBAL_MIN: W = descend([1, -1], 0.2, 400).at(-1)!;
export const LOCAL_MIN: W = descend([-1.5, 1.3], 0.2, 400).at(-1)!;
