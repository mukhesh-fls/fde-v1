import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { InstancedMesh } from "three";
import { Color, Object3D } from "three";
import { create } from "zustand";
import { useSceneLabels } from "../../labels";
import { Box, CurveTube, elapsed, lc, Node, Stage, Tube } from "../../primitives";
import { useLab } from "../../store";
import { Metric, Slider, Toggle } from "../../ui/controls";
import { useTicker } from "../../useTicker";
import { FEEDBACK_DEFAULTS, simulateFeedback, type FeedbackConfig } from "./logic";

type S = { cfg: FeedbackConfig; startedAt: number | null; set: (p: Partial<FeedbackConfig>) => void; run: () => void };
export const useFeedback = create<S>((set) => ({
  cfg: FEEDBACK_DEFAULTS,
  startedAt: null,
  set: (p) => set((s) => ({ cfg: { ...s.cfg, ...p }, startedAt: null })),
  run: () => set({ startedAt: performance.now() }),
}));

const TICK_SECONDS = 0.28;
const CLIENTS_X = -12;
const PROVIDER_X = 8;
const CHART = { x0: -12, z: -7, w: 24, h: 8 };

function usePlayback() {
  const { cfg, startedAt } = useFeedback();
  const result = useMemo(() => simulateFeedback(cfg), [cfg]);
  const e = elapsed(startedAt);
  const i = e === null ? -1 : Math.min(result.ticks.length - 1, Math.floor(e / TICK_SECONDS));
  return { result, i, playing: e !== null && e < result.ticks.length * TICK_SECONDS };
}

