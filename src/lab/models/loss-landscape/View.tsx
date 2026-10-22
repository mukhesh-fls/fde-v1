import { Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { BufferAttribute, Color, PlaneGeometry, Quaternion, Vector3 } from "three";
import { create } from "zustand";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useExplain, useModelId } from "../../explain";
import { useSceneLabels, type LabLabel } from "../../labels";
import { lc, Orb, Stage } from "../../primitives";
import { useLab } from "../../store";
import { Metric, Slider } from "../../ui/controls";
import { DOMAIN, GLOBAL_MIN, gradient, LOCAL_START, loss, START, step, type W } from "./logic";

const S = 2.4; // world units per unit of weight
const HS = 2.6; // world units per unit of error
const N = 150;
const LMIN = loss(GLOBAL_MIN);

const toWorld = ([a, b]: W, lift = 0): Vec3 => [a * S, (loss([a, b]) - LMIN) * HS + lift, -b * S];

type S_ = {
  path: W[];
  lr: number;
  playing: boolean;
  setLr: (v: number) => void;
  next: () => void;
  play: () => void;
  pause: () => void;
  reset: (start?: W) => void;
};

let timer: ReturnType<typeof setInterval> | null = null;

export const useLandscape = create<S_>((set, get) => ({
  path: [START],
  lr: 0.25,
  playing: false,
  setLr: (lr) => set({ lr }),
  next: () => set((s) => ({ path: [...s.path, step(s.path[s.path.length - 1], s.lr)].slice(-80) })),
  play: () => {
    if (timer) clearInterval(timer);
    set({ playing: true });
    timer = setInterval(() => {
      const { path, lr } = get();
      const last = path[path.length - 1];
      const nextW = step(last, lr);
      const moved = Math.hypot(nextW[0] - last[0], nextW[1] - last[1]);
      if (moved < 0.002 || path.length > 70) return get().pause();
      set({ path: [...path, nextW] });
    }, 260);
  },
  pause: () => {
    if (timer) clearInterval(timer);
    timer = null;
    set({ playing: false });
  },
  reset: (start) => {
    get().pause();
    set({ path: [start ?? START] });
  },
}));

