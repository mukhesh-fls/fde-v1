import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { InstancedMesh } from "three";
import { Color, Object3D, Vector3 } from "three";
import { create } from "zustand";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useSceneLabels, type LabLabel } from "../../labels";
import { Cable, cableCurve, lc, Orb, Stage } from "../../primitives";
import { useLab } from "../../store";
import { Metric, Slider } from "../../ui/controls";
import { forward, HIDDEN, initialNet, INPUTS, loss, OUTPUTS, randomNet, trainSteps, accuracy, type Net } from "./logic";

type Edge = { layer: 1 | 2; i: number; j: number }; // layer 1: input j → hidden i; layer 2: hidden j → output i
type S = {
  net: Net;
  x: number[];
  selected: Edge | null;
  selectedNode: { layer: 1 | 2; i: number } | null;
  seed: number;
  steps: number;
  history: number[];
  setX: (k: number, v: number) => void;
  select: (e: Edge | null) => void;
  selectNode: (n: { layer: 1 | 2; i: number } | null) => void;
  setWeight: (v: number) => void;
  setBias: (v: number) => void;
  reset: () => void;
  randomise: () => void;
  train: () => void;
};

export const useNeuralNet = create<S>((set, get) => ({
  net: initialNet(),
  x: [1, 0, 0.3],
  selected: { layer: 2, i: 0, j: 0 },
  selectedNode: null,
  seed: 1,
  steps: 0,
  history: [loss(initialNet())],
  setX: (k, v) => set((s) => ({ x: s.x.map((a, i) => (i === k ? v : a)) })),
  select: (selected) => set({ selected, selectedNode: null }),
  selectNode: (selectedNode) => set({ selectedNode, selected: null }),
  setWeight: (v) => {
    const { selected, net } = get();
    if (!selected) return;
    const n: Net = { w1: net.w1.map((r) => [...r]), b1: [...net.b1], w2: net.w2.map((r) => [...r]), b2: [...net.b2] };
    if (selected.layer === 1) n.w1[selected.i][selected.j] = v;
    else n.w2[selected.i][selected.j] = v;
    set({ net: n });
  },
  setBias: (v) => {
    const { selectedNode, net } = get();
    if (!selectedNode) return;
    const n: Net = { w1: net.w1.map((r) => [...r]), b1: [...net.b1], w2: net.w2.map((r) => [...r]), b2: [...net.b2] };
    if (selectedNode.layer === 1) n.b1[selectedNode.i] = v;
    else n.b2[selectedNode.i] = v;
    set({ net: n });
  },
  reset: () => set({ net: initialNet(), steps: 0, history: [loss(initialNet())] }),
  randomise: () =>
    set((s) => {
      const net = randomNet(s.seed * 977);
      return { net, seed: s.seed + 1, steps: 0, history: [loss(net)] };
    }),
  train: () =>
    set((s) => {
      const net = trainSteps(s.net, 50);
      return { net, steps: s.steps + 50, history: [...s.history, loss(net)].slice(-12) };
    }),
}));

const IN_X = -11;
const H_X = 0;
const OUT_X = 11;
const Y = 2.6;
const inPos = (j: number): Vec3 => [IN_X, Y, (j - 1) * 4.6];
const hPos = (i: number): Vec3 => [H_X, Y, (i - 1.5) * 3.6];
const outPos = (i: number): Vec3 => [OUT_X, Y, (i - 0.5) * 6];

/** Positive weights are mint, negative are pink, and near-zero ones fade to grey. */
const weightColor = (w: number) => (Math.abs(w) < 0.15 ? "#4A5A78" : w > 0 ? lc.mint : lc.pink);
const signalColor = (s: number) => (s >= 0 ? "#5BE3B0" : "#FF7FA0");

