import { palette } from "../../../app/theme";
import type { StationProp } from "../../../content/lessons";
import { Figure } from "../Figure";

/** Colours a station's props by state: locked stations are pale, open ones are normal. */
export type PropTone = { main: string; trim: string; glass: string; people: boolean };

const Box = ({ p, s, c, o }: { p: [number, number, number]; s: [number, number, number]; c: string; o?: number }) => (
  <mesh position={p} castShadow receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={0.75} transparent={o !== undefined} opacity={o ?? 1} />
  </mesh>
);

const Screen = ({ p, w = 2, h = 1.2, tone }: { p: [number, number, number]; w?: number; h?: number; tone: PropTone }) => (
  <group position={p}>
    <Box p={[0, 0, 0]} s={[w + 0.15, h + 0.15, 0.12]} c={tone.trim} />
    <Box p={[0, 0, 0.07]} s={[w, h, 0.02]} c={tone.glass} />
  </group>
);

/** Ground Staff Desk: one long desk, three staff, monitors. */
function GroundStaff({ tone }: { tone: PropTone }) {
  return (
    <group>
      <Box p={[0, 0.55, 0]} s={[7, 1.1, 1.4]} c={tone.main} />
      <Box p={[0, 1.12, 0]} s={[7.2, 0.08, 1.6]} c={tone.trim} />
      {[-2.4, 0, 2.4].map((x) => (
        <group key={x}>
          <Screen p={[x, 1.6, -0.2]} w={1} h={0.6} tone={tone} />
          {tone.people && <Figure position={[x, 0, -1.4]} body="#3E5C8A" />}
        </group>
      ))}
    </group>
  );
}

/** Check-in counters with a document scanner arch. */
function CheckIn({ tone }: { tone: PropTone }) {
  return (
    <group>
      {[-2.6, 0, 2.6].map((x) => (
        <group key={x} position={[x, 0, -0.6]}>
          <Box p={[0, 0.55, 0]} s={[2, 1.1, 1.2]} c={tone.main} />
          <Box p={[0, 0.2, 1]} s={[1.6, 0.4, 0.7]} c={tone.trim} />
        </group>
      ))}
      <group position={[0, 0, 2]}>
        <Box p={[-1.2, 1.1, 0]} s={[0.3, 2.2, 0.5]} c={tone.trim} />
        <Box p={[1.2, 1.1, 0]} s={[0.3, 2.2, 0.5]} c={tone.trim} />
        <Box p={[0, 2.3, 0]} s={[2.7, 0.3, 0.5]} c={tone.glass} />
      </group>
      <Screen p={[0, 2.8, -1.4]} w={6.5} h={0.7} tone={tone} />
    </group>
  );
}

/** Gate: podium, big announcement board, rows of seats. */
function Gate({ tone }: { tone: PropTone }) {
  return (
    <group>
      <Screen p={[0, 2.6, -2]} w={5} h={1.6} tone={tone} />
      <Box p={[0, 1.2, -2]} s={[0.2, 2.4, 0.2]} c={tone.trim} />
      <Box p={[-2.6, 0.55, -0.6]} s={[1.4, 1.1, 0.8]} c={tone.main} />
      {[0.6, 2].map((z) => (
        <group key={z}>
          <Box p={[0.6, 0.25, z]} s={[5, 0.5, 0.7]} c={tone.trim} />
          <Box p={[0.6, 0.6, z + 0.3]} s={[5, 0.5, 0.12]} c={tone.trim} />
        </group>
      ))}
    </group>
  );
}

/** Rebooking Desk: a desk with a sign and a queue lane of posts. */
function Rebooking({ tone }: { tone: PropTone }) {
  const posts = [-2.5, -1.25, 0, 1.25, 2.5];
  return (
    <group>
      <Box p={[0, 0.55, -1.2]} s={[5, 1.1, 1.2]} c={tone.main} />
      <Box p={[0, 2.6, -1.8]} s={[3.6, 0.8, 0.12]} c={tone.glass} />
      <Box p={[-1.6, 1.5, -1.8]} s={[0.12, 1.8, 0.12]} c={tone.trim} />
      <Box p={[1.6, 1.5, -1.8]} s={[0.12, 1.8, 0.12]} c={tone.trim} />
      {posts.flatMap((x) =>
        [0.6, 2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.45, z]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.9, 8]} />
            <meshStandardMaterial color={tone.trim} />
          </mesh>
        )),
      )}
      <Box p={[0, 0.8, 0.6]} s={[5, 0.06, 0.04]} c={tone.glass} />
      <Box p={[0, 0.8, 2]} s={[5, 0.06, 0.04]} c={tone.glass} />
      {tone.people && <Figure position={[0, 0, -2.1]} body="#3E5C8A" />}
    </group>
  );
}