/** Iso-lines of the error surface (marching squares), as line segments lying on the surface. */
function contours(levels: number[]): Float32Array {
  const M = 90;
  const v = (i: number, j: number): W => [-DOMAIN + (2 * DOMAIN * i) / M, -DOMAIN + (2 * DOMAIN * j) / M];
  const f: number[][] = [];
  for (let i = 0; i <= M; i++) {
    f.push([]);
    for (let j = 0; j <= M; j++) f[i].push(loss(v(i, j)));
  }
  const out: number[] = [];
  const lerp = (a: W, b: W, fa: number, fb: number, L: number): W => {
    const t = (L - fa) / (fb - fa);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  for (const L of levels)
    for (let i = 0; i < M; i++)
      for (let j = 0; j < M; j++) {
        const p = [v(i, j), v(i + 1, j), v(i + 1, j + 1), v(i, j + 1)];
        const q = [f[i][j], f[i + 1][j], f[i + 1][j + 1], f[i][j + 1]];
        const pts: W[] = [];
        for (let e = 0; e < 4; e++) {
          const a = e;
          const b = (e + 1) % 4;
          if (q[a] < L !== q[b] < L) pts.push(lerp(p[a], p[b], q[a], q[b], L));
        }
        for (let k = 0; k + 1 < pts.length; k += 2) out.push(...toWorld(pts[k], 0.03), ...toWorld(pts[k + 1], 0.03));
      }
  return new Float32Array(out);
}

function useSurface() {
  return useMemo(() => {
    const size = 2 * DOMAIN * S;
    const g = new PlaneGeometry(size, size, N, N);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    // Glowing mint valleys, blue slopes, violet peaks.
    const low = new Color("#3EE6A4");
    const mid = new Color("#2F7FD8");
    const high = new Color("#8A63E8");
    let lmax = 0;
    for (let i = 0; i < pos.count; i++) lmax = Math.max(lmax, loss([pos.getX(i) / S, -pos.getZ(i) / S]));
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const l = loss([pos.getX(i) / S, -pos.getZ(i) / S]);
      pos.setY(i, (l - LMIN) * HS);
      const t = (l - LMIN) / (lmax - LMIN);
      if (t < 0.45) c.copy(low).lerp(mid, t / 0.45);
      else c.copy(mid).lerp(high, (t - 0.45) / 0.55);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const levels = Array.from({ length: 14 }, (_, k) => LMIN + 0.08 + k * 0.17);
    return { geometry: g, lines: contours(levels) };
  }, []);
}

export function LossLandscapeView() {
  const { path } = useLandscape();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const modelId = useModelId();
  const { geometry, lines } = useSurface();
  const cur = path[path.length - 1];
  const curP = toWorld(cur, 0.42);
  const g = gradient(cur);
  const gl = Math.hypot(g[0], g[1]);

  useEffect(() => {
    setStagePoints({ surface: [0, 0, 6], position: [curP[0], 0, curP[2] + 2], slope: [curP[0], 0, curP[2] + 2], step: [curP[0], 0, curP[2] + 2], "learning-rate": [curP[0], 0, curP[2] + 2], "local-minimum": toWorld(LOCAL_START) });
  }, [setStagePoints, curP[0], curP[2]]); // eslint-disable-line react-hooks/exhaustive-deps

  // The arrow shows which way the next step goes: straight down the slope.
  const arrow = useMemo(() => {
    if (gl < 1e-4) return null;
    const dir: W = [-g[0] / gl, -g[1] / gl];
    const from = toWorld(cur, 0.45);
    const tip = toWorld([cur[0] + dir[0] * 0.55, cur[1] + dir[1] * 0.55], 0.45);
    const v = new Vector3(tip[0] - from[0], tip[1] - from[1], tip[2] - from[2]);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), v.clone().normalize());
    return { from, tip, q };
  }, [cur[0], cur[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const clickSurface = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const w: W = [e.point.x / S, -e.point.z / S];
    useLandscape.getState().reset([Math.max(-2.9, Math.min(2.9, w[0])), Math.max(-2.9, Math.min(2.9, w[1]))]);
    useExplain.getState().show(modelId, "surface", [e.point.x, e.point.y + 0.8, e.point.z]);
  };

  const labels: LabLabel[] = [
    { id: "cur", world: [curP[0], curP[1] + 1.1, curP[2]], text: "Current weights", sub: `error ${loss(cur).toFixed(2)}`, tone: stage === "position" ? "accent" : "default", size: "md" },
    { id: "min", world: toWorld(GLOBAL_MIN, 1.1), text: "Lower error", tone: "default", size: "sm" },
    { id: "axis1", world: [0, 0, DOMAIN * S + 1.6], text: "Weight 1", tone: "plain", size: "md" },
    { id: "axis2", world: [DOMAIN * S + 1.8, 0, 0], text: "Weight 2", tone: "plain", size: "md" },
    { id: "up", world: [-DOMAIN * S - 1, 6.4, -DOMAIN * S], text: "Higher = more error", tone: "plain", size: "sm" },
  ];
  if (stage === "local-minimum") labels.push({ id: "local", world: toWorld([-1.5, 1.3], 1.2), text: "A shallower dip: a local minimum", tone: "warn", size: "sm" });
  useSceneLabels("loss-landscape", labels, `${cur[0].toFixed(3)}:${cur[1].toFixed(3)}:${stage}`);

  const trail = path.map((w) => toWorld(w, 0.42));
  return (
    <group>
      <Stage size={[16, 16]} />
      <mesh geometry={geometry} receiveShadow castShadow onClick={clickSurface} onPointerOver={() => (document.body.style.cursor = "crosshair")} onPointerOut={() => (document.body.style.cursor = "")}>
        <meshPhysicalMaterial vertexColors roughness={0.28} metalness={0.05} clearcoat={0.8} clearcoatRoughness={0.2} emissive="#0B2A4A" emissiveIntensity={0.6} side={2} />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#CFF4FF" transparent opacity={0.5} toneMapped={false} />
      </lineSegments>
      {/* Vertical axis */}
      <Line points={[[-DOMAIN * S - 1, 0, -DOMAIN * S], [-DOMAIN * S - 1, 5.8, -DOMAIN * S]]} color={lc.ink} lineWidth={1.2} transparent opacity={0.5} />
      {trail.length > 1 && <Line points={trail} color="#ffffff" lineWidth={2.4} />}
      {trail.slice(0, -1).map((p, i) => (
        <Orb key={i} position={p} radius={0.16} color={lc.mint} glow={0.5} explain="trail" />
      ))}
      <Orb position={curP} radius={0.42} color={lc.pink} glow={0.25} explain="ball" />
      <Orb position={toWorld(GLOBAL_MIN, 0.32)} radius={0.3} color={lc.mint} glow={0.7} explain="minimum" />
      {arrow && (
        <group>
          <Line points={[arrow.from, arrow.tip]} color={lc.bad} lineWidth={3} />
          <mesh position={arrow.tip} quaternion={arrow.q}>
            <coneGeometry args={[0.16, 0.4, 16]} />
            <meshStandardMaterial color={lc.bad} emissive={lc.bad} emissiveIntensity={stage === "slope" || stage === "step" ? 1.6 : 0.6} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function LossLandscapeControls() {
  const { path, lr, playing, setLr, next, play, pause, reset } = useLandscape();
  const cur = path[path.length - 1];
  const g = gradient(cur);
  return (
    <div className="lc">
      <Slider id="ll-lr" label="Learning rate" value={lr} min={0.05} max={2.8} step={0.05} format={(v) => (v < 0.4 ? `${v.toFixed(2)} · small` : v < 1.4 ? `${v.toFixed(2)} · medium` : `${v.toFixed(2)} · large`)} onChange={setLr} />
      <div className="lc__row">
        <button className="btn" onClick={next}>
          Show next step
        </button>
        <button className="btn btn--primary" onClick={playing ? pause : play}>
          {playing ? "Pause" : "Train"}
        </button>
        <button className="btn" onClick={() => reset()}>
          Reset
        </button>
        <button className="btn" onClick={() => reset(LOCAL_START)}>
          Start in the other basin
        </button>
      </div>
      <div className="lc__metrics">
        <Metric label="Step" value={String(path.length - 1)} />
        <Metric label="Error" value={loss(cur).toFixed(3)} tone={loss(cur) - LMIN < 0.05 ? "good" : undefined} />
        <Metric label="Slope" value={Math.hypot(g[0], g[1]).toFixed(3)} />
      </div>
    </div>
  );
}
