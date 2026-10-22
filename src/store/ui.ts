import { create } from "zustand";

export type View = { kind: "overview" } | { kind: "building"; moduleId: string } | { kind: "lab" };
export type Panel = { kind: "lesson"; lessonId: string } | { kind: "exam"; moduleId: string } | { kind: "scoreboard" } | null;

type UiState = {
  view: View;
  /** Set while the camera is flying between views; the scene swaps under a short fade. */
  transition: "none" | "in" | "out";
  hoveredModuleId: string | null;
  hoveredStationId: string | null;
  panel: Panel;
  chatOpen: boolean;
  /** A short message Ravi says out loud in the scene, e.g. after a wrong answer. */
  ravisLine: string | null;
  setHovered: (id: string | null) => void;
  setHoveredStation: (id: string | null) => void;
  setView: (v: View) => void;
  setTransition: (t: UiState["transition"]) => void;
  openPanel: (p: Panel) => void;
  setChatOpen: (open: boolean) => void;
  say: (line: string | null) => void;
};

export const useUi = create<UiState>((set) => ({
  view: { kind: "overview" },
  transition: "none",
  hoveredModuleId: null,
  hoveredStationId: null,
  panel: null,
  chatOpen: false,
  ravisLine: null,
  setHovered: (id) => set({ hoveredModuleId: id }),
  setHoveredStation: (id) => set({ hoveredStationId: id }),
  setView: (view) => set({ view, hoveredModuleId: null, hoveredStationId: null }),
  setTransition: (transition) => set({ transition }),
  openPanel: (panel) => set({ panel, ravisLine: null }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  say: (ravisLine) => set({ ravisLine }),
}));