/** Cargo Container Bay: containers stacked in layers. */
function Cargo({ tone }: { tone: PropTone }) {
  const colors = [tone.main, tone.glass, tone.trim];
  const stack: [number, number, number][] = [
    [-2, 0, 0],
    [0.4, 0, 0],
    [2.8, 0, 0],
    [-0.8, 1, 0],
    [1.6, 1, 0],
    [0.4, 2, 0],
  ];
  return (
    <group position={[0, 0, -0.5]}>
      {stack.map(([x, layer], i) => (
        <Box key={i} p={[x, 0.55 + layer * 1.1, 0]} s={[2.3, 1.05, 2.4]} c={colors[layer]} />
      ))}
    </group>
  );
}

/** Maintenance Hangar: a small plane under inspection, with a checklist board. */
function Hangar({ tone }: { tone: PropTone }) {
  return (
    <group>
      <group position={[0, 0, -0.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 5.5, 12]} />
          <meshStandardMaterial color={tone.main} />
        </mesh>
        <Box p={[0.2, 0.9, 0]} s={[1.3, 0.1, 6]} c={tone.trim} />
        <Box p={[-2.6, 1.9, 0]} s={[0.9, 1.5, 0.1]} c={tone.glass} />
      </group>
      <Screen p={[3.6, 1.6, 1]} w={1.2} h={1.6} tone={tone} />
    </group>
  );
}

/** Passenger Records Office: shelves of files and a catalogue cabinet. */
function Records({ tone }: { tone: PropTone }) {
  return (
    <group>
      {[-2.2, 0, 2.2].map((x) => (
        <group key={x} position={[x, 0, -0.8]}>
          <Box p={[0, 1.2, 0]} s={[1.6, 2.4, 0.6]} c={tone.trim} />
          {[0.5, 1.2, 1.9].map((y) => (
            <Box key={y} p={[0, y, 0.25]} s={[1.4, 0.45, 0.2]} c={tone.main} />
          ))}
        </group>
      ))}
      <Box p={[0, 0.5, 1.4]} s={[2.4, 1, 0.9]} c={tone.glass} />
    </group>
  );
}

/** Control Tower Room: a raised mezzanine with a wall of monitoring screens. */
function TowerRoom({ tone }: { tone: PropTone }) {
  return (
    <group>
      <Box p={[0, 1.1, -0.4]} s={[6, 0.2, 4]} c={tone.trim} />
      {[-2.8, 2.8].map((x) => (
        <Box key={x} p={[x, 0.5, -0.4]} s={[0.2, 1, 3.8]} c={tone.trim} />
      ))}
      <Box p={[0, 1.6, 1.55]} s={[6, 0.8, 0.06]} c={tone.glass} o={0.6} />
      {[-1.8, 0, 1.8].map((x) => (
        <Screen key={x} p={[x, 2.3, -2.2]} w={1.5} h={0.9} tone={tone} />
      ))}
      {tone.people && <Figure position={[0.8, 1.2, -0.8]} body="#3E5C8A" />}
    </group>
  );
}

const PROPS: Record<StationProp, (p: { tone: PropTone }) => React.JSX.Element> = {
  "ground-staff": GroundStaff,
  "check-in": CheckIn,
  gate: Gate,
  rebooking: Rebooking,
  cargo: Cargo,
  hangar: Hangar,
  records: Records,
  "tower-room": TowerRoom,
};

export function StationPropView({ prop, tone }: { prop: StationProp; tone: PropTone }) {
  const C = PROPS[prop];
  return <C tone={tone} />;
}

export const tones = {
  open: { main: palette.building, trim: palette.buildingAlt, glass: palette.glass, people: true },
  locked: { main: "#EEF1F5", trim: "#E2E6EC", glass: "#C3CEDD", people: false },
} satisfies Record<string, PropTone>;
