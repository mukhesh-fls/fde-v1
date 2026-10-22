import { describe, expect, it } from "vitest";
import { descend, GLOBAL_MIN, gradient, LOCAL_MIN, LOCAL_START, loss, START } from "./logic";

describe("loss landscape", () => {
  it("has a deeper global minimum and a shallower local one", () => {
    expect(loss(GLOBAL_MIN)).toBeLessThan(loss(LOCAL_MIN) - 0.3);
  });

  it("the gradient points uphill", () => {
    const w = START;
    const g = gradient(w);
    const uphill = loss([w[0] + 0.01 * g[0], w[1] + 0.01 * g[1]]);
    expect(uphill).toBeGreaterThan(loss(w));
  });

  it("a small learning rate walks steadily down to the best weights", () => {
    const path = descend(START, 0.25, 80);
    const losses = path.map(loss);
    for (let i = 1; i < losses.length; i++) expect(losses[i]).toBeLessThanOrEqual(losses[i - 1] + 1e-9);
    expect(Math.hypot(path.at(-1)![0] - GLOBAL_MIN[0], path.at(-1)![1] - GLOBAL_MIN[1])).toBeLessThan(0.15);
  });

  it("a learning rate that is too large overshoots: the error goes up at some step", () => {
    const losses = descend(START, 2.6, 30).map(loss);
    expect(losses.some((l, i) => i > 0 && l > losses[i - 1] + 0.01)).toBe(true);
  });

  it("starting in the other basin gets stuck in the local minimum", () => {
    const end = descend(LOCAL_START, 0.25, 120).at(-1)!;
    expect(Math.hypot(end[0] - LOCAL_MIN[0], end[1] - LOCAL_MIN[1])).toBeLessThan(0.2);
    expect(loss(end)).toBeGreaterThan(loss(GLOBAL_MIN) + 0.3);
  });
});
