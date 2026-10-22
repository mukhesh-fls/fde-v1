import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { InstancedMesh, Mesh } from "three";
import { Object3D } from "three";
import { create } from "zustand";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useSceneLabels, type LabLabel } from "../../labels";
import { along, Box, CurveTube, elapsed, lc, Node, Stage } from "../../primitives";
import { useLab } from "../../store";
import { Metric, Slider, Toggle } from "../../ui/controls";
import { useTicker } from "../../useTicker";
import { CALL_DEFAULTS, requestJson, simulateCall, type CallConfig, type CallResult, type HopId } from "./logic";

type S = { cfg: CallConfig; startedAt: number | null; set: (p: Partial<CallConfig>) => void; send: () => void };
export const useApiCall = create<S>((set) => ({
  cfg: CALL_DEFAULTS,
  startedAt: null,
  set: (p) => set((s) => ({ cfg: { ...s.cfg, ...p }, startedAt: null })),
  send: () => set({ startedAt: performance.now() }),
}));

const NODES: { id: HopId; label: string; pos: Vec3; size: Vec3 }[] = [
  { id: "app", label: "Your app", pos: [-14, 0, 3], size: [3.4, 1.4, 2.6] },
  { id: "internet", label: "Internet (HTTPS)", pos: [-8, 0, -1.5], size: [3.4, 0.6, 2.4] },
  { id: "gateway", label: "API gateway", pos: [-2, 0, -3], size: [3, 2, 2.4] },
  { id: "tokenizer", label: "Tokenizer", pos: [4, 0, -3], size: [3, 1.2, 2.4] },
  { id: "model", label: "Model on GPUs", pos: [10.5, 0, 0], size: [4.2, 3, 4] },
];
const P = (id: HopId, y = 1.8): Vec3 => {
  const n = NODES.find((x) => x.id === id)!;
  return [n.pos[0], y, n.pos[2]];
};
const FORWARD: Vec3[] = [P("app"), P("internet"), P("gateway"), P("tokenizer"), P("model")];
const RETURN: Vec3[] = [P("model", 1), [6, 1, 6.5], [-4, 1, 7.5], [-11, 1, 6], P("app", 1)];

/** Animation seconds for the call, so a 2-second call and a 100 ms error both play at a watchable speed. */
const playSeconds = (r: CallResult) => (r.status === 200 ? 6 : 2.4);

export type Timeline = { k: number; hopEnds: number[]; modelStart: number; prefillMs: number; result: CallResult };

function useTimeline(cfg: CallConfig): Timeline {
  return useMemo(() => {
    const result = simulateCall(cfg);
    const k = playSeconds(result) / result.totalMs;
    let acc = 0;
    const hopEnds = result.hops.map((h) => (acc += h.ms));
    const modelIdx = result.hops.findIndex((h) => h.id === "model");
    const modelStart = modelIdx > 0 ? hopEnds[modelIdx - 1] : 0;
    const prefillMs = 80 + Math.round(cfg.promptTokens * 0.25);
    return { k, hopEnds, modelStart, prefillMs, result };
  }, [cfg]);
}

/** The simulated clock in ms of call time, or null when idle. */
export const callClock = (startedAt: number | null, tl: Timeline) => {
  const e = elapsed(startedAt);
  return e === null ? null : Math.min(e / tl.k / 1000, tl.result.totalMs + 400);
};

/** How many output tokens have reached the app by `ms`. */
export function arrivedTokens(ms: number, tl: Timeline, streaming: boolean) {
  const r = tl.result;
  if (r.status !== 200) return 0;
  if (!streaming) return ms >= r.totalMs ? r.outputTokens : 0;
  const first = tl.modelStart + tl.prefillMs + 22 + 42;
  if (ms < first) return 0;
  return Math.min(r.outputTokens, 1 + Math.floor((ms - first) / 22));
}

