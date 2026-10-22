import { hash, rng } from "../../rng";
import { CORPUS } from "./corpus";

/**
 * Episode 3, model 1: a small teaching language model. It is a trigram model with a "topic" boost from
 * every word still inside the context window, so the window genuinely changes what it predicts.
 * Real LLMs use a transformer with billions of weights; the steps the learner sees are the same:
 * tokens, vectors, attention over the context, a probability for every candidate, then sampling.
 */

export type Token = { text: string; piece: boolean };

/** Splits text into tokens. Long words become two pieces, as real subword tokenizers do. */
export function tokenize(text: string): Token[] {
  const words = text.toLowerCase().match(/[a-z]+|[0-9]+|[^\sa-z0-9]/g) ?? [];
  const out: Token[] = [];
  for (const w of words) {
    if (w.length > 7) {
      const cut = Math.ceil(w.length / 2);
      out.push({ text: w.slice(0, cut), piece: false }, { text: w.slice(cut), piece: true });
    } else out.push({ text: w, piece: false });
  }
  return out;
}

/** Joins tokens back into text. Pieces attach to the token before them. */
export function detokenize(tokens: Token[]) {
  return tokens
    .map((t, i) => (i === 0 || t.piece || /^[.,?]$/.test(t.text) ? t.text : ` ${t.text}`))
    .join("")
    .trim();
}

type Counts = Map<string, Map<string, number>>;

function bump(m: Counts, key: string, next: string) {
  let inner = m.get(key);
  if (!inner) m.set(key, (inner = new Map()));
  inner.set(next, (inner.get(next) ?? 0) + 1);
}

export type Model = { tri: Counts; bi: Counts; uni: Map<string, number>; cooc: Counts; vocab: string[] };

const BOS = "<s>";
const keyOf = (t: Token) => (t.piece ? `##${t.text}` : t.text);
const tokenOf = (k: string): Token => (k.startsWith("##") ? { text: k.slice(2), piece: true } : { text: k, piece: false });

export function train(corpus: string[] = CORPUS): Model {
  const tri: Counts = new Map();
  const bi: Counts = new Map();
  const uni = new Map<string, number>();
  const cooc: Counts = new Map();
  for (const line of corpus) {
    const keys = [BOS, BOS, ...tokenize(line).map(keyOf)];
    for (let i = 2; i < keys.length; i++) {
      bump(tri, `${keys[i - 2]} ${keys[i - 1]}`, keys[i]);
      bump(bi, keys[i - 1], keys[i]);
      uni.set(keys[i], (uni.get(keys[i]) ?? 0) + 1);
    }
    const set = new Set(keys.slice(2));
    for (const a of set) for (const b of set) if (a !== b) bump(cooc, a, b);
  }
  return { tri, bi, uni, cooc, vocab: [...uni.keys()] };
}

export type Candidate = { token: Token; key: string; p: number };

/**
 * Probabilities for the next token, given the tokens in the context window.
 * Trigram counts, backing off to bigrams and single words, then boosted by co-occurrence with
 * words in the window. `temperature` reshapes the distribution: 0 means always take the top one.
 */
