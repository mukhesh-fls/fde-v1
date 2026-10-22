import type { Level, ModuleStatus } from "../content/types";

export const statusLabel: Record<ModuleStatus, string> = {
  boarding: "Boarding",
  scheduled: "Scheduled",
  completed: "Completed",
  delayed: "Delayed",
};

export const levelLabel: Record<Level, string> = {
  L1: "Level 1",
  L2: "Level 2",
  L3: "Level 3",
  FDE: "Forward deployment",
};
