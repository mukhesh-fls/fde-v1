import { palette } from "../../app/theme";
import type { Look } from "./Building";

type Props = { footprint: [number, number]; height: number; look: Look };

export const TERMINAL1_GATE_OFFSETS = [-15, 0, 15];

/** Terminal 1: a long glass hall with a canopy over the curb and three jet bridges airside (north). */
export function Terminal1({ footprint: [w, d], height: h, look }: Props) {
  const hallH = h * 0.72;
  const mullions: number[] = [];
  for (let x = -w / 2 + 2; x <= w / 2 - 2; x += 3) mullions.push(x);

  return (
    <group>
      {/* Hall: solid end walls, glass long faces */}
      <mesh position={[0, hallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 1.2, hallH, d - 1.2]} />
        <meshStandardMaterial color={look.wall} roughness={0.85} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`end${side}`} position={[(side * (w - 0.6)) / 2, hallH / 2, 0]} castShadow>
          <boxGeometry args={[0.6, hallH, d]} />
          <meshStandardMaterial color={look.wall} roughness={0.85} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={`face${side}`} position={[0, 0, (side * d) / 2]}>
          <mesh position={[0, hallH / 2, 0]}>
            <boxGeometry args={[w - 1.2, hallH, 0.15]} />
            <meshStandardMaterial color={look.glass} transparent opacity={look.glassOpacity + 0.2} roughness={0.1} metalness={0.15} />
          </mesh>
          {mullions.map((x) => (
            <mesh key={x} position={[x, hallH / 2, side * 0.1]}>
              <boxGeometry args={[0.18, hallH, 0.18]} />
              <meshStandardMaterial color={look.wall} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Roof: a wide slab with a canopy over the landside curb, and a glazed clerestory */}
      <mesh position={[0, hallH + 0.25, 1.6]} castShadow receiveShadow>
        <boxGeometry args={[w + 2, 0.5, d + 5.2]} />
        <meshStandardMaterial color={look.wall} roughness={0.8} />
      </mesh>
      <mesh position={[0, hallH + 0.52, d / 2 + 4.1]}>
        <boxGeometry args={[w + 2, 0.06, 0.25]} />
        <meshStandardMaterial color={palette.accent} />
      </mesh>
      <mesh position={[0, hallH + 1.6, -1]} castShadow>
        <boxGeometry args={[w * 0.7, 2.2, d * 0.45]} />
        <meshStandardMaterial color={look.roof} roughness={0.85} />
      </mesh>
      <mesh position={[0, hallH + 1.6, -1 + (d * 0.45) / 2 + 0.05]}>
        <boxGeometry args={[w * 0.66, 1.3, 0.1]} />
        <meshStandardMaterial color={look.glass} transparent opacity={look.glassOpacity + 0.25} roughness={0.1} />
      </mesh>
      {/* Canopy columns along the curb */}
      {[-w / 2 + 3, -w / 4, 0, w / 4, w / 2 - 3].map((x) => (
        <mesh key={x} position={[x, hallH / 2, d / 2 + 3.6]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, hallH, 8]} />
          <meshStandardMaterial color={look.wall} />
        </mesh>
      ))}

      {/* Jet bridges to the gates */}
      {TERMINAL1_GATE_OFFSETS.map((x) => (
        <group key={x} position={[x, 0, -d / 2]}>
          <mesh position={[0, 3.6, -4.6]} castShadow>
            <boxGeometry args={[2.2, 2.2, 9.2]} />
            <meshStandardMaterial color={look.roof} roughness={0.7} />
          </mesh>
          <mesh position={[0, 3.6, -4.6]}>
            <boxGeometry args={[2.3, 0.7, 8.6]} />
            <meshStandardMaterial color={look.glass} transparent opacity={look.glassOpacity + 0.2} />
          </mesh>
          <mesh position={[0, 1.25, -8.2]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 2.5, 8]} />
            <meshStandardMaterial color={look.roof} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
