/** Episode 6, model 1: what fills the context window on each call, and what each technique removes. */

export type BlockKind = "system" | "tools" | "retrieved" | "history" | "tool-results" | "notes";
export type ContextConfig = {
  turns: number;
  summarise: boolean;
  dropToolResults: boolean;
  onDemand: boolean;
  caching: boolean;
  notes: boolean;
};
export type Block = { kind: BlockKind; tokens: number; relevant: number; cached: boolean; label: string };
export type ContextResult = { blocks: Block[]; total: number; capacity: number; fill: number; relevantShare: number; quality: number; costPerCall: number; cachedShare: number };

export const CONTEXT_DEFAULTS: ContextConfig = { turns: 20, summarise: false, dropToolResults: false, onDemand: false, caching: false, notes: false };
export const CAPACITY = 200_000;
/** Example price per million input tokens, with cached tokens at a tenth of the price. */
export const PRICE = { input: 3, cached: 0.3 };

export function buildContext(cfg: ContextConfig): ContextResult {
  const blocks: Block[] = [];
  blocks.push({ kind: "system", tokens: 3000, relevant: 3000, cached: cfg.caching, label: "System instructions" });
  blocks.push({ kind: "tools", tokens: 6000, relevant: 3000, cached: cfg.caching, label: "Tool definitions" });
  // All 40 policy documents upfront, or only the 3 the current question needs.
  const docs = cfg.onDemand ? 3 * 1500 : 40 * 1500;
  blocks.push({ kind: "retrieved", tokens: docs, relevant: Math.min(docs, 4500), cached: cfg.caching && !cfg.onDemand, label: cfg.onDemand ? "3 documents found by search" : "All 40 policy documents" });
  // Each turn adds about 900 tokens of conversation and 2,500 of tool results.
  const recent = Math.min(cfg.turns, 4);
  const old = cfg.turns - recent;
  const history = cfg.summarise ? recent * 900 + (old > 0 ? 1200 : 0) : cfg.turns * 900;
  blocks.push({ kind: "history", tokens: history, relevant: Math.min(history, recent * 900 + (old > 0 ? 1200 : 0)), cached: cfg.caching && old > 0, label: cfg.summarise && old > 0 ? `Last ${recent} turns + a summary` : `${cfg.turns} turns of conversation` });
  const toolResults = cfg.dropToolResults ? recent * 2500 : cfg.turns * 2500;
  blocks.push({ kind: "tool-results", tokens: toolResults, relevant: Math.min(toolResults, 2 * 2500), cached: false, label: cfg.dropToolResults ? "Recent tool results only" : "Every tool result so far" });
  if (cfg.notes) blocks.push({ kind: "notes", tokens: 800, relevant: 800, cached: false, label: "Progress notes (read from a file)" });

  const total = blocks.reduce((s, b) => s + b.tokens, 0);
  const relevant = blocks.reduce((s, b) => s + b.relevant, 0);
  const cachedTokens = blocks.filter((b) => b.cached).reduce((s, b) => s + b.tokens, 0);
  const fill = total / CAPACITY;
  const relevantShare = relevant / total;
  // Quality falls as irrelevant material crowds the attention budget, and falls hard past the limit.
  let quality = 0.55 + 0.45 * relevantShare;
  if (fill > 1) quality *= 0.6;
  else if (fill > 0.6) quality *= 1 - (fill - 0.6) * 0.5;
  if (cfg.notes && cfg.summarise) quality = Math.min(1, quality + 0.03);
  const costPerCall = ((total - cachedTokens) * PRICE.input + cachedTokens * PRICE.cached) / 1_000_000;
  return { blocks, total, capacity: CAPACITY, fill, relevantShare, quality: Math.max(0, Math.min(1, quality)), costPerCall, cachedShare: cachedTokens / total };
}
