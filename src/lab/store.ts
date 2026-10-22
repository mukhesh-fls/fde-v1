import { create } from "zustand";
import type { Vec3 } from "../engine/labelAnchors";
import { labLessons } from "./content";

export type LabTab = { kind: "model"; modelId: string };
export type LabSheet = "walkthrough" | "details" | "read" | "quiz" | null;

type LabState = {
  lessonId: string;
  tab: LabTab;
  /** The side sheet: closed by default so the 3D model has the whole screen. */
  sheet: LabSheet;
  episodesOpen: boolean;
  tipOpen: boolean;
  /** The stage of the current model's flow being explained, highlighted in 3D. */
  stageId: string | null;
  /** Where each stage sits in the current model's scene, registered by its view. The camera leans there. */
  stagePoints: Record<string, Vec3>;
  tipIndex: number;
  openLesson: (id: string) => void;
  setTab: (t: LabTab) => void;
  setSheet: (s: LabSheet) => void;
  setEpisodesOpen: (o: boolean) => void;
  setTipOpen: (o: boolean) => void;
  setStage: (id: string | null) => void;
  setStagePoints: (p: Record<string, Vec3>) => void;
  nextTip: () => void;
};

const firstModel = (lessonId: string) => labLessons.find((l) => l.id === lessonId)?.models[0]?.id ?? "";

export const useLab = create<LabState>((set) => ({
  lessonId: labLessons[0]?.id ?? "",
  tab: { kind: "model", modelId: firstModel(labLessons[0]?.id ?? "") },
  sheet: null,
  episodesOpen: false,
  tipOpen: false,
  stageId: null,
  stagePoints: {},
  tipIndex: 0,
  openLesson: (id) =>
    set((s) => ({ lessonId: id, tab: { kind: "model", modelId: firstModel(id) }, stageId: null, tipIndex: 0, episodesOpen: false, sheet: s.sheet === "quiz" ? null : s.sheet })),
  setTab: (tab) => set({ tab, stageId: null, tipIndex: 0 }),
  setSheet: (sheet) => set({ sheet }),
  setEpisodesOpen: (episodesOpen) => set({ episodesOpen }),
  setTipOpen: (tipOpen) => set({ tipOpen }),
  setStage: (stageId) => set({ stageId }),
  setStagePoints: (stagePoints) => set({ stagePoints }),
  nextTip: () => set((s) => ({ tipIndex: s.tipIndex + 1 })),
}));

export function useActiveModelId() {
  return useLab((s) => s.tab.modelId);
}
