import { Grid, MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, BackSide, BoxGeometry, CatmullRomCurve3, Color, CubicBezierCurve3, EdgesGeometry, QuadraticBezierCurve3, Quaternion, Vector3, type Mesh } from "three";
import type { Vec3 } from "../engine/labelAnchors";
import { useExplain, useModelId } from "./explain";

/**
 * The lab's palette: a dark studio where objects are smoked glass and colour comes from light.
 * Semantic colours (good, bad, warn) stay distinct so state reads at a glance.
 */
export const lc = {
  floor: "#0A1020",
  node: "#131B2B",
  nodeAlt: "#26324A",
  edge: "#3C4E70",
  accent: "#5EC8FF",
  accentSoft: "#2C6E9E",
  good: "#3EE6A4",
  goodSoft: "#1D6A52",
  bad: "#FF5C86",
  badSoft: "#7A2C45",
  warn: "#FFC857",
  warnSoft: "#6E5726",
  purple: "#A78BFA",
  purpleSoft: "#4A3C7C",
  teal: "#2EE6D6",
  amber: "#FFB067",
  ink: "#E8EEF8",
  dim: "#253045",
  sky: "#5EC8FF",
  mint: "#3EE6A4",
  lavender: "#A78BFA",
  butter: "#FFD36E",
  pink: "#FF7AA2",
} as const;

/** Is this one of the bright accent colours? Bright colours glow a little by themselves. */
const BRIGHT = new Set<string>([lc.accent, lc.good, lc.bad, lc.warn, lc.purple, lc.teal, lc.amber, lc.sky, lc.mint, lc.lavender, lc.butter, lc.pink]);

/** Smoked glass with a clear coat. Bright colours get a soft self-glow so they read on the dark background. */
export function Gloss({ color, opacity = 1, emissive, emissiveIntensity = 0.4, glow }: { color: string; opacity?: number; emissive?: string; emissiveIntensity?: number; glow?: boolean }) {
  const self = BRIGHT.has(color) ? 0.35 : 0;
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.32}
      metalness={0.05}
      clearcoat={1}
      clearcoatRoughness={0.12}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity > 0.5}
      emissive={emissive ?? color}
      emissiveIntensity={emissive ? emissiveIntensity : self}
      toneMapped={!glow}
    />
  );
}

/** Click handling shared by every object: show its explanation where it was clicked, then run onClick. */
function useClick(explain?: string, onClick?: (e: ThreeEvent<MouseEvent>) => void) {
  const modelId = useModelId();
  if (!explain && !onClick) return {};
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (explain) useExplain.getState().show(modelId, explain, [e.point.x, e.point.y + 0.6, e.point.z]);
      onClick?.(e);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "";
    },
  };
}

type BoxProps = {
  position: Vec3;
  size: Vec3;
  color?: string;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  radius?: number;
  explain?: string;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onOver?: () => void;
  onOut?: () => void;
  /** Colour of a thin glowing outline along the block's edges: the "hologram" look. */
  edges?: string;
  edgeOpacity?: number;
};

/** Crisp edge lines for a box of this size (cached per size). */
const edgeCache = new Map<string, EdgesGeometry>();
function boxEdges(size: Vec3) {
  const k = size.join(",");
  let g = edgeCache.get(k);
  if (!g) edgeCache.set(k, (g = new EdgesGeometry(new BoxGeometry(size[0] * 1.004, size[1] * 1.004, size[2] * 1.004))));
  return g;
}

/** A rounded, glossy block. */
export function Box({ position, size, color = lc.node, opacity = 1, emissive, emissiveIntensity = 0.35, radius, explain, onClick, edges, edgeOpacity = 0.55 }: BoxProps) {
  const handlers = useClick(explain, onClick);
  const r = radius ?? Math.min(0.22, Math.min(...size) * 0.35);
  return (
    <group position={position}>
      <RoundedBox args={size} radius={r} smoothness={4} castShadow={opacity === 1} receiveShadow {...handlers}>
        <Gloss color={color} opacity={opacity} emissive={emissive} emissiveIntensity={emissiveIntensity} />
      </RoundedBox>
      {edges && (
        <lineSegments geometry={boxEdges(size)}>
          <lineBasicMaterial color={edges} transparent opacity={edgeOpacity} toneMapped={false} />
        </lineSegments>
      )}
    </group>
  );
}

