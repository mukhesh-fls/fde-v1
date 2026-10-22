/**
 * Episode 3, model 2: a tiny neural network that routes a support message.
 * 3 inputs (features of the message) → 4 hidden neurons (tanh) → 2 outputs (softmax).
 */

export const INPUTS = ["Mentions money", "Mentions delay", "Angry tone"] as const;
export const OUTPUTS = ["Send to refunds team", "Send to general support"] as const;
export const HIDDEN = 4;

export type Net = { w1: number[][]; b1: number[]; w2: number[][]; b2: number[] };
export type Forward = { hidden: number[]; logits: number[]; probs: number[] };

/** Starting weights: chosen so the untrained net is unsure, roughly 50/50 on most messages. */
export const initialNet = (): Net => ({
  w1: [
    [0.4, -0.2, 0.1],
    [-0.3, 0.5, 0.2],
    [0.2, 0.1, -0.4],
    [-0.1, -0.3, 0.3],
  ],
  b1: [0, 0, 0, 0],
  w2: [
    [0.3, -0.2, 0.1, -0.1],
    [-0.2, 0.3, -0.1, 0.2],
  ],
  b2: [0, 0],
});

export function randomNet(seed: number): Net {
  let s = seed >>> 0;
  const r = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s / 4294967296) * 2 - 1;
  };
  return {
    w1: Array.from({ length: HIDDEN }, () => [r() * 2, r() * 2, r() * 2]),
    b1: Array.from({ length: HIDDEN }, () => r() * 0.5),
    w2: Array.from({ length: 2 }, () => Array.from({ length: HIDDEN }, () => r() * 2)),
    b2: [0, 0],
  };
}

export function forward(net: Net, x: number[]): Forward {
  const hidden = net.w1.map((row, i) => Math.tanh(row.reduce((s, w, j) => s + w * x[j], net.b1[i])));
  const logits = net.w2.map((row, k) => row.reduce((s, w, i) => s + w * hidden[i], net.b2[k]));
  const m = Math.max(...logits);
  const e = logits.map((l) => Math.exp(l - m));
  const sum = e.reduce((a, b) => a + b, 0);
  return { hidden, logits, probs: e.map((v) => v / sum) };
}

/** Labelled examples: [inputs, correct output index]. 0 = refunds, 1 = general support. */
export const EXAMPLES: [number[], number][] = [
  [[1, 0, 0], 0],
  [[1, 1, 0], 0],
  [[1, 0, 1], 0],
  [[0.8, 0.2, 0.6], 0],
  [[0, 1, 0], 1],
  [[0, 1, 1], 1],
  [[0, 0, 1], 1],
  [[0.1, 0.6, 0.2], 1],
];

export function loss(net: Net, examples = EXAMPLES) {
  return examples.reduce((s, [x, y]) => s - Math.log(forward(net, x).probs[y] + 1e-9), 0) / examples.length;
}

const clone = (n: Net): Net => ({ w1: n.w1.map((r) => [...r]), b1: [...n.b1], w2: n.w2.map((r) => [...r]), b2: [...n.b2] });

/** Gradient descent on cross-entropy: each step nudges every weight a little in the direction that lowers the loss. */
export function trainSteps(net: Net, steps: number, lr = 0.5, examples = EXAMPLES): Net {
  let n = clone(net);
  for (let s = 0; s < steps; s++) {
    const g = { w1: n.w1.map((r) => r.map(() => 0)), b1: n.b1.map(() => 0), w2: n.w2.map((r) => r.map(() => 0)), b2: [0, 0] };
    for (const [x, y] of examples) {
      const f = forward(n, x);
      const dLogits = f.probs.map((p, k) => p - (k === y ? 1 : 0));
      for (let k = 0; k < 2; k++) {
        g.b2[k] += dLogits[k];
        for (let i = 0; i < HIDDEN; i++) g.w2[k][i] += dLogits[k] * f.hidden[i];
      }
      for (let i = 0; i < HIDDEN; i++) {
        const dh = (dLogits[0] * n.w2[0][i] + dLogits[1] * n.w2[1][i]) * (1 - f.hidden[i] ** 2);
        g.b1[i] += dh;
        for (let j = 0; j < 3; j++) g.w1[i][j] += dh * x[j];
      }
    }
    const m = examples.length;
    n = {
      w1: n.w1.map((r, i) => r.map((w, j) => w - (lr * g.w1[i][j]) / m)),
      b1: n.b1.map((b, i) => b - (lr * g.b1[i]) / m),
      w2: n.w2.map((r, k) => r.map((w, i) => w - (lr * g.w2[k][i]) / m)),
      b2: n.b2.map((b, k) => b - (lr * g.b2[k]) / m),
    };
  }
  return n;
}

export const accuracy = (net: Net, examples = EXAMPLES) =>
  examples.filter(([x, y]) => {
    const p = forward(net, x).probs;
    return (p[0] > p[1] ? 0 : 1) === y;
  }).length / examples.length;
