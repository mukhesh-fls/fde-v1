import { modules } from "../content/modules";
import type { ModuleStatus } from "../content/types";
import { useProgress } from "./progress";
import { moduleStatus } from "./progressRules";

const moduleIds = modules.map((m) => m.id);

/** Live status for every module, from the learner's progress. */
export function useModuleStatuses(): Record<string, ModuleStatus> {
  const exams = useProgress((s) => s.exams);
  const out: Record<string, ModuleStatus> = {};
  for (const id of moduleIds) out[id] = moduleStatus({ lessons: {}, exams }, moduleIds, id);
  return out;
}

export const isOpenStatus = (s: ModuleStatus) => s === "boarding" || s === "completed";
