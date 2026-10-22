import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, InstancedMesh, Mesh, MeshStandardMaterial } from "three";
import { CatmullRomCurve3, Color, Object3D, Vector3 } from "three";
import { create } from "zustand";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useExplain, useModelId } from "../../explain";
import { useSceneLabels, type LabLabel } from "../../labels";
import { Box, CurveTube, Gloss, lc, Orb, Stage, Tube } from "../../primitives";
import { useLab } from "../../store";
import { Metric, Slider } from "../../ui/controls";
import { useTicker } from "../../useTicker";
import { PROMPT_PRESETS } from "./corpus";
import { attentionHeads, detokenize, embedding, HEADS, mlpActivation, predict, sample, tokenize, train, type Candidate, type Token } from "./logic";

const MODEL = train();
const SHOWN = 9;
const COL = 2.7;
const BLOCKS = 4;
const TOK_Y = 0.35;
const EMB_Y = 1.4;
const blockY = (b: number) => 4.8 + b * 4.4; // attention sub-layer
const mlpY = (b: number) => blockY(b) + 2.3; // feed-forward sub-layer
const TOP = blockY(BLOCKS - 1) + 3.2;
const HEAD_COLORS = [lc.sky, lc.mint, lc.lavender, lc.butter];
const HEAD_Z = [-0.75, -0.25, 0.25, 0.75];
const PASS_SECONDS = 1.7;
const DROP_SECONDS = 0.8;

type S = {
  prompt: string;
  generated: Token[];
  temperature: number;
  window: number;
  run: number;
  focus: number | null; // index into all tokens whose attention is shown
  lastPick: string | null;
  passAt: number | null; // when the last forward pass started, for the animation
  setPrompt: (p: string) => void;
  set: (p: Partial<Pick<S, "temperature" | "window" | "focus">>) => void;
  next: (n: number) => void;
  reset: () => void;
};

export const useNextToken = create<S>((set, get) => ({
  prompt: PROMPT_PRESETS[0],
  generated: [],
  temperature: 0.8,
  window: 24,
  run: 1,
  focus: null,
  lastPick: null,
  passAt: null,
  setPrompt: (prompt) => set({ prompt, generated: [], focus: null, lastPick: null, passAt: null }),
  set: (p) => set(p),
  next: (n) => {
    let { generated } = get();
    const { prompt, temperature, window, run } = get();
    let lastPick: string | null = null;
    for (let k = 0; k < n; k++) {
      const all = [...tokenize(prompt), ...generated];
      const ctx = all.slice(-window);
      const cands = predict(MODEL, ctx, temperature);
      if (!cands.length) break;
      const pick = sample(cands, run * 7919 + all.length * 31);
      generated = [...generated, pick.token];
      lastPick = pick.key;
      if (pick.token.text === "." || pick.token.text === "?") break;
    }
    set({ generated, focus: null, lastPick, passAt: performance.now() });
  },
  reset: () => set((s) => ({ generated: [], run: s.run + 1, focus: null, lastPick: null, passAt: null })),
}));

/** Everything the view and the controls need, derived from the store. */
export function useNextTokenState() {
  const { prompt, generated, temperature, window, focus, lastPick } = useNextToken();
  return useMemo(() => {
    const all = [...tokenize(prompt), ...generated];
    // While a pass is animating, the prediction shown is the one that produced the newest token.
    const before = lastPick ? all.slice(0, -1) : all;
    const windowStart = Math.max(0, all.length - window);
    const ctx = all.slice(windowStart);
    const shownCands: Candidate[] = predict(MODEL, before.slice(-window), temperature);
    const candidates: Candidate[] = predict(MODEL, ctx, temperature);
    const shownStart = Math.max(0, all.length - SHOWN);
    const shown = all.slice(shownStart);
    const q = Math.max(windowStart, focus ?? all.length - 1);
    return { all, windowStart, ctx, candidates, shownCands, shownStart, shown, q, promptLength: tokenize(prompt).length };
  }, [prompt, generated, temperature, window, focus, lastPick]);
}

const xOf = (k: number, n: number) => (k - (n - 1) / 2) * COL - 4;

/** A small wavy line: the positional encoding added to each token's vector. */
function PositionWave({ x, phase, active }: { x: number; phase: number; active: boolean }) {
  const pts = useMemo(() => Array.from({ length: 12 }, (_, i) => [x - 0.9 + (i / 11) * 1.8, EMB_Y + 1.75 + Math.sin(i * 0.9 + phase) * 0.18, 0] as Vec3), [x, phase]);
  return <CurveTube points={pts} radius={0.035} color={lc.amber} glow={active ? 1.6 : 0.7} explain="position" />;
}

