import { describe, expect, it } from "vitest";
import { FEEDBACK_DEFAULTS, simulateFeedback } from "./feedback-loops/logic";
import { overflowTurn, simulateStock, STOCK_DEFAULTS } from "./stock-flow/logic";

describe("stock and flow", () => {
  it("fills and overflows when more comes in than goes out", () => {
    const turns = simulateStock(STOCK_DEFAULTS);
    expect(overflowTurn(turns)).not.toBeNull();
    expect(turns.at(-1)!.quality).toBeLessThan(0.6);
  });

  it("stays healthy when the outflow matches the inflow", () => {
    const turns = simulateStock({ ...STOCK_DEFAULTS, removed: STOCK_DEFAULTS.added });
    expect(overflowTurn(turns)).toBeNull();
    expect(turns.every((t) => t.quality === 1)).toBe(true);
  });
});

describe("feedback loops", () => {
  it("instant retries during a slowdown create a retry storm: load far above demand", () => {
    const storm = simulateFeedback(FEEDBACK_DEFAULTS);
    expect(storm.peakLoad).toBeGreaterThan(FEEDBACK_DEFAULTS.clients * 1.8);
  });

  it("no retries means no amplification", () => {
    const none = simulateFeedback({ ...FEEDBACK_DEFAULTS, retries: 0 });
    expect(none.peakLoad).toBe(FEEDBACK_DEFAULTS.clients);
  });

  it("backoff and a retry budget act as brakes: lower peak, and most requests still get served", () => {
    const storm = simulateFeedback(FEEDBACK_DEFAULTS);
    const braked = simulateFeedback({ ...FEEDBACK_DEFAULTS, backoff: true, budget: true });
    expect(braked.peakLoad).toBeLessThan(storm.peakLoad * 0.7);
    expect(braked.servedPct).toBeGreaterThanOrEqual(storm.servedPct);
  });
});
