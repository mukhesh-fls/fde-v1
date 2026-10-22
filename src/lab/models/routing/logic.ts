import { rng } from "../../rng";

/** Episode 4, model 2: send simple tasks to a small model and hard ones to a large model. */

export type RoutingMode = "all-large" | "all-small" | "routed";
export type RoutingConfig = { mode: RoutingMode; threshold: number; requests: number };
export type RoutedRequest = { id: number; difficulty: number; model: "small" | "large"; correct: boolean };
export type RoutingResult = { requests: RoutedRequest[]; cost: number; avgLatency: number; accuracy: number };

export const ROUTING_DEFAULTS: RoutingConfig = { mode: "routed", threshold: 0.55, requests: 40 };

/** Illustrative figures for the lesson: relative cost per call, seconds per call. */
export const MODELS = {
  small: { cost: 1, latency: 0.6, accuracy: (d: number) => (d < 0.4 ? 0.96 : d < 0.7 ? 0.8 : 0.45) },
  large: { cost: 15, latency: 2.4, accuracy: (d: number) => (d < 0.4 ? 0.97 : d < 0.7 ? 0.95 : 0.9) },
};

export function runRouting(cfg: RoutingConfig, seed = 5): RoutingResult {
  const r = rng(seed);
  const requests: RoutedRequest[] = [];
  for (let id = 0; id < cfg.requests; id++) {
    // Most real traffic is easy: skew difficulty towards the low end.
    const difficulty = Math.pow(r(), 1.6);
    const roll = r();
    const model = cfg.mode === "all-large" ? "large" : cfg.mode === "all-small" ? "small" : difficulty >= cfg.threshold ? "large" : "small";
    requests.push({ id, difficulty, model, correct: roll < MODELS[model].accuracy(difficulty) });
  }
  const cost = requests.reduce((s, q) => s + MODELS[q.model].cost, 0);
  const avgLatency = requests.reduce((s, q) => s + MODELS[q.model].latency, 0) / requests.length;
  const accuracy = requests.filter((q) => q.correct).length / requests.length;
  return { requests, cost, avgLatency, accuracy };
}