export function NextTokenView() {
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const { lastPick, passAt } = useNextToken();
  const { all, windowStart, shownCands: pickCands, candidates, shownStart, shown, q, promptLength } = useNextTokenState();
  // During a pass, show the probabilities that produced the new token; afterwards, the next prediction.
  const animating = passAt !== null && performance.now() - passAt < (PASS_SECONDS + DROP_SECONDS) * 1000;
  useTicker(animating, 120);
  const shownCands = animating ? pickCands : candidates;
  const bars = useRef<InstancedMesh>(null);
  const modelId = useModelId();
  const showExplain = (id: string, at: Vec3) => useExplain.getState().show(modelId, id, at);
  const flow = useRef<InstancedMesh>(null);
  const wave = useRef<Mesh>(null);
  const drop = useRef<Group>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const n = shown.length;
  const rowL = xOf(0, n) - COL / 2;
  const rowR = xOf(n - 1, n) + COL / 2;
  const fanX0 = rowR + 2.6;
  const fanY = TOP - 7.2; // the output sits beside the top blocks, so the whole model fits on screen
  const qShown = q - shownStart;
  const inside = (k: number) => shownStart + k >= windowStart;

  useEffect(() => {
    setStagePoints({
      tokens: [xOf(0, n), 0, 3],
      embeddings: [xOf(1, n), 0, 3],
      attention: [xOf(Math.floor(n / 2), n), 0, 3],
      layers: [xOf(Math.floor(n / 2), n), 0, 3],
      probabilities: [fanX0 + 3, 0, 3],
      sampling: [fanX0 + 3, 0, 3],
      "context-window": [xOf(Math.max(0, windowStart - shownStart), n), 0, 3],
    });
  }, [setStagePoints, n, fanX0, windowStart, shownStart]);

  // Embedding vectors: eight bars per token, cyan for positive values, pink for negative.
  useEffect(() => {
    const m = bars.current;
    if (!m) return;
    let i = 0;
    shown.forEach((t, k) => {
      const v = embedding(t);
      v.forEach((val, d) => {
        const h = Math.max(0.06, Math.abs(val) * 1.25);
        dummy.position.set(xOf(k, n) - 0.84 + d * 0.24, EMB_Y + h / 2, 0);
        dummy.scale.set(0.17, h, 0.5);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        m.setColorAt(i, new Color(!inside(k) ? lc.dim : val >= 0 ? lc.sky : lc.pink));
        i++;
      });
    });
    for (; i < m.count; i++) {
      dummy.position.set(0, -50, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [shown, n, dummy, windowStart, shownStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attention arcs for the focused token, per block and per head.
  const arcs = useMemo(() => {
    const ctx = all.slice(windowStart);
    const out: { from: Vec3; to: Vec3; w: number; color: string; block: number; key: string }[] = [];
    if (qShown < 0) return out;
    for (let b = 0; b < BLOCKS; b++) {
      const heads = attentionHeads(ctx, q - windowStart, b);
      heads.forEach((ws, h) => {
        ws.forEach((w, j) => {
          const idx = windowStart + j;
          if (idx === q || idx < shownStart || w < 0.12) return;
          const y = blockY(b) + 0.2;
          out.push({ from: [xOf(qShown, n), y, HEAD_Z[h]], to: [xOf(idx - shownStart, n), y, HEAD_Z[h]], w, color: HEAD_COLORS[h], block: b, key: `${b}-${h}-${idx}` });
        });
      });
    }
    return out;
  }, [all, windowStart, q, qShown, shownStart, n]);

  // Flow: activations rising up each token's residual stream, fast during a forward pass.
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const e = passAt === null ? null : (performance.now() - passAt) / 1000;
    const passing = e !== null && e < PASS_SECONDS;
    const m = flow.current;
    if (m) {
      const per = 6;
      for (let k = 0; k < SHOWN; k++)
        for (let r = 0; r < per; r++) {
          const idx = k * per + r;
          if (k >= n) {
            dummy.position.set(0, -50, 0);
          } else {
            const speed = passing ? 0.9 : 0.12;
            const u = (t * speed + r / per + k * 0.07) % 1;
            dummy.position.set(xOf(k, n), EMB_Y + 2.2 + u * (TOP - EMB_Y - 2.2), 0);
          }
          dummy.scale.setScalar(inside(k) ? 0.11 : 0.05);
          dummy.updateMatrix();
          m.setMatrixAt(idx, dummy.matrix);
        }
      m.instanceMatrix.needsUpdate = true;
    }
    if (wave.current) {
      const u = e === null ? 1 : Math.min(1, e / PASS_SECONDS);
      wave.current.visible = e !== null && u < 1;
      wave.current.position.y = TOK_Y + u * (TOP - TOK_Y + 0.6);
      (wave.current.material as MeshStandardMaterial).opacity = 0.5 * Math.sin(u * Math.PI);
    }
    // The chosen token drops from its probability bar into the token row.
    if (drop.current) {
      const d = e === null ? -1 : (e - PASS_SECONDS) / DROP_SECONDS;
      drop.current.visible = d >= 0 && d <= 1 && lastPick !== null;
      if (d >= 0 && d <= 1) {
        const k = Math.max(0, shownCands.findIndex((c) => c.key === lastPick));
        const from = new Vector3(fanX0 + k * 2.1, fanY + (shownCands[k]?.p ?? 0) * 6 + 0.6, 0);
        const to = new Vector3(xOf(n - 1, n), TOK_Y + 0.6, 0);
        const curve = new CatmullRomCurve3([from, new Vector3((from.x + to.x) / 2 + 2, Math.max(from.y, 6) + 2, 2.5), to]);
        drop.current.position.copy(curve.getPoint(d * d * (3 - 2 * d)));
      }
    }
  });

  const labels: LabLabel[] = shown.map((t, k) => {
    const idx = shownStart + k;
    return {
      id: `t${idx}`,
      world: [xOf(k, n), TOK_Y + 0.45, 0.2] as Vec3,
      text: t.piece ? `-${t.text}` : t.text,
      tone: !inside(k) ? "muted" : idx === q ? "accent" : idx >= promptLength ? "good" : "default",
      size: "sm",
    };
  });
  if (shownStart > 0) labels.push({ id: "earlier", world: [rowL - 1.6, TOK_Y, 0], text: `+${shownStart} earlier`, tone: "muted", size: "sm" });
  const rowLabel = (id: string, y: number, text: string, sub: string | undefined, on: boolean): LabLabel => ({ id, world: [rowL - 3.4, y, 0], text, sub, tone: on ? "accent" : "plain", size: "sm" });
  labels.push(rowLabel("r-tok", TOK_Y + 0.2, "Tokens", `${all.length} in the text`, stage === "tokens"));
  labels.push(rowLabel("r-emb", EMB_Y + 0.9, "Embedding + position", "a vector per token", stage === "embeddings"));
  for (let b = 0; b < BLOCKS; b++) {
    labels.push(rowLabel(`r-att${b}`, blockY(b) + 0.2, `Block ${b + 1} · attention`, b === 0 ? "4 heads" : undefined, stage === "attention" || stage === "layers"));
    labels.push(rowLabel(`r-mlp${b}`, mlpY(b), `Block ${b + 1} · feed-forward`, undefined, stage === "layers"));
  }
  labels.push({ id: "more", world: [rowL - 3.4, TOP + 0.4, 0], text: "Real LLMs stack 30 to 100+ blocks", tone: "muted", size: "sm" });
  labels.push({ id: "fan", world: [fanX0 + 5.2, fanY + 7.6, 0], text: "Unembed + softmax", sub: "probability of each next token", tone: stage === "probabilities" || stage === "sampling" ? "accent" : "plain", size: "md" });
  shownCands.forEach((c, k) =>
    labels.push({
      id: `c${k}`,
      world: [fanX0 + k * 2.1, fanY + c.p * 6 + 0.7, 0] as Vec3,
      text: c.token.piece ? `-${c.token.text}` : c.token.text,
      sub: `${(c.p * 100).toFixed(c.p < 0.1 ? 1 : 0)}%`,
      tone: animating && c.key === lastPick ? "good" : k === 0 ? "accent" : "default",
      size: "sm",
    }),
  );
  if (stage === "attention")
    HEADS.forEach((h, k) => labels.push({ id: `head${k}`, world: [rowR + 0.9, blockY(0) + 0.2, HEAD_Z[k] * 2.2], text: h.label, tone: "plain", size: "sm" }));
  labels.push({
    id: "window",
    world: [(xOf(Math.max(0, windowStart - shownStart), n) + xOf(n - 1, n)) / 2, -0.1, 2.2],
    text: `Context window: ${all.length - windowStart} of ${all.length} tokens`,
    tone: stage === "context-window" ? "accent" : windowStart > 0 ? "warn" : "plain",
    size: "sm",
  });
  useSceneLabels("next-token", labels, `${all.length}:${q}:${stage}:${lastPick}:${shownCands.map((c) => c.key + c.p.toFixed(3)).join()}`);

  const frameFrom = xOf(Math.max(0, windowStart - shownStart), n) - COL / 2 + 0.1;
  const towerW = rowR - rowL;
  const towerX = (rowL + rowR) / 2;
  const hl = (on: boolean) => (on ? 1.6 : 0);

  return (
    <group>
      <Stage size={[46, 30]} />

      {/* Tokens */}
      {shown.map((_, k) => {
        const idx = shownStart + k;
        return (
          <Box
            key={idx}
            position={[xOf(k, n), TOK_Y, 0]}
            size={[COL - 0.4, 0.55, 1.5]}
            color={!inside(k) ? lc.dim : idx === q ? lc.accentSoft : idx >= promptLength ? lc.goodSoft : lc.node}
            emissive={stage === "tokens" && inside(k) ? lc.accent : undefined}
            emissiveIntensity={0.6}
            explain="token"
            onClick={() => useNextToken.getState().set({ focus: idx })}
          />
        );
      })}
      {/* Context window bracket */}
      <Box position={[(frameFrom + rowR) / 2, 0.04, -0.95]} size={[rowR - frameFrom, 0.06, 0.1]} radius={0.03} color={lc.accent} emissive={lc.accent} emissiveIntensity={hl(stage === "context-window") + 0.4} explain="window" />
      <Box position={[(frameFrom + rowR) / 2, 0.04, 0.95]} size={[rowR - frameFrom, 0.06, 0.1]} radius={0.03} color={lc.accent} emissive={lc.accent} emissiveIntensity={hl(stage === "context-window") + 0.4} explain="window" />

      {/* Embeddings + position */}
      <instancedMesh ref={bars} args={[undefined, undefined, SHOWN * 8]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#5EC8FF" emissiveIntensity={stage === "embeddings" ? 0.9 : 0.35} roughness={0.3} />
      </instancedMesh>
      {shown.map((_, k) => (
        <PositionWave key={`p${shownStart + k}`} x={xOf(k, n)} phase={(shownStart + k) * 0.8} active={stage === "embeddings"} />
      ))}

      {/* Residual streams: each token's vector flows up through every block */}
      {shown.map((_, k) => (
        <Tube key={`res${k}`} from={[xOf(k, n), EMB_Y + 2.1, 0]} to={[xOf(k, n), TOP, 0]} radius={0.05} color={inside(k) ? "#4E6E9E" : lc.dim} opacity={0.9} explain="residual" />
      ))}
      <instancedMesh ref={flow} args={[undefined, undefined, SHOWN * 6]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#BFE9FF" emissive="#8FDBFF" emissiveIntensity={2.2} toneMapped={false} />
      </instancedMesh>

      {/* Transformer blocks */}
      {Array.from({ length: BLOCKS }, (_, b) => (
        <group key={b}>
          {/* Attention sub-layer: a glass slab with one chip per head on each token */}
          <Box position={[towerX, blockY(b), 0]} size={[towerW, 0.16, 2.3]} color={lc.accent} opacity={0.18} emissive={lc.accent} emissiveIntensity={hl(stage === "attention" || stage === "layers") * 0.25} explain="attention-layer" />
          {shown.map((_, k) =>
            HEAD_Z.map((z, h) => (
              <Box key={`${k}-${h}`} position={[xOf(k, n), blockY(b) + 0.14, z]} size={[0.5, 0.1, 0.32]} radius={0.04} color={inside(k) ? HEAD_COLORS[h] : lc.dim} explain="head" />
            )),
          )}
          {/* Feed-forward sub-layer: each token expands, then contracts back */}
          <Box position={[towerX, mlpY(b) - 0.75, 0]} size={[towerW, 0.05, 1.6]} color={lc.mint} opacity={0.08} />
          {shown.map((t, k) => {
            const a = mlpActivation(t, b);
            return (
              <mesh key={`mlp${k}`} position={[xOf(k, n), mlpY(b), 0]} scale={[0.32 + a * 0.55, 0.62, 0.32 + a * 0.55]} onClick={(e) => (e.stopPropagation(), showExplain("mlp", [e.point.x, e.point.y + 0.6, e.point.z]))}>
                <octahedronGeometry args={[1, 0]} />
                <Gloss color={inside(k) ? lc.mint : lc.dim} emissive={lc.mint} emissiveIntensity={inside(k) ? a * (stage === "layers" ? 2 : 0.8) : 0} />
              </mesh>
            );
          })}
          {/* Layer norm rings before each sub-layer */}
          {shown.map((_, k) => (
            <group key={`ln${k}`}>
              {[blockY(b) - 0.55, mlpY(b) - 0.95].map((y) => (
                <mesh key={y} position={[xOf(k, n), y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.28, 0.035, 8, 28]} />
                  <meshStandardMaterial color={lc.lavender} emissive={lc.lavender} emissiveIntensity={inside(k) ? 0.9 : 0.1} toneMapped={false} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
      {arcs.map((a) => (
        <CurveTube
          key={a.key}
          points={[a.from, a.to]}
          arcHeight={0.5 + Math.abs(a.from[0] - a.to[0]) * 0.13}
          radius={0.02 + a.w * 0.09}
          color={a.color}
          glow={stage === "attention" ? 1.8 : 0.9}
          opacity={stage === "attention" || a.block === 0 ? 0.95 : 0.45}
          explain="attention"
        />
      ))}

      {/* Unembedding: the last token's final vector becomes a score for every word in the vocabulary */}
      <CurveTube points={[[xOf(n - 1, n), TOP, 0], [xOf(n - 1, n) + 1, TOP + 1.2, 0], [fanX0 - 1.2, fanY + 0.3, 0]]} radius={0.07} color={lc.accent} glow={1.2} explain="unembed" />
      <Box position={[fanX0 + 5.2, fanY - 0.12, 0]} size={[12.8, 0.24, 2]} color={lc.node} explain="unembed" />
      {shownCands.map((c, k) => (
        <Box
          key={c.key}
          position={[fanX0 + k * 2.1, fanY + Math.max(0.06, c.p * 6) / 2, 0]}
          size={[1.1, Math.max(0.06, c.p * 6), 1.1]}
          radius={0.08}
          color={animating && c.key === lastPick ? lc.good : k === 0 ? lc.accent : lc.accentSoft}
          emissive={animating && c.key === lastPick ? lc.good : lc.accent}
          emissiveIntensity={(animating && c.key === lastPick) || stage === "probabilities" || stage === "sampling" ? 1.4 : 0.35}
          explain="probability"
        />
      ))}

      {/* Forward pass: a sheet of light rising through the tower */}
      <mesh ref={wave} position={[towerX, 0, 0]} visible={false}>
        <boxGeometry args={[towerW + 1.5, 0.08, 3.2]} />
        <meshStandardMaterial color="#9FE3FF" emissive="#5EC8FF" emissiveIntensity={3} transparent opacity={0.4} toneMapped={false} depthWrite={false} />
      </mesh>
      <group ref={drop} visible={false}>
        <Orb position={[0, 0, 0]} radius={0.45} color={lc.good} glow={2.4} />
      </group>
    </group>
  );
}

export function NextTokenControls() {
  const { prompt, temperature, window, setPrompt, set, next, reset, lastPick } = useNextToken();
  const { all, ctx, candidates, promptLength } = useNextTokenState();
  return (
    <div className="lc">
      <label className="lc__field" htmlFor="nt-prompt">
        <span>Prompt</span>
        <input id="nt-prompt" type="text" value={prompt} maxLength={160} onChange={(e) => setPrompt(e.target.value)} />
      </label>
      <Slider id="nt-temp" label="Temperature" value={temperature} min={0} max={2} step={0.1} format={(v) => v.toFixed(1)} onChange={(v) => set({ temperature: v })} />
      <Slider id="nt-window" label="Context window" value={window} min={8} max={48} step={1} format={(v) => `${v} tokens`} onChange={(v) => set({ window: v })} />
      <div className="lc__row">
        <button className="btn btn--primary" onClick={() => next(1)}>
          Next token
        </button>
        <button className="btn" onClick={() => next(8)}>
          Generate 8
        </button>
        <button className="btn" onClick={reset}>
          Reset
        </button>
      </div>
      <div className="lc__presets">
        {PROMPT_PRESETS.map((p) => (
          <button key={p} className={p === prompt ? "is-on" : ""} onClick={() => setPrompt(p)}>
            {p}
          </button>
        ))}
      </div>
      <div className="lc__answer">
        <span style={{ opacity: 0.7 }}>{detokenize(all.slice(0, promptLength))}</span>
        <strong style={{ color: "var(--mint)" }}>{all.length > promptLength ? " " + detokenize(all.slice(promptLength)) : ""}</strong>
      </div>
      <div className="lc__metrics">
        <Metric label="Tokens" value={String(all.length)} />
        <Metric label="Inside the window" value={String(ctx.length)} tone={ctx.length < all.length ? "warn" : undefined} />
        <Metric label="Top next" value={candidates[0] ? `${candidates[0].token.text} ${Math.round(candidates[0].p * 100)}%` : "–"} />
        <Metric label="Last pick" value={lastPick ? lastPick.replace("##", "-") : "–"} tone={lastPick ? "good" : undefined} />
      </div>
    </div>
  );
}
