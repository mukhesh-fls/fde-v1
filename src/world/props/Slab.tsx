import type { Rect } from "../../content/types";

type Props = { rect: Rect; y?: number; thickness?: number; color: string; receiveShadow?: boolean };

/** A flat paved area (road, apron, pad) covering a ground rectangle. */
export function Slab({ rect, y = 0, thickness = 0.1, color, receiveShadow = true }: Props) {
  const w = rect.max[0] - rect.min[0];
  const d = rect.max[1] - rect.min[1];
  return (
    <mesh position={[rect.min[0] + w / 2, y + thickness / 2, rect.min[1] + d / 2]} receiveShadow={receiveShadow}>
      <boxGeometry args={[w, thickness, d]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

export const stripX = (z: number, from: number, to: number, width: number): Rect => ({
  min: [from, z - width / 2],
  max: [to, z + width / 2],
});
export const stripZ = (x: number, from: number, to: number, width: number): Rect => ({
  min: [x - width / 2, from],
  max: [x + width / 2, to],
});
