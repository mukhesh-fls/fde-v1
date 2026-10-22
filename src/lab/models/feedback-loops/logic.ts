import { rng } from "../../rng";

/**
 * Episode 2, model 2: a reinforcing loop (retry storm) and the balancing loops that brake it
 * (backoff with jitter, a retry budget). Time runs in one-second ticks.
 */

export type FeedbackConfig = {
  clients: number; // each sends one new request per second
  retries: number; // retries per failed request, 0..4
  backoff: boolean; // wait 1..2^attempt seconds with jitter instead of retrying next second
  budget: boolean; // retries limited to 10% of new requests each second
  slowdown: boolean; // provider capacity halves between t = 5 and t = 15
  seconds: number;
  capacity: number; // requests the provider can serve per second
};

export type FeedbackTick = { t: number; fresh: number; retries: number; load: number; served: number; failed: number; capacity: number };
export type FeedbackResult = { ticks: FeedbackTick[]; peakLoad: number; servedPct: number; gaveUp: number };

export const FEEDBACK_DEFAULTS: FeedbackConfig = {
  clients: 40,
  retries: 3,
  backoff: false,
  budget: false,
  slowdown: true,
  seconds: 30,
  capacity: 50,
};

type Pending = { due: number; attempt: number };

export function simulateFeedback(cfg: FeedbackConfig, seed = 11): FeedbackResult {
  const r = rng(seed);
  const pending: Pending[] = [];
  const ticks: FeedbackTick[] = [];
  let servedOriginal = 0;
  let gaveUp = 0;
  const totalFresh = cfg.clients * cfg.seconds;

  for (let t = 0; t < cfg.seconds; t++) {
    const capacity = cfg.slowdown && t >= 5 && t < 15 ? Math.round(cfg.capacity * 0.5) : cfg.capacity;
    const due = pending.filter((p) => p.due === t);
    for (const p of due) pending.splice(pending.indexOf(p), 1);
    let retryList = due;
    if (cfg.budget) {
      const allowed = Math.ceil(cfg.clients * 0.1);
      gaveUp += Math.max(0, retryList.length - allowed);
      retryList = retryList.slice(0, allowed);
    }
    const requests: Pending[] = [...Array.from({ length: cfg.clients }, () => ({ due: t, attempt: 0 })), ...retryList];
    // Shuffle so fresh requests and retries compete fairly for capacity.
    for (let i = requests.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [requests[i], requests[j]] = [requests[j], requests[i]];
    }
    const load = requests.length;
    // An overloaded provider wastes effort on requests that time out, so it serves less than its
    // capacity. This is what turns retries into a storm instead of a free second chance.
    const effective = load > capacity ? Math.round(capacity * Math.max(0.5, 1 - 0.3 * (load / capacity - 1))) : capacity;
    const served = Math.min(load, effective);
    let failed = 0;
    requests.forEach((req, i) => {
      if (i < served) {
        servedOriginal++;
        return;
      }
      failed++;
      if (req.attempt < cfg.retries) {
        const wait = cfg.backoff ? 1 + Math.floor(r() * 2 ** (req.attempt + 1)) : 1;
        pending.push({ due: t + wait, attempt: req.attempt + 1 });
      } else gaveUp++;
    });
    ticks.push({ t, fresh: cfg.clients, retries: retryList.length, load, served, failed, capacity });
  }
  return {
    ticks,
    peakLoad: Math.max(...ticks.map((k) => k.load)),
    servedPct: Math.min(1, servedOriginal / totalFresh),
    gaveUp,
  };
}