export function FeedbackLoopsView() {
  const { cfg, startedAt } = useFeedback();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const { result, i, playing } = usePlayback();
  useTicker(startedAt !== null && playing);
  const bars = useRef<InstancedMesh>(null);
  const flow = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const maxLoad = Math.max(cfg.clients * 2.5, ...result.ticks.map((t) => t.load));
  const tick = i >= 0 ? result.ticks[i] : null;
  const stormOn = cfg.retries > 0 && !cfg.backoff && !cfg.budget;
  const brakeOn = cfg.backoff || cfg.budget;

  useEffect(() => {
    setStagePoints({ request: [-2, 0, 4], failure: [PROVIDER_X, 0, 4], "retry-storm": [0, 0, -1], brake: [0, 0, 6] });
  }, [setStagePoints]);

  // The load chart: one bar per second; red where load exceeded what the provider could serve.
  useEffect(() => {
    const m = bars.current;
    if (!m) return;
    const w = CHART.w / result.ticks.length;
    result.ticks.forEach((t, k) => {
      const shown = k <= i;
      const h = shown ? Math.max(0.05, (t.load / maxLoad) * CHART.h) : 0.02;
      dummy.position.set(CHART.x0 + w * (k + 0.5), h / 2, CHART.z);
      dummy.scale.set(w * 0.8, h, 0.8);
      dummy.updateMatrix();
      m.setMatrixAt(k, dummy.matrix);
      m.setColorAt(k, new Color(t.load > t.capacity ? lc.bad : lc.accentSoft));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [i, result, maxLoad, dummy]);

  // Request dots flowing from clients to the provider; failed ones arc back as retries.
  useFrame(({ clock }) => {
    const m = flow.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const cur = tick ?? { load: cfg.clients, failed: 0, served: cfg.clients };
    const n = m.count;
    const failShare = cur.load ? cur.failed / cur.load : 0;
    for (let k = 0; k < n; k++) {
      const u = (t * 0.5 + k / n) % 1;
      const fail = k / n < failShare;
      if (!fail) dummy.position.set(CLIENTS_X + 2 + u * (PROVIDER_X - CLIENTS_X - 3), 1.2, 3 + Math.sin(k * 7) * 1.2);
      else {
        // Up and back over the top: the retry loop.
        const a = u * Math.PI;
        dummy.position.set(PROVIDER_X - 1 - u * (PROVIDER_X - CLIENTS_X - 3), 1.2 + Math.sin(a) * 4, 2 + Math.sin(k * 5) * 0.8);
      }
      dummy.scale.setScalar(startedAt === null && !fail ? 0.6 : 1);
      dummy.updateMatrix();
      m.setMatrixAt(k, dummy.matrix);
      m.setColorAt(k, new Color(fail ? lc.bad : lc.accent));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  const capY = (cfg.capacity / maxLoad) * CHART.h;
  const slowY = (Math.round(cfg.capacity * 0.5) / maxLoad) * CHART.h;
  const rows = Math.ceil(cfg.clients / 8);

  useSceneLabels(
    "feedback-loops",
    [
      { id: "clients", world: [CLIENTS_X, 3.4, 3], text: `${cfg.clients} clients`, sub: "1 request per second each", tone: stage === "request" ? "accent" : "default" },
      { id: "provider", world: [PROVIDER_X, 6.6, 3], text: "Model provider", sub: tick ? `serving ${tick.served} of ${tick.load} this second` : `capacity ${cfg.capacity}/s`, tone: stage === "failure" ? "accent" : tick && tick.failed > 0 ? "bad" : "default" },
      { id: "storm", world: [-2, 6.8, 2], text: stormOn ? "Reinforcing loop: retry storm" : cfg.retries === 0 ? "No retries" : "Retries, spread out", tone: stage === "retry-storm" ? "accent" : stormOn ? "bad" : "muted" },
      { id: "brake", world: [-2, -0.2, 7], text: brakeOn ? "Balancing loop: the brake" : "No brake", sub: [cfg.backoff && "backoff with jitter", cfg.budget && "retry budget"].filter(Boolean).join(" + ") || undefined, tone: stage === "brake" ? "accent" : brakeOn ? "good" : "muted" },
      { id: "chart", world: [CHART.x0 + CHART.w / 2, CHART.h + 1.5, CHART.z], text: "Load on the provider, per second", sub: tick ? `second ${tick.t + 1}: ${tick.load} requests (${tick.retries} retries)` : "Press Run", size: "md" },
      { id: "cap", world: [CHART.x0 + CHART.w + 2.4, capY, CHART.z], text: "Capacity", size: "sm", tone: "muted" },
      ...(cfg.slowdown ? [{ id: "slow", world: [CHART.x0 + CHART.w + 2.4, slowY, CHART.z] as [number, number, number], text: "During the slowdown", size: "sm" as const, tone: "warn" as const }] : []),
    ],
    `${i}:${stage}:${JSON.stringify(cfg)}`,
  );

  return (
    <group>
      <Stage size={[34, 24]} />
      {/* Clients */}
      {Array.from({ length: cfg.clients }, (_, k) => (
        <Box key={k} position={[CLIENTS_X - 1.5 + (k % 8) * 0.45, 0.25 + Math.floor(k / 8) * 0.0, 1 + Math.floor(k / 8) * 0.55]} size={[0.32, 0.5, 0.32]} color={stage === "request" ? lc.accentSoft : lc.nodeAlt} />
      ))}
      <Box position={[CLIENTS_X + 0.1, 0.05, 1 + (rows - 1) * 0.27]} size={[4.4, 0.1, rows * 0.55 + 0.6]} color={lc.dim} explain="clients" />
      {/* Provider tower */}
      <Node position={[PROVIDER_X, 0, 3]} size={[3, 5.4, 3]} active={stage === "failure"} tint={tick && tick.failed > 0 ? lc.bad : lc.accentSoft} explain="provider" />
      <Tube from={[CLIENTS_X + 2, 1.2, 3]} to={[PROVIDER_X - 1.5, 1.2, 3]} radius={0.08} />
      {cfg.retries > 0 && <CurveTube points={[[PROVIDER_X - 1.5, 1.2, 2], [CLIENTS_X + 2, 1.2, 2]]} arcHeight={8} radius={0.12} color={stormOn ? lc.bad : lc.warn} opacity={0.8} glow={stormOn ? 0.9 : 0.3} explain="storm" />}
      {brakeOn && <CurveTube points={[[PROVIDER_X - 1.5, 0.3, 5.5], [CLIENTS_X + 2, 0.3, 5.5]]} arcHeight={-0.01} radius={0.14} color={lc.good} opacity={0.85} glow={0.6} explain="brake" />}
      <instancedMesh ref={flow} args={[undefined, undefined, 40]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshPhysicalMaterial roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.25} />
      </instancedMesh>
      {/* Load chart */}
      <instancedMesh ref={bars} args={[undefined, undefined, result.ticks.length]} key={result.ticks.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.25} />
      </instancedMesh>
      <Box position={[CHART.x0 + CHART.w / 2, capY, CHART.z]} size={[CHART.w + 0.6, 0.08, 1]} color={lc.ink} radius={0.03} explain="capacity" />
      {cfg.slowdown && <Box position={[CHART.x0 + (CHART.w * 10) / 30, slowY, CHART.z]} size={[(CHART.w * 10) / 30, 0.06, 1.05]} color={lc.warn} />}
    </group>
  );
}

export function FeedbackLoopsControls() {
  const { cfg, set, run, startedAt } = useFeedback();
  const { result, playing } = usePlayback();
  useTicker(startedAt !== null && playing);
  return (
    <div className="lc">
      <Slider id="fb-clients" label="Clients" value={cfg.clients} min={10} max={48} step={2} onChange={(v) => set({ clients: v })} />
      <Slider id="fb-retries" label="Retries per failure" value={cfg.retries} min={0} max={4} step={1} onChange={(v) => set({ retries: v })} />
      <div className="lc__toggles">
        <Toggle id="fb-backoff" label="Backoff with jitter" checked={cfg.backoff} onChange={(v) => set({ backoff: v })} />
        <Toggle id="fb-budget" label="Retry budget" checked={cfg.budget} onChange={(v) => set({ budget: v })} />
        <Toggle id="fb-slow" label="Provider slowdown" checked={cfg.slowdown} onChange={(v) => set({ slowdown: v })} />
      </div>
      <button className="btn btn--primary" onClick={run}>
        Run
      </button>
      <div className="lc__metrics">
        <Metric label="Peak load" value={`${result.peakLoad}/s`} tone={result.peakLoad > cfg.clients * 1.5 ? "bad" : "good"} />
        <Metric label="Requests served" value={`${Math.round(result.servedPct * 100)}%`} tone={result.servedPct > 0.9 ? "good" : result.servedPct > 0.75 ? "warn" : "bad"} />
        <Metric label="Gave up" value={String(result.gaveUp)} />
      </div>
    </div>
  );
}
