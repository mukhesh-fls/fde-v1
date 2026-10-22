import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { InstancedMesh } from "three";
import { Color, Object3D } from "three";
import { create } from "zustand";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useSceneLabels } from "../../labels";
import { along, elapsed, lc, Node, Stage, Tube } from "../../primitives";
import { useLab } from "../../store";
import { Metric, Slider } from "../../ui/controls";
import { useTicker } from "../../useTicker";
import { MODELS, ROUTING_DEFAULTS, runRouting, type RoutingConfig, type RoutingMode } from "./logic";

type S = { cfg: RoutingConfig; startedAt: number | null; set: (p: Partial<RoutingConfig>) => void; run: () => void };
export const useRouting = create<S>((set) => ({
  cfg: ROUTING_DEFAULTS,
  startedAt: null,
  set: (p) => set((s) => ({ cfg: { ...s.cfg, ...p }, startedAt: null })),
  run: () => set({ startedAt: performance.now() }),
}));

const SPAWN = 0.14;
const PT = { in: [-14, 1.2, 0] as Vec3, router: [-6, 1.2, 0] as Vec3, small: [3, 1.2, -5] as Vec3, large: [3, 1.2, 5] as Vec3, done: [12, 1.2, 0] as Vec3 };
const MODE_LABEL: Record<RoutingMode, string> = { "all-large": "All to large model", "all-small": "All to small model", routed: "Route by difficulty" };

