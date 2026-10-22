import { useEffect } from "react";
import { create } from "zustand";
import type { Vec3 } from "../engine/labelAnchors";

export type LabelTone = "default" | "accent" | "good" | "bad" | "warn" | "muted" | "plain";

/** A text label pinned to a point in the lab scene. Rendered in the DOM label layer, not in WebGL. */
export type LabLabel = { id: string; world: Vec3 | (() => Vec3); text: string; sub?: string; tone?: LabelTone; size?: "sm" | "md" | "lg" };

type LabelState = { labels: LabLabel[]; set: (owner: string, labels: LabLabel[]) => void; owners: Record<string, LabLabel[]> };

export const useLabLabels = create<LabelState>((set) => ({
  labels: [],
  owners: {},
  set: (owner, labels) =>
    set((s) => {
      const owners = { ...s.owners, [owner]: labels };
      if (labels.length === 0) delete owners[owner];
      return { owners, labels: Object.values(owners).flat() };
    }),
}));

/**
 * Declares the labels a view wants. `key` should change whenever the label text or positions change;
 * labels are removed when the view unmounts.
 */
export function useSceneLabels(owner: string, labels: LabLabel[], key: string) {
  useEffect(() => {
    useLabLabels.getState().set(
      owner,
      labels.map((l) => ({ ...l, id: `lab:${owner}:${l.id}` })),
    );
  }, [owner, key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => useLabLabels.getState().set(owner, []), [owner]);
}
