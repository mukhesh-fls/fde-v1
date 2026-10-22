/** Episode 2, model 1: a stock (the context window, in tokens) with an inflow and an outflow. */

export type StockConfig = { added: number; removed: number; turns: number; capacity: number; start: number };
export type StockTurn = { turn: number; level: number; overflow: number; quality: number };

export const STOCK_DEFAULTS: StockConfig = { added: 9000, removed: 2000, turns: 30, capacity: 200_000, start: 6000 };

/**
 * Answer quality stays high while the window is under 60% full, then falls as it fills
 * (more to attend to, more irrelevant material), and drops hard once it overflows and old content is cut.
 */
export function qualityAt(fill: number) {
  if (fill <= 0.6) return 1;
  if (fill <= 1) return 1 - ((fill - 0.6) / 0.4) * 0.35;
  return 0.45;
}

export function simulateStock(cfg: StockConfig): StockTurn[] {
  const out: StockTurn[] = [];
  let level = cfg.start;
  for (let turn = 1; turn <= cfg.turns; turn++) {
    level = Math.max(cfg.start, level + cfg.added - cfg.removed);
    const overflow = Math.max(0, level - cfg.capacity);
    out.push({ turn, level: Math.min(level, cfg.capacity), overflow, quality: qualityAt(level / cfg.capacity) });
  }
  return out;
}

/** The first turn at which the stock passes its capacity, or null if it never does. */
export const overflowTurn = (turns: StockTurn[]) => turns.find((t) => t.overflow > 0)?.turn ?? null;
