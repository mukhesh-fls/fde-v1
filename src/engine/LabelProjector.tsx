import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { Vector3 } from "three";
import type { Anchor } from "./labelAnchors";
import { labelElements } from "./labelAnchors";

/** Projects each anchor to the screen and moves its registered DOM label there. */
export function LabelProjector({ anchors }: { anchors: Anchor[] }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new Vector3(), []);
  useFrame(() => {
    for (const a of anchors) {
      const el = labelElements.get(a.id);
      if (!el) continue;
      const w = typeof a.world === "function" ? a.world() : a.world;
      v.set(w[0], w[1], w[2]).project(camera);
      const visible = v.z < 1;
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.visibility = visible ? "visible" : "hidden";
      // Nearer labels sit on top of farther ones.
      el.style.zIndex = String(Math.round((1 - v.z) * 100000));
    }
  });
  return null;
}