/** A labelled processing block: a soft white body with a coloured glowing band that lights up when active. */
export function Node({ position, size = [3, 1.2, 2], active, dim, color, tint, explain, onClick }: { position: Vec3; size?: Vec3; active?: boolean; dim?: boolean; color?: string; tint?: string; explain?: string; onClick?: () => void }) {
  const band = active ? lc.accent : (tint ?? (dim ? lc.dim : "#7FA6E0"));
  return (
    <group position={position}>
      <Box
        position={[0, size[1] / 2, 0]}
        size={size}
        color={color ?? (dim ? lc.dim : lc.node)}
        opacity={dim ? 0.6 : 1}
        explain={explain}
        onClick={onClick}
        edges={active ? lc.accent : dim ? lc.edge : (tint ?? "#7FA6E0")}
        edgeOpacity={active ? 1 : dim ? 0.2 : 0.42}
      />
      {/* A thin light strip along the top: the block's role colour, bright when it's the active stage */}
      <Box
        position={[0, size[1] + 0.03, size[2] / 2 - 0.12]}
        size={[size[0] * 0.86, 0.05, 0.08]}
        radius={0.02}
        color={band}
        emissive={band}
        emissiveIntensity={active ? 3 : 1.1}
        explain={explain}
        onClick={onClick}
      />
    </group>
  );
}

