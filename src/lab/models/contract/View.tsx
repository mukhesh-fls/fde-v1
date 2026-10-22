import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { InstancedMesh } from "three";
import { Color, Object3D } from "three";
import { create } from "zustand";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useSceneLabels, type LabLabel } from "../../labels";
import { along, Box, elapsed, lc, Node, Stage, Tube } from "../../primitives";
import { useLab } from "../../store";
import { Metric, Slider, Toggle } from "../../ui/controls";
import { useTicker } from "../../useTicker";
import { CONTRACT_DEFAULTS, runContract, type ContractConfig, type ContractRequest, type Outcome } from "./logic";

type S = { cfg: ContractConfig; startedAt: number | null; set: (p: Partial<ContractConfig>) => void; run: () => void };
export const useContract = create<S>((set) => ({
  cfg: CONTRACT_DEFAULTS,
  startedAt: null,
  set: (p) => set((s) => ({ cfg: { ...s.cfg, ...p }, startedAt: null })),
  run: () => set({ startedAt: performance.now() }),
}));

const SPAWN = 0.12;
const SEG = 0.32;
const PT = {
  in: [-15, 1.4, 0] as Vec3,
  model: [-8, 1.4, 0] as Vec3,
  gate: [0, 1.4, 0] as Vec3,
  users: [11, 1.4, 0] as Vec3,
  retry: [-2, 1.4, 6] as Vec3,
  fallback: [6, 1.4, 7] as Vec3,
  person: [12, 1.4, 7] as Vec3,
};

/** The path each request's cube takes, from its outcome. Red until it passes validation. */
function pathFor(q: ContractRequest, cfg: ContractConfig): { pts: Vec3[]; greenFrom: number } {
  const base = [PT.in, PT.model, PT.gate];
  switch (q.outcome) {
    case "valid":
      return { pts: [...base, PT.users], greenFrom: 0 };
    case "bad-to-user":
      return { pts: [...base, PT.users], greenFrom: 99 };
    case "valid-after-retry":
      return { pts: [...base, PT.retry, PT.model, PT.gate, PT.users], greenFrom: 5 };
    case "fallback":
      return { pts: cfg.retry ? [...base, PT.retry, PT.model, PT.gate, PT.fallback] : [...base, PT.fallback], greenFrom: 99 };
    case "person":
      return { pts: cfg.retry ? [...base, PT.retry, PT.model, PT.gate, PT.person] : [...base, PT.person], greenFrom: 99 };
  }
}

export function useContractRun() {
  const cfg = useContract((s) => s.cfg);
  return useMemo(() => runContract(cfg), [cfg]);
}

/** Counts of requests that have reached each destination by now. */
function arrivedCounts(reqs: ContractRequest[], cfg: ContractConfig, startedAt: number | null) {
  const e = elapsed(startedAt);
  const c: Record<Outcome, number> = { valid: 0, "valid-after-retry": 0, fallback: 0, person: 0, "bad-to-user": 0 };
  if (e === null) return c;
  reqs.forEach((q, i) => {
    const { pts } = pathFor(q, cfg);
    if (e >= i * SPAWN + (pts.length - 1) * SEG) c[q.outcome]++;
  });
  return c;
}