export function ApiCallView() {
  const { cfg, startedAt } = useApiCall();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const tl = useTimeline(cfg);
  const packet = useRef<Mesh>(null);
  const stream = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const r = tl.result;
  const ms = callClock(startedAt, tl);
  useTicker(startedAt !== null && (ms ?? 0) < r.totalMs + 300);

  useEffect(() => {
    setStagePoints({ app: [-14, 0, 6], gateway: [-2, 0, 0], tokenizer: [4, 0, 0], model: [10.5, 0, 4], stream: [0, 0, 9], response: [-14, 0, 6] });
  }, [setStagePoints]);

  useFrame(() => {
    const now = callClock(useApiCall.getState().startedAt, tl);
    const p = packet.current;
    if (p) {
      p.visible = now !== null && now < (r.status === 200 ? tl.modelStart + tl.prefillMs : r.totalMs);
      if (now !== null) {
        if (r.status === 200) {
          const u = Math.min(1, now / (tl.modelStart || 1));
          p.position.set(...along(FORWARD, u));
        } else {
          // Out to the gateway, then back.
          const half = tl.hopEnds[2];
          const u = now < half ? now / half : 1 - (now - half) / (r.totalMs - half);
          p.position.set(...along(FORWARD.slice(0, 3), Math.max(0, u)));
        }
      }
    }
    // Output tokens travelling back to the app.
    const m = stream.current;
    if (!m) return;
    const n = m.count;
    for (let i = 0; i < n; i++) {
      let u = -1;
      if (now !== null && r.status === 200) {
        if (cfg.streaming) {
          const born = tl.modelStart + tl.prefillMs + i * 22;
          u = (now - born) / 60;
        } else {
          u = (now - (r.totalMs - 44)) / 44 - i * 0.004;
        }
      }
      if (u < 0 || u > 1 || i >= r.outputTokens) dummy.position.set(0, -50, 0);
      else dummy.position.set(...along(RETURN, u));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  const reached = (id: HopId) => {
    if (ms === null) return false;
    const idx = r.hops.findIndex((h) => h.id === id);
    return idx >= 0 && ms >= (idx > 0 ? tl.hopEnds[idx - 1] : 0);
  };
  const failedAtGateway = r.status !== 200;

  const labels: LabLabel[] = NODES.map((n) => {
    const hop = r.hops.find((h) => h.id === n.id);
    const isReached = reached(n.id);
    const isGate = n.id === "gateway" && failedAtGateway && isReached;
    return {
      id: n.id,
      world: [n.pos[0], n.size[1] + 1.4, n.pos[2]] as Vec3,
      text: n.label,
      sub: isGate ? `${r.status} ${r.status === 401 ? "Unauthorized" : "Too Many Requests"}` : isReached && hop ? `${hop.ms} ms` : undefined,
      tone: isGate ? "bad" : stage === n.id ? "accent" : isReached ? "good" : "default",
    };
  });
  const arrived = ms === null ? 0 : arrivedTokens(ms, tl, cfg.streaming);
  labels.push({
    id: "stream",
    world: [-3, 1.3, 8.6],
    text: cfg.streaming ? "Tokens stream back as they're made" : "Whole answer sent at the end",
    sub: ms !== null && r.status === 200 ? `${arrived} of ${r.outputTokens} tokens received` : undefined,
    tone: stage === "stream" ? "accent" : "plain",
  });
  if (ms !== null && ms >= r.totalMs)
    labels.push({
      id: "done",
      world: [-14, 4.2, 3],
      text: r.status === 200 ? `stop_reason: ${r.stopReason}` : `HTTP ${r.status}`,
      sub: r.status === 200 ? `${r.totalMs} ms total · first words at ${r.firstWordsMs} ms` : "No tokens used, nothing charged",
      tone: r.status !== 200 || r.stopReason === "max_tokens" ? "warn" : "good",
      size: "md",
    });
  useSceneLabels("api-call", labels, `${Math.round((ms ?? -1) / 20)}:${stage}:${JSON.stringify(cfg)}`);

  return (
    <group>
      <Stage size={[36, 22]} />
      {NODES.map((n) => (
        <Node
          key={n.id}
          position={n.pos}
          size={n.size}
          active={stage === n.id || (n.id === "model" && ms !== null && ms > tl.modelStart && ms < tl.modelStart + (r.hops.find((h) => h.id === "model")?.ms ?? 0))}
          tint={n.id === "gateway" && failedAtGateway && reached("gateway") ? lc.bad : n.id === "model" ? lc.accentSoft : undefined}
          explain={n.id}
        />
      ))}
      {/* GPU blocks inside the model */}
      {[-1.2, 0, 1.2].map((dx) => (
        <Box key={dx} position={[10.5 + dx, 3.5, 0]} size={[0.8, 0.6, 3]} color={lc.lavender} explain="gpu" />
      ))}
      <CurveTube points={FORWARD.map((p) => [p[0], 0.9, p[2]] as Vec3)} radius={0.12} color={lc.edge} explain="request-path" />
      <CurveTube points={RETURN.map((p) => [p[0], 0.5, p[2]] as Vec3)} radius={0.12} color={cfg.streaming ? lc.goodSoft : lc.edge} explain="return-path" />
      <mesh ref={packet}>
        <boxGeometry args={[0.9, 0.6, 0.6]} />
        <meshStandardMaterial color={failedAtGateway ? lc.bad : lc.accent} emissive={failedAtGateway ? lc.bad : lc.accent} emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <instancedMesh ref={stream} args={[undefined, undefined, 64]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color={lc.good} emissive={lc.mint} emissiveIntensity={1.6} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

export function ApiCallControls() {
  const { cfg, set, send, startedAt } = useApiCall();
  const tl = useTimeline(cfg);
  const r = tl.result;
  const ms = callClock(startedAt, tl);
  useTicker(startedAt !== null && (ms ?? 0) < r.totalMs + 300, 60);
  const arrived = ms === null ? 0 : arrivedTokens(ms, tl, cfg.streaming);
  const words = r.answer.split(" ");
  const shownWords = r.outputTokens ? words.slice(0, Math.round((words.length * arrived) / r.outputTokens)) : [];
  return (
    <div className="lc">
      <div className="lc__toggles">
        <Toggle id="api-stream" label="Streaming" checked={cfg.streaming} onChange={(v) => set({ streaming: v })} />
        <Toggle id="api-key" label="Valid API key" checked={cfg.validKey} onChange={(v) => set({ validKey: v })} />
        <Toggle id="api-429" label="Over rate limit" checked={cfg.rateLimited} onChange={(v) => set({ rateLimited: v })} />
      </div>
      <Slider id="api-max" label="max_tokens" value={cfg.maxTokens} min={8} max={256} step={8} onChange={(v) => set({ maxTokens: v })} />
      <Slider id="api-prompt" label="Prompt length" value={cfg.promptTokens} min={100} max={8000} step={100} format={(v) => `${v} tokens`} onChange={(v) => set({ promptTokens: v })} />
      <button className="btn btn--primary" onClick={send}>
        Send request
      </button>
      <div className="lc__answer" aria-live="polite">
        {ms === null ? (
          <span style={{ color: "var(--ink-faint)" }}>The answer appears here.</span>
        ) : r.status !== 200 ? (
          ms >= r.totalMs ? (
            <span style={{ color: "var(--error)" }}>
              HTTP {r.status}. {r.status === 401 ? "Check the API key." : "Wait for retry-after, then try again."}
            </span>
          ) : (
            <span style={{ color: "var(--ink-faint)" }}>Waiting…</span>
          )
        ) : (
          <>
            {shownWords.join(" ")}
            {arrived < r.outputTokens && <span className="caret" />}
            {arrived >= r.outputTokens && r.stopReason === "max_tokens" && <strong style={{ color: "var(--warning)" }}> [cut off: max_tokens]</strong>}
          </>
        )}
      </div>
      <div className="lc__metrics">
        <Metric label="First words" value={r.firstWordsMs ? `${r.firstWordsMs} ms` : "–"} tone={r.firstWordsMs && r.firstWordsMs < 700 ? "good" : undefined} />
        <Metric label="Total" value={`${r.totalMs} ms`} />
        <Metric label="Tokens in / out" value={`${r.inputTokens} / ${r.outputTokens}`} />
        <Metric label="Cost (example prices)" value={`$${r.costUsd.toFixed(5)}`} />
      </div>
      <details>
        <summary>Request the app sends</summary>
        <pre className="lc__code">{requestJson(cfg)}</pre>
      </details>
      <details>
        <summary>What happens at each hop</summary>
        <ul className="lc__notes">
          {r.hops.map((h, i) => (
            <li key={i}>
              <strong>{h.label}</strong> ({h.ms} ms): {h.detail}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