/** A glossy sphere. */
export function Orb({ position, radius = 0.6, color = lc.sky, glow = 0, explain, onClick, opacity = 1 }: { position: Vec3; radius?: number; color?: string; glow?: number; explain?: string; onClick?: () => void; opacity?: number }) {
  const handlers = useClick(explain, onClick && (() => onClick()));
  return (
    <group position={position}>
      <mesh castShadow {...handlers}>
        <sphereGeometry args={[radius, 48, 32]} />
        <Gloss color={color} opacity={opacity} emissive={color} emissiveIntensity={glow} glow={glow > 0.6} />
      </mesh>
      {/* A soft halo behind glowing spheres */}
      {glow > 0.25 && opacity > 0.5 && (
        <mesh scale={1.45}>
          <sphereGeometry args={[radius, 24, 16]} />
          <meshBasicMaterial color={color} transparent opacity={Math.min(0.22, glow * 0.12)} side={BackSide} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** A straight tube between two points. */
export function Tube({ from, to, radius = 0.06, color = lc.edge, opacity = 1, glow = 0, explain, onClick }: { from: Vec3; to: Vec3; radius?: number; color?: string; opacity?: number; glow?: number; explain?: string; onClick?: (e: ThreeEvent<MouseEvent>) => void }) {
  const handlers = useClick(explain, onClick);
  const { mid, len, quat } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    const length = dir.length();
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), length > 0 ? dir.normalize() : new Vector3(0, 1, 0));
    return { mid: a.add(b).multiplyScalar(0.5), len: length, quat: q };
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <mesh position={mid} quaternion={quat} {...handlers}>
      <cylinderGeometry args={[radius, radius, len, 12]} />
      <Gloss color={color} opacity={opacity} emissive={color} emissiveIntensity={glow} glow={glow > 0.6} />
    </mesh>
  );
}

type CurveProps = { points: Vec3[]; radius?: number; color?: string; opacity?: number; arcHeight?: number; glow?: number; explain?: string; onClick?: (e: ThreeEvent<MouseEvent>) => void };

/** A curved tube through several points (a smooth spline) or a single arc between two points. */
export function CurveTube({ points, radius = 0.06, color = lc.edge, opacity = 1, arcHeight, glow = 0, explain, onClick }: CurveProps) {
  const handlers = useClick(explain, onClick);
  const key = points.flat().join(",") + ":" + arcHeight;
  const curve = useMemo(() => {
    if (arcHeight !== undefined && points.length === 2) {
      const a = new Vector3(...points[0]);
      const b = new Vector3(...points[1]);
      const c = a.clone().add(b).multiplyScalar(0.5).add(new Vector3(0, arcHeight, 0));
      return new QuadraticBezierCurve3(a, c, b);
    }
    return new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <mesh {...handlers}>
      <tubeGeometry args={[curve, 64, radius, 10, false]} />
      <Gloss color={color} opacity={opacity} emissive={color} emissiveIntensity={glow} glow={glow > 0.6} />
    </mesh>
  );
}

/** An S-shaped cable between two points, like a neural-network connection. */
export function Cable({ from, to, radius = 0.07, color = lc.edge, opacity = 1, glow = 0, explain, onClick }: { from: Vec3; to: Vec3 } & Omit<CurveProps, "points" | "arcHeight">) {
  const handlers = useClick(explain, onClick);
  const curve = useMemo(() => cableCurve(from, to), [from[0], from[1], from[2], to[0], to[1], to[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <mesh {...handlers}>
      <tubeGeometry args={[curve, 48, radius, 10, false]} />
      <Gloss color={color} opacity={opacity} emissive={color} emissiveIntensity={glow} glow={glow > 0.6} />
    </mesh>
  );
}

export function cableCurve(from: Vec3, to: Vec3) {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const dx = (b.x - a.x) * 0.45;
  return new CubicBezierCurve3(a, new Vector3(a.x + dx, a.y, a.z), new Vector3(b.x - dx, b.y, b.z), b);
}

/** Position along a polyline at t in 0..1. */
export function along(points: Vec3[], t: number): Vec3 {
  if (points.length === 1) return points[0];
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1], p[2] - points[i][2]));
  const total = segs.reduce((a, b) => a + b, 0) || 1;
  let d = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const f = segs[i] === 0 ? 0 : Math.min(1, d / segs[i]);
      const a = points[i];
      const b = points[i + 1];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    }
    d -= segs[i];
  }
  return points[points.length - 1];
}

/** A small glowing sphere: a request, a token, a signal. Position comes from a function of time. */
export function Pulse({ at, color = lc.accent, size = 0.3 }: { at: (t: number) => Vec3 | null; color?: string; size?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const p = at(clock.elapsedTime);
    m.visible = Boolean(p);
    if (p) m.position.set(p[0], p[1], p[2]);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 20, 14]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} toneMapped={false} />
    </mesh>
  );
}

/** The floor every model stands on: dark, softly reflective, with a fine grid that fades into the distance. */
export function Stage({ size = [40, 28] as [number, number] }) {
  const r = Math.max(...size) * 1.6;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[r * 3, r * 3]} />
        <MeshReflectorMaterial
          blur={[400, 120]}
          resolution={512}
          mixBlur={1}
          mixStrength={1.2}
          roughness={0.85}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#070C18"
          metalness={0.5}
          mirror={0.35}
        />
      </mesh>
      <Grid
        position={[0, 0.005, 0]}
        args={[r * 2, r * 2]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1B2A44"
        sectionSize={5}
        sectionThickness={0.9}
        sectionColor="#24406A"
        fadeDistance={r * 1.1}
        fadeStrength={1.4}
        infiniteGrid
      />
    </group>
  );
}

export const mixColor = (a: string, b: string, t: number) => "#" + new Color(a).lerp(new Color(b), Math.min(1, Math.max(0, t))).getHexString();

/** Seconds since a run started, from the browser clock; null when nothing is playing. */
export const elapsed = (startedAt: number | null) => (startedAt === null ? null : (performance.now() - startedAt) / 1000);