export function ContractView() {
  const { cfg, startedAt } = useContract();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const run = useContractRun();
  const cubes = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const paths = useMemo(() => run.requests.map((q) => pathFor(q, cfg)), [run, cfg]);
  const totalSeconds = run.requests.length * SPAWN + 9 * SEG;
  useTicker(startedAt !== null && (elapsed(startedAt) ?? 0) < totalSeconds);
  const counts = arrivedCounts(run.requests, cfg, startedAt);

  useEffect(() => {
    setStagePoints({ request: [-15, 0, 3], output: [-8, 0, 3], validate: [0, 0, 3], retry: [-2, 0, 9], fallback: [6, 0, 10], person: [12, 0, 10] });
  }, [setStagePoints]);

  useFrame(() => {
    const m = cubes.current;
    if (!m) return;
    const e = elapsed(useContract.getState().startedAt);
    run.requests.forEach((_, i) => {
      const { pts, greenFrom } = paths[i];
      let pos: Vec3 = [0, -50, 0];
      let green = false;
      if (e !== null) {
        const local = e - i * SPAWN;
        const dur = (pts.length - 1) * SEG;
        if (local >= 0) {
          const u = Math.min(1, local / dur);
          pos = along(pts, u);
          const seg = Math.floor(local / SEG);
          // Valid outputs are green from the moment they leave the model; rescued ones turn green after the retry.
          green = greenFrom === 0 ? seg >= 1 : seg >= greenFrom;
          if (u >= 1) pos = [pos[0] + ((i * 37) % 9) * 0.25 - 1, 0.35 + Math.floor(((i * 37) % 27) / 9) * 0.32, pos[2] + ((i * 11) % 7) * 0.3 - 0.9];
        }
      }
      dummy.position.set(...pos);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, new Color(green ? lc.good : lc.bad));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  const labels: LabLabel[] = [
    { id: "in", world: [PT.in[0], 2.6, 0], text: "Requests", tone: stage === "request" ? "accent" : "default" },
    { id: "model", world: [PT.model[0], 3.4, 0], text: "Model", sub: `${Math.round(cfg.reliability * 100)}% valid JSON`, tone: stage === "output" ? "accent" : "default" },
    { id: "gate", world: [PT.gate[0], 4.4, 0], text: cfg.validate ? "Validator: checks the schema" : "No validation", tone: stage === "validate" ? "accent" : cfg.validate ? "default" : "muted" },
    { id: "users", world: [PT.users[0], 3.2, 0], text: "Users", sub: `${counts.valid + counts["valid-after-retry"]} good · ${counts["bad-to-user"]} broken`, tone: counts["bad-to-user"] > 0 ? "bad" : "good" },
  ];
  if (cfg.validate) {
    labels.push({ id: "retry", world: [PT.retry[0], 2.8, PT.retry[2]], text: cfg.retry ? "Retry once, with the error" : "No retry", sub: cfg.retry ? `${counts["valid-after-retry"]} rescued` : undefined, tone: stage === "retry" ? "accent" : cfg.retry ? "default" : "muted" });
    labels.push({ id: "fallback", world: [PT.fallback[0], 2.8, PT.fallback[2]], text: cfg.fallback ? "Fallback reply" : "No fallback", sub: cfg.fallback ? String(counts.fallback) : undefined, tone: stage === "fallback" ? "accent" : cfg.fallback ? "default" : "muted" });
    labels.push({ id: "person", world: [PT.person[0], 2.8, PT.person[2]], text: "A person", sub: String(counts.person), tone: stage === "person" ? "accent" : "default" });
  }
  useSceneLabels("contract", labels, `${JSON.stringify(counts)}:${stage}:${JSON.stringify(cfg)}`);

  return (
    <group>
      <Stage size={[36, 22]} />
      <Tube from={[PT.in[0], 0.3, 0]} to={[PT.users[0], 0.3, 0]} radius={0.16} explain="conveyor" />
      <Node position={[PT.in[0], 0, 0]} size={[2.4, 0.6, 2.4]} active={stage === "request"} explain="requests" />
      <Node position={[PT.model[0], 0, 0]} size={[3.2, 2, 2.8]} active={stage === "output"} tint={lc.accentSoft} explain="model" />
      {/* The validator gate: an arch the outputs pass through */}
      <group position={[PT.gate[0], 0, 0]}>
        {[-1.4, 1.4].map((z) => (
          <Box key={z} position={[0, 1.6, z]} size={[0.5, 3.2, 0.5]} color={cfg.validate ? (stage === "validate" ? lc.accent : lc.ink) : lc.dim} opacity={cfg.validate ? 1 : 0.5} explain="validator" />
        ))}
        <Box position={[0, 3.3, 0]} size={[0.6, 0.4, 3.4]} color={cfg.validate ? (stage === "validate" ? lc.accent : lc.ink) : lc.dim} opacity={cfg.validate ? 1 : 0.5} explain="validator" />
      </group>
      <Node position={[PT.users[0], 0, 0]} size={[4, 0.3, 3.4]} tint={counts["bad-to-user"] > 0 ? lc.bad : lc.good} explain="users" />
      {cfg.validate && (
        <>
          <Tube from={[PT.gate[0], 0.3, 0.5]} to={[PT.retry[0], 0.3, PT.retry[2]]} radius={0.07} color={cfg.retry ? lc.warn : lc.dim} />
          <Tube from={[PT.retry[0], 0.3, PT.retry[2]]} to={[PT.model[0], 0.3, 0.5]} radius={0.07} color={cfg.retry ? lc.warn : lc.dim} />
          <Tube from={[PT.gate[0], 0.3, 0.5]} to={[PT.fallback[0], 0.3, PT.fallback[2]]} radius={0.07} color={cfg.fallback ? lc.edge : lc.dim} />
          <Tube from={[PT.gate[0], 0.3, 0.5]} to={[PT.person[0], 0.3, PT.person[2]]} radius={0.07} color={lc.edge} />
          <Node position={[PT.retry[0], 0, PT.retry[2]]} size={[2.6, 1, 2]} active={stage === "retry"} dim={!cfg.retry} tint={lc.warn} explain="retry" />
          <Node position={[PT.fallback[0], 0, PT.fallback[2]]} size={[3, 0.3, 2.6]} active={stage === "fallback"} dim={!cfg.fallback} explain="fallback" />
          <Node position={[PT.person[0], 0, PT.person[2]]} size={[3, 0.3, 2.6]} active={stage === "person"} tint={lc.lavender} explain="person" />
        </>
      )}
      <instancedMesh ref={cubes} args={[undefined, undefined, run.requests.length]} key={run.requests.length}>
        <boxGeometry args={[0.5, 0.3, 0.5]} />
        <meshPhysicalMaterial roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.25} />
      </instancedMesh>
    </group>
  );
}

export function ContractControls() {
  const { cfg, set, run: start, startedAt } = useContract();
  const run = useContractRun();
  useTicker(startedAt !== null);
  const c = arrivedCounts(run.requests, cfg, startedAt);
  return (
    <div className="lc">
      <Slider id="ct-rel" label="Model reliability" value={cfg.reliability} min={0.5} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}% valid`} onChange={(v) => set({ reliability: v })} />
      <div className="lc__toggles">
        <Toggle id="ct-val" label="Validate output" checked={cfg.validate} onChange={(v) => set({ validate: v })} />
        <Toggle id="ct-retry" label="Retry once" checked={cfg.retry} onChange={(v) => set({ retry: v })} />
        <Toggle id="ct-fb" label="Fallback" checked={cfg.fallback} onChange={(v) => set({ fallback: v })} />
      </div>
      <button className="btn btn--primary" onClick={start}>
        Run 50 requests
      </button>
      <div className="lc__metrics">
        <Metric label="Good answers" value={String(c.valid + c["valid-after-retry"])} tone="good" />
        <Metric label="Broken output to users" value={String(c["bad-to-user"])} tone={c["bad-to-user"] ? "bad" : "good"} />
        <Metric label="Rescued by retry" value={String(c["valid-after-retry"])} />
        <Metric label="To a person" value={String(c.person)} tone={c.person ? "warn" : undefined} />
        <Metric label="Cost (units)" value={startedAt === null ? "–" : run.cost.toFixed(1)} />
      </div>
    </div>
  );
}
