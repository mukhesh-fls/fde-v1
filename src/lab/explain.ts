import { createContext, useContext } from "react";
import { create } from "zustand";
import raw from "../../content/p2-l1/explain.json";
import type { Vec3 } from "../engine/labelAnchors";

/** Short explanations for clickable objects in each model: content/p2-l1/explain.json, by model id then object id. */
type ExplainText = { title: string; body: string };
const TEXT = raw as Record<string, Record<string, ExplainText>>;

export const explainText = (modelId: string, objectId: string): ExplainText | null => TEXT[modelId]?.[objectId] ?? null;

type ExplainState = {
  current: (ExplainText & { key: string; world: Vec3 }) | null;
  show: (modelId: string, objectId: string, world: Vec3, override?: Partial<ExplainText>) => void;
  clear: () => void;
};

export const useExplain = create<ExplainState>((set) => ({
  current: null,
  show: (modelId, objectId, world, override) => {
    const t = explainText(modelId, objectId);
    if (!t && !override?.title) return;
    set({ current: { key: `${modelId}:${objectId}:${Date.now()}`, world, title: override?.title ?? t!.title, body: override?.body ?? t?.body ?? "" } });
  },
  clear: () => set({ current: null }),
}));

/** The model whose scene is rendering, so primitives can look up their explanation. */
export const ModelContext = createContext<string>("");
export const useModelId = () => useContext(ModelContext);