export function RoutingView() {
  const { cfg, startedAt } = useRouting();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const result = useMemo(() => runRouting(cfg), [cfg]);
  const cubes = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const timing = useMemo(
    () => result.requests.map((q) => ({ legs: [0.5, 0.4, MODELS[q.model].latency * 0.5, 0.4] })),
    [result],
  );
  useTicker(startedAt !== null && (elapsed(startedAt) ?? 0) < result.requests.length * SPAWN + 3);
  const e = elapsed(startedAt);
  const doneCount = e === null ? 0 : result.requests.filter((_, i) => e > i * SPAWN + timing[i].legs.reduce((a, b) => a + b, 0)).length;

  useEffect(() => {
    setStagePoints({ router: [-6, 0, 3], "small-model": [3, 0, -2], "large-model": [3, 0, 8], "trade-off": [12, 0, 3] });
  }, [setStagePoints]);

  useFrame(() => {
    const m = cubes.current;
    if (!m) return;
    const now = elapsed(useRouting.getState().startedAt);
    result.requests.forEach((q, i) => {
      const model = q.model === "small" ? PT.small : PT.large;
      const pts: Vec3[] = [PT.in, PT.router, model, [model[0] + 2, model[1], model[2]], PT.done];
      const legs = timing[i].legs;
      const total = legs.reduce((a, b) => a + b, 0);
      let pos: Vec3 = [0, -50, 0];
      let done = false;
      if (now !== null) {
        const local = now - i * SPAWN;
        if (local >= 0) {
          // Walk the legs at their own speeds: the large model takes longer to pass through.
          let acc = 0;
          let u = 1;
          for (let k = 0; k < legs.length; k++) {
            if (local < acc + legs[k]) {
              u = (k + (local - acc) / legs[k]) / legs.length;
              break;
            }
            acc += legs[k];
          }
          done = local >= total;
          pos = along(pts, u);
          if (done) pos = [PT.done[0] - 1.6 + (i % 8) * 0.45, 0.3 + Math.floor(i / 16) * 0.4, PT.done[2] - 1.2 + (Math.floor(i / 8) % 2) * 2.4 + ((i * 7) % 3) * 0.3];
        }
      }
      const size = 0.35 + q.difficulty * 0.55;
      dummy.position.set(...pos);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, new Color(done ? (q.correct ? lc.mint : lc.bad) : q.difficulty >= cfg.threshold ? lc.lavender : lc.sky));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  const smallN = result.requests.filter((q) => q.model === "small").length;
  useSceneLabels(
    "routing",
    [
      { id: "in", world: [PT.in[0], 2.6, 0], text: "Requests", sub: "bigger cube = harder task" },
      { id: "router", world: [PT.router[0], 3.2, 0], text: "Router", sub: MODE_LABEL[cfg.mode], tone: stage === "router" ? "accent" : "default" },
      { id: "small", world: [PT.small[0], 3.4, PT.small[2]], text: "Small model", sub: `${smallN} requests · fast, cheap`, tone: stage === "small-model" ? "accent" : "default" },
      { id: "large", world: [PT.large[0], 4.6, PT.large[2]], text: "Large model", sub: `${result.requests.length - smallN} requests · slower, 15× the cost`, tone: stage === "large-model" ? "accent" : "default" },
      { id: "done", world: [PT.done[0], 3, 0], text: "Answers", sub: doneCount ? `${doneCount} done · green right, red wrong` : undefined, tone: stage === "trade-off" ? "accent" : "default" },
    ],
    `${doneCount}:${stage}:${JSON.stringify(cfg)}`,
  );

  return (
    <group>
      <Stage size={[34, 22]} />
      <Tube from={[PT.in[0], 0.3, 0]} to={[PT.router[0], 0.3, 0]} radius={0.1} />
      <Tube from={[PT.router[0], 0.3, 0]} to={[PT.small[0], 0.3, PT.small[2]]} radius={0.1} color={cfg.mode === "all-large" ? lc.dim : lc.edge} />
      <Tube from={[PT.router[0], 0.3, 0]} to={[PT.large[0], 0.3, PT.large[2]]} radius={0.1} color={cfg.mode === "all-small" ? lc.dim : lc.edge} />
      <Tube from={[PT.small[0] + 2, 0.3, PT.small[2]]} to={[PT.done[0], 0.3, 0]} radius={0.1} />
      <Tube from={[PT.large[0] + 2, 0.3, PT.large[2]]} to={[PT.done[0], 0.3, 0]} radius={0.1} />
      <Node position={[PT.in[0], 0, 0]} size={[2.4, 0.5, 2.4]} explain="requests" />
      <group position={[PT.router[0], 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <Node position={[0, 0, 0]} size={[2.4, 1.6, 2.4]} active={stage === "router"} tint={lc.accent} explain="router" />
      </group>
      <Node position={[PT.small[0], 0, PT.small[2]]} size={[2.6, 1.2, 2.2]} active={stage === "small-model"} tint={lc.mint} explain="small" />
      <Node position={[PT.large[0], 0, PT.large[2]]} size={[4, 3, 3.4]} active={stage === "large-model"} tint={lc.lavender} explain="large" />
      <Node position={[PT.done[0], 0, 0]} size={[4.4, 0.25, 5]} active={stage === "trade-off"} explain="answers" />
      <instancedMesh ref={cubes} args={[undefined, undefined, result.requests.length]} key={result.requests.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.25} />
      </instancedMesh>
    </group>
  );
}

export function RoutingControls() {
  const { cfg, set, run, startedAt } = useRouting();
  const result = useMemo(() => runRouting(cfg), [cfg]);
  const large = useMemo(() => runRouting({ ...cfg, mode: "all-large" }), [cfg]);
  return (
    <div className="lc">
      <label className="lc__field" htmlFor="rt-mode">
        <span>Routing</span>
        <select id="rt-mode" value={cfg.mode} onChange={(e) => set({ mode: e.target.value as RoutingMode })}>
          <option value="all-large">All to large model</option>
          <option value="all-small">All to small model</option>
          <option value="routed">Route by difficulty</option>
        </select>
      </label>
      <Slider id="rt-th" label="Difficulty threshold" value={cfg.threshold} min={0.1} max={0.9} step={0.05} format={(v) => `harder than ${Math.round(v * 100)}% → large`} onChange={(v) => set({ threshold: v })} />
      <button className="btn btn--primary" onClick={run}>
        Run 40 requests
      </button>
      <div className="lc__metrics">
        <Metric label="Total cost (units)" value={startedAt === null ? "–" : String(result.cost)} tone={startedAt !== null && result.cost < large.cost * 0.5 ? "good" : undefined} />
        <Metric label="Avg latency" value={startedAt === null ? "–" : `${result.avgLatency.toFixed(1)} s`} />
        <Metric label="Accuracy" value={startedAt === null ? "–" : `${Math.round(result.accuracy * 100)}%`} tone={startedAt === null ? undefined : result.accuracy >= 0.9 ? "good" : result.accuracy >= 0.8 ? "warn" : "bad"} />
        <Metric label="Large-only cost" value={String(large.cost)} />
      </div>
    </div>
  );
}
