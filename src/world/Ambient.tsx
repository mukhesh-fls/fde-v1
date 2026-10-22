import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, Group, InstancedMesh, Object3D } from "three";
import { layout } from "../content/modules";
import type { Vec2 } from "../content/types";
import { TERMINAL1_GATE_OFFSETS } from "./buildings/Terminal1";
import { makePath, sample } from "./path";
import { Plane } from "./props/Plane";

const TAXI_SPEED = 10; // m/s, a little fast so the loop reads at overview scale
const PASSENGER_SPEED = 1.6;
const PASSENGER_COUNT = 12;

/** The taxi loop: apron lane → taxiway → runway → back. Closed and non-overlapping. */
export const taxiLoop = makePath(
  [
    [-85, -48],
    [-35, -48],
    [-35, -58],
    [100, -58],
    [100, -72],
    [-100, -72],
    [-100, -58],
    [-85, -58],
  ],
  true,
);

/** Small background life on the overview: parked planes, one plane taxiing and passengers walking into Terminal 1. */
export function Ambient() {
  const t1 = layout.buildings.m01;
  const standZ = t1.position[1] - t1.footprint[1] / 2 - 10 - 7.4;
  return (
    <group>
      {TERMINAL1_GATE_OFFSETS.slice(0, 2).map((x) => (
        <Plane key={x} position={[t1.position[0] + x, 0, standZ]} rotation={[0, -Math.PI / 2, 0]} />
      ))}
      <TaxiingPlane />
      <WalkingPassengers />
    </group>
  );
}

function TaxiingPlane() {
  const ref = useRef<Group>(null);
  const heading = useRef(0);
  const dist = useRef(0);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    dist.current += Math.min(dt, 0.1) * TAXI_SPEED;
    const p = sample(taxiLoop, dist.current);
    // Ease the heading so corners read as turns rather than snaps.
    let diff = p.heading - heading.current;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    heading.current += diff * Math.min(1, dt * 4);
    g.position.set(p.x, 0, p.z);
    g.rotation.y = -heading.current;
  });
  return <Plane ref={ref} />;
}

/** Passenger walk paths: down the pavement beside the entrance road, across the curb, in through a door. */
function passengerPath(i: number) {
  const { entranceRoad } = layout;
  const t1 = layout.buildings.m01;
  const doorZ = t1.position[1] + t1.footprint[1] / 2 + 0.6;
  const side = i % 2 === 0 ? 1 : -1;
  const kerbX = entranceRoad.x + side * (entranceRoad.width / 2 + 1.6);
  const doorX = t1.position[0] + [-10, 0, 10][i % 3] + ((i * 7) % 5) - 2;
  const pts: Vec2[] = [
    [kerbX, 48],
    [kerbX, 11],
    [doorX, 3.5],
    [doorX, doorZ],
  ];
  return makePath(pts);
}

function WalkingPassengers() {
  const mesh = useRef<InstancedMesh>(null);
  const paths = useMemo(() => Array.from({ length: PASSENGER_COUNT }, (_, i) => passengerPath(i)), []);
  const dummy = useMemo(() => new Object3D(), []);
  const time = useRef(0);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const tones = ["#3E5C8A", "#6B7A90", "#2F6FED", "#8A6F5A", "#4E7D63", "#9AA4B2"];
    paths.forEach((_, i) => m.setColorAt(i, new Color(tones[i % tones.length])));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [paths]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    time.current += Math.min(dt, 0.1);
    paths.forEach((path, i) => {
      // Each passenger loops on their own path, staggered so they arrive in a light, steady stream.
      const cycle = path.total / PASSENGER_SPEED + 4;
      const local = (time.current + (i * cycle) / PASSENGER_COUNT) % cycle;
      const p = sample(path, local * PASSENGER_SPEED);
      const inside = local * PASSENGER_SPEED >= path.total;
      dummy.position.set(p.x, 0.9, p.z);
      dummy.scale.setScalar(inside ? 0.0001 : 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, PASSENGER_COUNT]} castShadow>
      <capsuleGeometry args={[0.38, 1.1, 4, 8]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}
