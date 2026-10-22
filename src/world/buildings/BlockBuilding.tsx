import type { Look } from "./Building";

type Props = { footprint: [number, number]; height: number; look: Look };

/** A low office block: white walls, a ribbon of blue glass, a light roof with a plant unit. */
export function BlockBuilding({ footprint: [w, d], height: h, look }: Props) {
  const bandY = h * 0.55;
  const bandH = h * 0.42;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={look.wall} roughness={0.85} />
      </mesh>
      {/* Glass ribbons on the long faces */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[0, bandY, (side * d) / 2 + side * 0.06]}>
          <boxGeometry args={[w * 0.86, bandH, 0.12]} />
          <meshStandardMaterial color={look.glass} transparent opacity={look.glassOpacity + 0.25} roughness={0.15} metalness={0.1} />
        </mesh>
      ))}
      {/* Roof slab with a small overhang */}
      <mesh position={[0, h + 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.8, 0.4, d + 0.8]} />
        <meshStandardMaterial color={look.roof} roughness={0.9} />
      </mesh>
      <mesh position={[w * 0.22, h + 0.9, -d * 0.1]} castShadow>
        <boxGeometry args={[w * 0.2, 1, d * 0.3]} />
        <meshStandardMaterial color={look.roof} roughness={0.9} />
      </mesh>
    </group>
  );
}
