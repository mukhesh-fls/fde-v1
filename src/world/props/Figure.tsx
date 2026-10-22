import { forwardRef } from "react";
import type { Group } from "three";
import type { ThreeElements } from "@react-three/fiber";

type Props = ThreeElements["group"] & { body?: string; head?: string; scale?: number };

/** A simple standing person: body capsule and head, about 1.8 m tall. */
export const Figure = forwardRef<Group, Props>(function Figure({ body = "#6B7A90", head = "#E9D3C0", ...rest }, ref) {
  return (
    <group ref={ref} {...rest}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.8, 4, 10]} />
        <meshStandardMaterial color={body} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.2, 14, 12]} />
        <meshStandardMaterial color={head} roughness={0.7} />
      </mesh>
    </group>
  );
});
