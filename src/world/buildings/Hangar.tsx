import type { Look } from "./Building";

type Props = { footprint: [number, number]; height: number; look: Look };

/** A hangar: low walls under a barrel roof, with a wide glazed door on the front. */
export function Hangar({ footprint: [w, d], height: h, look }: Props) {
  const wallH = h * 0.45;
  const r = d / 2;
  const roofScaleY = (h - wallH) / r;
  return (
    <group>
      <mesh position={[0, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, wallH, d]} />
        <meshStandardMaterial color={look.wall} roughness={0.85} />
      </mesh>
      <mesh position={[0, wallH, 0]} rotation={[0, 0, Math.PI / 2]} scale={[roofScaleY, 1, 1]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, w, 24, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={look.roof} roughness={0.8} />
      </mesh>
      {/* Front door, glazed */}
      <mesh position={[0, wallH * 0.45, d / 2 + 0.06]}>
        <boxGeometry args={[w * 0.7, wallH * 0.85, 0.12]} />
        <meshStandardMaterial color={look.glass} transparent opacity={look.glassOpacity + 0.2} roughness={0.2} />
      </mesh>
    </group>
  );
}
