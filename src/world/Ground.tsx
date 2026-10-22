import { Instance, Instances } from "@react-three/drei";
import { palette } from "../app/theme";
import { layout } from "../content/modules";
import type { Rect } from "../content/types";
import { Slab, stripX, stripZ } from "./props/Slab";

/** Ground, runway, taxiways, roads and paved areas. Nothing here is interactive. */
export function Ground() {
  const { ground, runway, taxiway, roadLoop, curbRoad, entranceRoad, partnerLink, partnerDistrict, terminalApron } = layout;
  const gw = ground.max[0] - ground.min[0];
  const gd = ground.max[1] - ground.min[1];
  const loopRoads = loopStrips(roadLoop.min, roadLoop.max, roadLoop.width);
  const apronLink = stripZ(-35, -58, terminalApron.max[1] - 30, 10);

  return (
    <group>
      {/* Base plate of the model, plus a wide surround in the page colour so no edge shows. */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <boxGeometry args={[2400, 1, 2400]} />
        <meshStandardMaterial color={palette.background} roughness={1} />
      </mesh>
      <mesh position={[ground.min[0] + gw / 2, -0.25, ground.min[1] + gd / 2]} receiveShadow>
        <boxGeometry args={[gw, 0.5, gd]} />
        <meshStandardMaterial color={palette.ground} roughness={1} />
      </mesh>

      {/* Grass: airside infield and a few landscaped beds. */}
      <Slab rect={{ min: [-125, -92], max: [145, -80] }} color={palette.grass} thickness={0.04} />
      <Slab rect={{ min: [-110, -67], max: [110, -62] }} color={palette.grass} thickness={0.04} />
      <Slab rect={{ min: [62, -24], max: [86, -2] }} color={palette.grass} thickness={0.04} />
      <Slab rect={{ min: [-14, 18], max: [86, 24] }} color={palette.grass} thickness={0.04} />
      <Slab rect={{ min: [-125, 14], max: [-68, 90] }} color={palette.grass} thickness={0.04} />

      {/* Airside */}
      <Slab rect={stripX(runway.z, runway.from, runway.to, runway.width)} color={palette.runway} thickness={0.12} />
      <RunwayMarkings />
      <Slab rect={stripX(taxiway.z, taxiway.from, taxiway.to, taxiway.width)} color={palette.paving} thickness={0.1} />
      <Slab rect={stripZ(taxiway.from, runway.z, taxiway.z, taxiway.width)} color={palette.paving} thickness={0.1} />
      <Slab rect={stripZ(taxiway.to, runway.z, taxiway.z, taxiway.width)} color={palette.paving} thickness={0.1} />
      <Slab rect={terminalApron} color={palette.paving} thickness={0.08} />
      <Slab rect={apronLink} color={palette.paving} thickness={0.09} />
      <TaxiLines />

      {/* Landside */}
      {loopRoads.map((r, i) => (
        <Slab key={i} rect={r} color={palette.road} thickness={0.1} />
      ))}
      <Slab rect={stripX(curbRoad.z, curbRoad.from, curbRoad.to, curbRoad.width)} color={palette.road} thickness={0.1} />
      <Slab rect={stripZ(entranceRoad.x, entranceRoad.from, entranceRoad.to, entranceRoad.width)} color={palette.road} thickness={0.1} />
      <Slab rect={stripX(partnerLink.z, partnerLink.from, partnerLink.to, partnerLink.width)} color={palette.road} thickness={0.1} />
      <Slab rect={{ min: [-84, 0.6], max: [-36, 2.4] }} color={palette.building} thickness={0.14} />
      <Slab rect={partnerDistrict} color={palette.paving} thickness={0.06} />
      <CarPark />
    </group>
  );
}

function loopStrips(min: [number, number], max: [number, number], w: number): Rect[] {
  const h = w / 2;
  return [
    { min: [min[0] - h, min[1] - h], max: [max[0] + h, min[1] + h] },
    { min: [min[0] - h, max[1] - h], max: [max[0] + h, max[1] + h] },
    { min: [min[0] - h, min[1] + h], max: [min[0] + h, max[1] - h] },
    { min: [max[0] - h, min[1] + h], max: [max[0] + h, max[1] - h] },
  ];
}

function RunwayMarkings() {
  const { z, from, to, width } = layout.runway;
  const dashes: number[] = [];
  for (let x = from + 18; x < to - 18; x += 8) dashes.push(x);
  const bars: [number, number][] = [];
  for (const end of [from + 4, to - 4]) for (let i = -2; i <= 2; i++) bars.push([end, z + i * (width / 6)]);
  return (
    <group position={[0, 0.125, 0]}>
      <Instances limit={dashes.length}>
        <boxGeometry args={[4, 0.02, 0.4]} />
        <meshStandardMaterial color={palette.roadLine} />
        {dashes.map((x) => (
          <Instance key={x} position={[x, 0, z]} />
        ))}
      </Instances>
      <Instances limit={bars.length}>
        <boxGeometry args={[5, 0.02, 1]} />
        <meshStandardMaterial color={palette.roadLine} />
        {bars.map(([x, bz], i) => (
          <Instance key={i} position={[x, 0, bz]} />
        ))}
      </Instances>
    </group>
  );
}

function TaxiLines() {
  const { z, from, to } = layout.taxiway;
  const lines: Rect[] = [
    stripX(z, from, to, 0.25),
    stripZ(-35, z, -48, 0.25),
    stripX(-48, -85, -35, 0.25),
  ];
  return (
    <group>
      {lines.map((r, i) => (
        <Slab key={i} rect={r} y={0.1} thickness={0.02} color={palette.taxiLine} receiveShadow={false} />
      ))}
    </group>
  );
}

function CarPark() {
  const area: Rect = { min: [64, 27], max: [86, 43] };
  const stalls: number[] = [];
  for (let x = area.min[0] + 1.5; x < area.max[0]; x += 2.6) stalls.push(x);
  return (
    <group>
      <Slab rect={area} color={palette.paving} thickness={0.08} />
      <Instances limit={stalls.length * 2}>
        <boxGeometry args={[0.15, 0.02, 4.5]} />
        <meshStandardMaterial color={palette.roadLine} />
        {stalls.flatMap((x) => [
          <Instance key={`a${x}`} position={[x, 0.09, area.min[1] + 3]} />,
          <Instance key={`b${x}`} position={[x, 0.09, area.max[1] - 3]} />,
        ])}
      </Instances>
    </group>
  );
}
