import { hash, rng } from "../../rng";
import type { Chunk, Topic } from "./chunks";
import { CHUNKS, TOPICS } from "./chunks";

/**
 * Episode 6, model 2: search by meaning with a small teaching embedding, compared with keyword search.
 * The embedding maps words to six topic directions (plus a little per-word noise), so "money back" and
 * "refund" land close together even though they share no words. Real embeddings learn this from data
 * and have hundreds or thousands of dimensions; the lookup (nearest vectors by cosine) is the same.
 */

const DIM = 8;

/** Words that point towards each topic. A real model learns these associations; here they're written out. */
const LEXICON: Record<Topic, string[]> = {
  refunds: ["refund", "refunds", "money", "back", "reimbursement", "reimburse", "compensation", "charge", "charges", "credit", "voucher", "cash", "paid", "returned", "reversed", "fees", "cost"],
  baggage: ["bag", "bags", "baggage", "luggage", "suitcase", "lost", "missing", "arrived", "delivered", "kilograms", "cabin", "checked", "damaged", "property", "equipment"],
  changes: ["change", "changes", "move", "date", "rebook", "rebooking", "reschedule", "name", "seat", "upgrade", "upgrades", "booking", "bookings", "reference", "flight", "group"],
  documents: ["visa", "visas", "passport", "passports", "id", "documents", "entry", "transit", "embassy", "aadhaar", "licence", "consent", "singapore", "dubai", "nationality"],
  loyalty: ["miles", "points", "gold", "status", "member", "members", "tier", "tiers", "lounge", "earn", "earned", "pooling", "expire"],
  assistance: ["wheelchair", "assistance", "pregnant", "doctor", "medical", "oxygen", "animals", "meals", "mobility", "children", "escorted", "hearing", "help", "jain", "diabetic"],
};

const TOPIC_INDEX = Object.fromEntries(TOPICS.map((t, i) => [t.id, i])) as Record<Topic, number>;
const WORD_TOPIC = new Map<string, Topic>();
for (const [topic, words] of Object.entries(LEXICON) as [Topic, string[]][]) for (const w of words) WORD_TOPIC.set(w, topic);

export const words = (text: string) => text.toLowerCase().match(/[a-z0-9]+(?:-[0-9]+)?/g) ?? [];

const STOP = new Set("a an the and or of to for in on at by is are be can i my you your me with up as it if do need no not be".split(" "));

export function embed(text: string): number[] {
  const v = new Array(DIM).fill(0);
  for (const w of words(text)) {
    if (STOP.has(w)) continue;
    const topic = WORD_TOPIC.get(w);
    if (topic) v[TOPIC_INDEX[topic]] += 1;
    // Every word also nudges two "other meaning" dimensions a little, from its hash.
    const r = rng(hash(w));
    v[6] += (r() - 0.5) * 0.5;
    v[7] += (r() - 0.5) * 0.5;
  }
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}

export const cosine = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

/** Places a vector in 3D for the map: each topic has a direction around a circle, the extra dims add height. */
export function project(v: number[]): [number, number, number] {
  let x = 0;
  let z = 0;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    x += v[i] * Math.cos(a);
    z += v[i] * Math.sin(a);
  }
  return [x * 14, 3 + v[6] * 7 + v[7] * 4, z * 14];
}

export type Indexed = Chunk & { vector: number[]; position: [number, number, number] };

/** The index: every chunk with its vector and its place on the map. Built once, like filling a vector store. */
export const INDEX: Indexed[] = CHUNKS.map((c) => {
  const vector = embed(c.text);
  // Chunks with near-identical vectors would sit on top of each other, so each gets a small, stable
  // offset on the map. It's for readability only: search uses the vectors, not these positions.
  const r = rng(hash(c.id));
  const [x, y, z] = project(vector);
  return { ...c, vector, position: [x + (r() - 0.5) * 4.2, y + (r() - 0.5) * 2.4, z + (r() - 0.5) * 4.2] as [number, number, number] };
});

export type Mode = "meaning" | "keywords" | "both";
export type Hit = { chunk: Indexed; score: number; rank: number };

export function searchMeaning(query: string, k: number): Hit[] {
  const q = embed(query);
  return INDEX.map((chunk) => ({ chunk, score: cosine(q, chunk.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((h, rank) => ({ ...h, rank: rank + 1 }));
}

/** Keyword search: counts exact shared words (ignoring very common ones), weighted by how rare each word is. */
export function searchKeywords(query: string, k: number): Hit[] {
  const q = new Set(words(query).filter((w) => !STOP.has(w)));
  const df = new Map<string, number>();
  for (const c of INDEX) for (const w of new Set(words(c.text))) df.set(w, (df.get(w) ?? 0) + 1);
  return INDEX.map((chunk) => {
    let score = 0;
    for (const w of new Set(words(chunk.text))) if (q.has(w)) score += Math.log(1 + INDEX.length / (df.get(w) ?? 1));
    return { chunk, score };
  })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((h, rank) => ({ ...h, rank: rank + 1 }));
}

/** Both: reciprocal rank fusion of the two result lists, so either kind of match can win. */
export function searchBoth(query: string, k: number): Hit[] {
  const m = searchMeaning(query, 20);
  const kw = searchKeywords(query, 20);
  const fused = new Map<string, { chunk: Indexed; score: number }>();
  for (const list of [m, kw])
    for (const h of list) {
      const e = fused.get(h.chunk.id) ?? { chunk: h.chunk, score: 0 };
      e.score += 1 / (10 + h.rank);
      fused.set(h.chunk.id, e);
    }
  return [...fused.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((h, rank) => ({ ...h, rank: rank + 1 }));
}

export function search(query: string, mode: Mode, k: number): Hit[] {
  if (!query.trim()) return [];
  return mode === "meaning" ? searchMeaning(query, k) : mode === "keywords" ? searchKeywords(query, k) : searchBoth(query, k);
}