export function NeuralNetView() {
  const { net, x, selected, selectedNode, select, selectNode } = useNeuralNet();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const f = useMemo(() => forward(net, x), [net, x]);
  const pulses = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useEffect(() => {
    setStagePoints({ inputs: [IN_X, 0, 7], weights: [-5.5, 0, 7], activations: [H_X, 0, 8], outputs: [OUT_X, 0, 7], training: [0, 0, 9] });
  }, [setStagePoints]);

  const edges = useMemo(() => {
    const out: { e: Edge; from: Vec3; to: Vec3; w: number; signal: number; curve: ReturnType<typeof cableCurve> }[] = [];
    for (let i = 0; i < HIDDEN; i++)
      for (let j = 0; j < 3; j++) out.push({ e: { layer: 1, i, j }, from: inPos(j), to: hPos(i), w: net.w1[i][j], signal: net.w1[i][j] * x[j], curve: cableCurve(inPos(j), hPos(i)) });
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < HIDDEN; j++) out.push({ e: { layer: 2, i, j }, from: hPos(j), to: outPos(i), w: net.w2[i][j], signal: net.w2[i][j] * f.hidden[j], curve: cableCurve(hPos(j), outPos(i)) });
    return out;
  }, [net, x, f]);

  // Glowing signals travel along each cable: bigger and faster where weight × value is larger.
  useFrame(({ clock }) => {
    const m = pulses.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const p = new Vector3();
    edges.forEach((ed, k) => {
      const s = Math.min(1, Math.abs(ed.signal));
      for (let r = 0; r < 2; r++) {
        const idx = k * 2 + r;
        const u = (t * (0.18 + s * 0.35) + k * 0.137 + r * 0.5) % 1;
        if (s < 0.06) dummy.position.set(0, -50, 0);
        else {
          ed.curve.getPoint(u, p);
          dummy.position.copy(p);
        }
        dummy.scale.setScalar(0.1 + s * 0.14);
        dummy.updateMatrix();
        m.setMatrixAt(idx, dummy.matrix);
        m.setColorAt(idx, new Color(signalColor(ed.signal)));
      }
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  const isSel = (e: Edge) => Boolean(selected && selected.layer === e.layer && selected.i === e.i && selected.j === e.j);

  const labels: LabLabel[] = [
    ...INPUTS.map((_, j) => ({ id: `inv${j}`, world: [IN_X, Y - 0.25, inPos(j)[2] + 1.5] as Vec3, text: x[j].toFixed(2), tone: "plain" as const, size: "lg" as const })),
    ...INPUTS.map((name, j) => ({ id: `in${j}`, world: [IN_X - 3.4, Y - 0.2, inPos(j)[2]] as Vec3, text: name, tone: (stage === "inputs" ? "accent" : "default") as LabLabel["tone"], size: "sm" as const })),
    ...f.hidden.map((h, i) => ({ id: `h${i}`, world: [H_X, Y + 1.55, hPos(i)[2]] as Vec3, text: h.toFixed(2), tone: (stage === "activations" ? "accent" : "plain") as LabLabel["tone"], size: "sm" as const })),
    ...OUTPUTS.map((name, k) => ({ id: `o${k}`, world: [OUT_X + 0.3, Y + 1.9 + f.probs[k] * 0.5, outPos(k)[2]] as Vec3, text: name, sub: `${Math.round(f.probs[k] * 100)}%`, tone: (f.probs[k] > 0.5 ? "good" : "default") as LabLabel["tone"], size: "md" as const })),
  ];
  if (selected) {
    const ed = edges.find((e) => isSel(e.e))!;
    const mid = ed.curve.getPoint(0.5);
    labels.push({ id: "sel", world: [mid.x, mid.y + 0.6, mid.z], text: `w = ${ed.w >= 0 ? "+" : ""}${ed.w.toFixed(2)}`, tone: "accent", size: "md" });
  }
  useSceneLabels("neural-net", labels, `${JSON.stringify(net)}:${x.join()}:${JSON.stringify(selected)}:${stage}`);

  return (
    <group>
      <Stage size={[30, 22]} />
      {edges.map((ed) => (
        <Cable
          key={`${ed.e.layer}-${ed.e.i}-${ed.e.j}`}
          from={ed.from}
          to={ed.to}
          radius={0.045 + Math.min(Math.abs(ed.w), 3) * 0.05 + (isSel(ed.e) ? 0.04 : 0)}
          color={weightColor(ed.w)}
          glow={isSel(ed.e) ? 1.4 : stage === "weights" ? 0.5 : 0.12}
          opacity={0.92}
          explain="weight"
          onClick={() => select(ed.e)}
        />
      ))}
      <instancedMesh ref={pulses} args={[undefined, undefined, (HIDDEN * 3 + 2 * HIDDEN) * 2]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial emissive="#ffffff" emissiveIntensity={1.2} toneMapped={false} />
      </instancedMesh>
      {x.map((v, j) => (
        <Orb key={`i${j}`} position={inPos(j)} radius={1.25} color={lc.sky} glow={0.1 + v * 0.35} explain="input" />
      ))}
      {f.hidden.map((h, i) => (
        <Orb
          key={`h${i}`}
          position={hPos(i)}
          radius={0.95}
          color={h >= 0 ? lc.mint : lc.pink}
          glow={(selectedNode?.layer === 1 && selectedNode.i === i ? 0.8 : 0) + Math.abs(h) * 0.45}
          explain="hidden"
          onClick={() => selectNode({ layer: 1, i })}
        />
      ))}
      {f.probs.map((p, k) => (
        <Orb
          key={`o${k}`}
          position={outPos(k)}
          radius={0.85 + p * 0.55}
          color={k === 0 ? lc.butter : lc.lavender}
          glow={(selectedNode?.layer === 2 && selectedNode.i === k ? 0.8 : 0) + p * 0.6}
          explain="output"
          onClick={() => selectNode({ layer: 2, i: k })}
        />
      ))}
    </group>
  );
}

export function NeuralNetControls() {
  const { net, x, selected, selectedNode, steps, history, setX, setWeight, setBias, reset, randomise, train } = useNeuralNet();
  const w = selected ? (selected.layer === 1 ? net.w1[selected.i][selected.j] : net.w2[selected.i][selected.j]) : 0;
  const b = selectedNode ? (selectedNode.layer === 1 ? net.b1[selectedNode.i] : net.b2[selectedNode.i]) : 0;
  const f = forward(net, x);
  const selName = selected
    ? selected.layer === 1
      ? `${INPUTS[selected.j]} → Neuron ${selected.i + 1}`
      : `Neuron ${selected.j + 1} → ${OUTPUTS[selected.i]}`
    : null;
  return (
    <div className="lc">
      {INPUTS.map((name, k) => (
        <Slider key={name} id={`nn-x${k}`} label={name} value={x[k]} min={0} max={1} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => setX(k, v)} />
      ))}
      {selected ? (
        <Slider id="nn-w" label={`Weight: ${selName}`} value={w} min={-3} max={3} step={0.05} format={(v) => v.toFixed(2)} onChange={setWeight} />
      ) : selectedNode ? (
        <Slider
          id="nn-b"
          label={`Bias: ${selectedNode.layer === 1 ? `Neuron ${selectedNode.i + 1}` : OUTPUTS[selectedNode.i]}`}
          value={b}
          min={-3}
          max={3}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={setBias}
        />
      ) : (
        <p className="step__lead">Click a connection in the 3D view to change its weight, or a neuron to change its bias.</p>
      )}
      <div className="lc__row">
        <button className="btn btn--primary" onClick={train}>
          Train 50 steps
        </button>
        <button className="btn" onClick={randomise}>
          Random weights
        </button>
        <button className="btn" onClick={reset}>
          Reset weights
        </button>
      </div>
      <div className="lc__metrics">
        <Metric label={OUTPUTS[0]} value={`${Math.round(f.probs[0] * 100)}%`} tone={f.probs[0] > 0.5 ? "good" : undefined} />
        <Metric label="Loss on 8 examples" value={history[history.length - 1].toFixed(3)} />
        <Metric label="Examples right" value={`${Math.round(accuracy(net) * 8)}/8`} tone={accuracy(net) === 1 ? "good" : undefined} />
        <Metric label="Training steps" value={String(steps)} />
      </div>
      {history.length > 1 && (
        <p className="step__lead">
          Loss so far: {history.map((l) => l.toFixed(2)).join(" → ")}
        </p>
      )}
    </div>
  );
}