export function predict(model: Model, context: Token[], temperature: number, topN = 6): Candidate[] {
  const keys = [BOS, BOS, ...context.map(keyOf)];
  const a = keys[keys.length - 2];
  const b = keys[keys.length - 1];
  const scores = new Map<string, number>();
  const add = (m: Map<string, number> | undefined, w: number) => {
    if (!m) return;
    const total = [...m.values()].reduce((x, y) => x + y, 0);
    for (const [k, c] of m) scores.set(k, (scores.get(k) ?? 0) + (w * c) / total);
  };
  add(model.tri.get(`${a} ${b}`), 1);
  add(model.bi.get(b), 0.25);
  if (scores.size === 0) add(model.uni, 0.05);
  // Topic boost: words that appear in the window make related words more likely.
  const windowKeys = new Set(context.map(keyOf));
  for (const [k, s] of scores) {
    let boost = 0;
    for (const w of windowKeys) boost += model.cooc.get(w)?.get(k) ?? 0;
    scores.set(k, s * (1 + 0.15 * Math.min(boost, 6)));
  }
  const ranked = [...scores.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
  const total = ranked.reduce((x, [, s]) => x + s, 0);
  const probs = ranked.map(([k, s]) => ({ key: k, p: s / total }));
  return applyTemperature(probs, temperature)
    .slice(0, topN)
    .map((c) => ({ ...c, token: tokenOf(c.key) }));
}

export function applyTemperature<T extends { p: number }>(probs: T[], temperature: number): T[] {
  if (probs.length === 0) return probs;
  if (temperature <= 0.01) return probs.map((c, i) => ({ ...c, p: i === 0 ? 1 : 0 }));
  const w = probs.map((c) => Math.pow(c.p, 1 / temperature));
  const sum = w.reduce((x, y) => x + y, 0);
  return probs.map((c, i) => ({ ...c, p: w[i] / sum }));
}

/** Picks one candidate. With a fixed seed and step, the same input always gives the same pick. */
export function sample(cands: Candidate[], seed: number): Candidate {
  const r = rng(seed)();
  const total = cands.reduce((x, c) => x + c.p, 0);
  let acc = 0;
  for (const c of cands) {
    acc += c.p / total;
    if (r <= acc) return c;
  }
  return cands[cands.length - 1];
}

/** A stable small vector per token, drawn as the bar column above each tile. */
export function embedding(t: Token, dims = 8): number[] {
  const h = hash(keyOf(t));
  const r = rng(h);
  const v = Array.from({ length: dims }, () => r() * 2 - 1);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

/**
 * Attention weights from the token at `i` to every token at or before it: similarity of their vectors,
 * plus a pull towards recent tokens, through a softmax.
 */
export function attention(tokens: Token[], i: number): number[] {
  const q = embedding(tokens[i]);
  const raw = tokens.slice(0, i + 1).map((t, j) => {
    const k = embedding(t);
    const sim = q.reduce((s, x, d) => s + x * k[d], 0);
    return 2 * sim + 1.2 / (1 + (i - j));
  });
  const m = Math.max(...raw);
  const e = raw.map((x) => Math.exp(x - m));
  const s = e.reduce((x, y) => x + y, 0);
  return e.map((x) => x / s);
}

export const entropy = (ps: number[]) => -ps.reduce((s, p) => (p > 0 ? s + p * Math.log2(p) : s), 0);

/** The attention heads shown in each transformer block. Real heads learn their patterns; these four are typical ones. */
export const HEADS = [
  { id: "meaning", label: "Meaning head", note: "looks at words with related meaning" },
  { id: "previous", label: "Previous-token head", note: "looks at the token just before" },
  { id: "start", label: "Start head", note: "keeps an eye on the start of the text" },
  { id: "recent", label: "Recent-words head", note: "spreads over the last few tokens" },
] as const;

const softmax = (xs: number[]) => {
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
};

/**
 * Attention weights for each head, from the token at `i` to every token at or before it. Deeper blocks
 * lean more on meaning, as in real models where later layers carry more abstract information.
 */
export function attentionHeads(tokens: Token[], i: number, block = 0): number[][] {
  const q = embedding(tokens[i]);
  const sims = tokens.slice(0, i + 1).map((t) => {
    const k = embedding(t);
    return q.reduce((s, x, d) => s + x * k[d], 0);
  });
  const depth = 1 + block * 0.35;
  return [
    softmax(sims.map((s, j) => 3 * depth * s + (j === i ? -1 : 0))),
    softmax(sims.map((_, j) => (j === i - 1 ? 4 : j === i ? 1 : 0))),
    softmax(sims.map((_, j) => (j === 0 ? 3.5 : 0) + (j === i ? 0.5 : 0))),
    softmax(sims.map((_, j) => -0.7 * (i - j))),
  ];
}

/** How strongly a token's feed-forward layer fires in a block, from 0 to 1. Stable per token and block. */
export function mlpActivation(t: Token, block: number): number {
  const r = rng(hash(`${keyOf(t)}:${block}`));
  return 0.25 + 0.75 * r();
}
