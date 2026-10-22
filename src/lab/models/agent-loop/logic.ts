import { rng } from "../../rng";

/** Episode 1, model 2: the agent loop (assess, decide, act, check) and the limit every loop needs. */

export type Phase = "assess" | "decide" | "act" | "check";
export const PHASES: Phase[] = ["assess", "decide", "act", "check"];

export type LoopConfig = {
  stepsNeeded: number;
  failureRate: number; // 0..1, chance a tool call fails
  stepLimit: number | null; // null = no limit
  budgetTokens: number;
};

export type LoopEvent = { step: number; phase: Phase; ok: boolean; progress: number; tokens: number };
export type LoopOutcome = "done" | "limit" | "ran-away";
export type LoopResult = { events: LoopEvent[]; outcome: LoopOutcome; steps: number; tokens: number };

export const DEFAULT_BUDGET = 120_000;

/**
 * Each pass round the loop is one step. A failed tool call makes no progress, and one in three failures
 * also sends the agent down a wrong path, undoing a step (errors carry forward). Each step costs more
 * than the last because the context grows with every result.
 */
export function runLoop(cfg: LoopConfig, seed = 7): LoopResult {
  const r = rng(seed);
  const events: LoopEvent[] = [];
  let progress = 0;
  let tokens = 0;
  let step = 0;
  for (;;) {
    if (progress >= cfg.stepsNeeded) return { events, outcome: "done", steps: step, tokens };
    if (cfg.stepLimit !== null && step >= cfg.stepLimit) return { events, outcome: "limit", steps: step, tokens };
    const cost = 900 + 450 * step;
    if (tokens + cost > cfg.budgetTokens) return { events, outcome: "ran-away", steps: step, tokens };
    step++;
    tokens += cost;
    const fails = r() < cfg.failureRate;
    const setback = fails && r() < 0.34;
    events.push({ step, phase: "assess", ok: true, progress, tokens });
    events.push({ step, phase: "decide", ok: true, progress, tokens });
    events.push({ step, phase: "act", ok: !fails, progress, tokens });
    if (!fails) progress++;
    else if (setback) progress = Math.max(0, progress - 1);
    events.push({ step, phase: "check", ok: !fails, progress, tokens });
  }
}
