import { rng } from "../../rng";

/** Episode 4, model 1: wrap an unpredictable model in a contract: validate, retry once, fall back, then a person. */

export type ContractConfig = { reliability: number; validate: boolean; retry: boolean; fallback: boolean; requests: number };
export type Outcome = "valid" | "valid-after-retry" | "fallback" | "person" | "bad-to-user";
export type ContractRequest = { id: number; firstOk: boolean; retryOk: boolean | null; outcome: Outcome; cost: number };
export type ContractResult = { requests: ContractRequest[]; counts: Record<Outcome, number>; cost: number };

export const CONTRACT_DEFAULTS: ContractConfig = { reliability: 0.85, validate: false, retry: false, fallback: false, requests: 50 };

/** Relative cost units: one model call = 1, a fallback (a simpler fixed reply path) = 0.1, a person = 5. */
export const COST = { call: 1, fallback: 0.1, person: 5 };

export function runContract(cfg: ContractConfig, seed = 21): ContractResult {
  const r = rng(seed);
  const requests: ContractRequest[] = [];
  for (let id = 0; id < cfg.requests; id++) {
    const firstOk = r() < cfg.reliability;
    // A retry that includes the validation error succeeds more often than a blind first try.
    const retryRoll = r();
    let outcome: Outcome;
    let retryOk: boolean | null = null;
    let cost = COST.call;
    if (firstOk) outcome = "valid";
    else if (!cfg.validate) outcome = "bad-to-user";
    else {
      if (cfg.retry) {
        cost += COST.call;
        retryOk = retryRoll < Math.min(0.97, cfg.reliability + 0.1);
      }
      if (retryOk) outcome = "valid-after-retry";
      else if (cfg.fallback) {
        outcome = "fallback";
        cost += COST.fallback;
      } else {
        outcome = "person";
        cost += COST.person;
      }
    }
    requests.push({ id, firstOk, retryOk, outcome, cost });
  }
  const counts: Record<Outcome, number> = { valid: 0, "valid-after-retry": 0, fallback: 0, person: 0, "bad-to-user": 0 };
  for (const q of requests) counts[q.outcome]++;
  return { requests, counts, cost: requests.reduce((s, q) => s + q.cost, 0) };
}
