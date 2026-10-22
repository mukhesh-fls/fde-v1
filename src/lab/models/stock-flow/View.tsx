import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, InstancedMesh } from "three";
import { Object3D } from "three";
import { create } from "zustand";
import { useSceneLabels } from "../../labels";
import { Box, elapsed, lc, mixColor, Stage, Tube } from "../../primitives";
import { useLab } from "../../store";
import { Metric, Slider } from "../../ui/controls";
import { useTicker } from "../../useTicker";
import { overflowTurn, simulateStock, STOCK_DEFAULTS, type StockConfig } from "./logic";

type S = { cfg: StockConfig; startedAt: number | null; set: (p: Partial<StockConfig>) => void; play: () => void };
export const useStock = create<S>((set) => ({
  cfg: STOCK_DEFAULTS,
  startedAt: null,
  set: (p) => set((s) => ({ cfg: { ...s.cfg, ...p }, startedAt: null })),
  play: () => set({ startedAt: performance.now() }),
}));

const TURN_SECONDS = 0.35;
const TANK = { w: 6, h: 10, d: 6 };

function useCurrentTurn() {
  const { cfg, startedAt } = useStock();
  const turns = useMemo(() => simulateStock(cfg), [cfg]);
  const e = elapsed(startedAt);
  const i = e === null ? turns.length - 1 : Math.min(turns.length - 1, Math.floor(e / TURN_SECONDS));
  return { turns, current: turns[i], playing: e !== null && e < turns.length * TURN_SECONDS };
}

export function StockFlowView() {
  const { cfg, startedAt } = useStock();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const { current, playing } = useCurrentTurn();
  useTicker(startedAt !== null && playing);
  const liquid = useRef<Group>(null);
  const inDrops = useRef<InstancedMesh>(null);
  const outDrops = useRef<InstancedMesh>(null);
  const spill = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useEffect(() => {
    setStagePoints({ stock: [0, 0, 4], inflow: [-8, 0, 2], outflow: [8, 0, 2], limit: [0, 0, 4] });
  }, [setStagePoints]);

  const fill = current.level / cfg.capacity;
  const over = current.overflow > 0;
  const color = over ? lc.bad : fill > 0.6 ? mixColor(lc.accentSoft, lc.warn, (fill - 0.6) / 0.4) : lc.accentSoft;

  useFrame(({ clock }) => {
    if (liquid.current) {
      const target = Math.max(0.02, fill);
      liquid.current.scale.y += (target - liquid.current.scale.y) * 0.15;
    }
    const t = clock.elapsedTime;
    // Drops flowing in from the left pipe and out of the right pipe, at a rate set by the sliders.
    const drops = (mesh: InstancedMesh | null, rate: number, path: (u: number) => [number, number, number]) => {
      if (!mesh) return;
      const n = mesh.count;
      const active = Math.round((rate / 20000) * n);
      for (let i = 0; i < n; i++) {
        const u = (t * 0.6 + i / n) % 1;
        if (i < active) dummy.position.set(...path(u));
        else dummy.position.set(0, -50, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    drops(inDrops.current, cfg.added, (u) => [-11 + u * 7.5, TANK.h + 1.5 - Math.max(0, u - 0.8) * 8, 0]);
    drops(outDrops.current, cfg.removed, (u) => [TANK.w / 2 + 0.5 + u * 7, 0.6 - u * 0.2, 0]);
    drops(spill.current, over ? 20000 : 0, (u) => [TANK.w / 2 + 0.2, TANK.h - u * TANK.h, (u * 7) % 2 - 1]);
  });

  useSceneLabels(
    "stock-flow",
    [
      { id: "tank", world: [0, TANK.h + 1.4, 0], text: "Context window (the stock)", sub: `${Math.round(current.level / 1000)}k of ${cfg.capacity / 1000}k tokens`, tone: stage === "stock" ? "accent" : "default", size: "md" },
      { id: "in", world: [-9, TANK.h + 3, 0], text: "Inflow", sub: `+${cfg.added / 1000}k per turn`, tone: stage === "inflow" ? "accent" : "default" },
      { id: "out", world: [10, 2, 0], text: "Outflow", sub: `−${cfg.removed / 1000}k per turn`, tone: stage === "outflow" ? "accent" : "default" },
      { id: "limit", world: [-TANK.w / 2 - 2.2, TANK.h, 0], text: "Limit", tone: stage === "limit" || over ? "bad" : "muted", size: "sm" },
      { id: "sixty", world: [-TANK.w / 2 - 2.2, TANK.h * 0.6, 0], text: "60%: quality starts to drop", tone: "muted", size: "sm" },
      { id: "turn", world: [0, -0.2, TANK.d / 2 + 2], text: `Turn ${current.turn}`, sub: over ? "Overflowing: old content is cut" : `Answer quality ${Math.round(current.quality * 100)}%`, tone: over ? "bad" : current.quality < 1 ? "warn" : "good" },
    ],
    `${current.turn}:${stage}:${cfg.added}:${cfg.removed}`,
  );

  return (
    <group>
      <Stage size={[30, 18]} />
      {/* Tank */}
      <Box position={[0, TANK.h / 2, 0]} size={[TANK.w, TANK.h, TANK.d]} color="#9FB7DA" opacity={0.14} explain="tank" />
      <group ref={liquid} position={[0, 0, 0]} scale={[1, 0.02, 1]}>
        <Box position={[0, TANK.h / 2, 0]} size={[TANK.w - 0.3, TANK.h, TANK.d - 0.3]} color={color} opacity={0.85} />
      </group>
      <Box position={[0, TANK.h, 0]} size={[TANK.w + 0.6, 0.1, TANK.d + 0.6]} color={lc.bad} radius={0.04} explain="limit" />
      <Box position={[0, TANK.h * 0.6, 0]} size={[TANK.w + 0.4, 0.08, TANK.d + 0.4]} color={lc.warn} radius={0.03} explain="sixty" />
      {/* Pipes */}
      <Tube from={[-11, TANK.h + 1.5, 0]} to={[-2.5, TANK.h + 1.5, 0]} radius={0.35} color={stage === "inflow" ? lc.accent : lc.edge} explain="inflow" />
      <Tube from={[TANK.w / 2, 0.6, 0]} to={[TANK.w / 2 + 7.5, 0.4, 0]} radius={0.35} color={stage === "outflow" ? lc.accent : lc.edge} explain="outflow" />
      <instancedMesh ref={inDrops} args={[undefined, undefined, 24]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color={lc.teal} />
      </instancedMesh>
      <instancedMesh ref={outDrops} args={[undefined, undefined, 24]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color={lc.accent} />
      </instancedMesh>
      <instancedMesh ref={spill} args={[undefined, undefined, 16]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color={lc.bad} />
      </instancedMesh>
    </group>
  );
}

export function StockFlowControls() {
  const { cfg, set, play, startedAt } = useStock();
  const { turns, current, playing } = useCurrentTurn();
  useTicker(startedAt !== null && playing);
  const overflow = overflowTurn(turns);
  return (
    <div className="lc">
      <Slider id="sf-in" label="Added per turn" value={cfg.added} min={1000} max={20000} step={500} format={(v) => `${(v / 1000).toFixed(1)}k tokens`} onChange={(v) => set({ added: v })} />
      <Slider id="sf-out" label="Removed per turn" value={cfg.removed} min={0} max={20000} step={500} format={(v) => `${(v / 1000).toFixed(1)}k tokens`} onChange={(v) => set({ removed: v })} />
      <Slider id="sf-turns" label="Turns" value={cfg.turns} min={1} max={40} step={1} onChange={(v) => set({ turns: v })} />
      <button className="btn btn--primary" onClick={play}>
        Play
      </button>
      <div className="lc__metrics">
        <Metric label="Turn" value={String(current.turn)} />
        <Metric label="In the window" value={`${Math.round(current.level / 1000)}k`} />
        <Metric label="Overflows at" value={overflow ? `Turn ${overflow}` : "Never"} tone={overflow ? "bad" : "good"} />
        <Metric label="Answer quality" value={`${Math.round(current.quality * 100)}%`} tone={current.quality >= 1 ? "good" : current.quality > 0.6 ? "warn" : "bad"} />
      </div>
    </div>
  );
}
