import { hasInterior } from "../content/lessons";
import { useUi } from "../store/ui";
import { frame, prefersReducedMotion, setViewOffset } from "./cameraRig";
import { approachFraming, INTERIOR, LAB_APPROACH, OVERVIEW } from "./framings";

const FADE_MS = 260;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fly from the overview into a building: approach, fade, swap to the interior, fade back. */
export async function enterBuilding(moduleId: string) {
  const ui = useUi.getState();
  if (ui.transition !== "none" || !hasInterior(moduleId)) return;
  ui.setTransition("in");
  if (!prefersReducedMotion()) await Promise.race([frame(approachFraming(moduleId), true), wait(1200)]);
  ui.setTransition("out"); // fade to white
  await wait(FADE_MS);
  ui.setView({ kind: "building", moduleId });
  ui.openPanel(null);
  await wait(30);
  await frame(INTERIOR, false);
  ui.setTransition("none");
}

/** Fly from the overview into the AI Systems Lab. */
export async function enterLab() {
  const ui = useUi.getState();
  if (ui.transition !== "none" || ui.view.kind === "lab") return;
  ui.setTransition("in");
  if (!prefersReducedMotion()) await Promise.race([frame(LAB_APPROACH, true), wait(1200)]);
  ui.setTransition("out");
  await wait(FADE_MS);
  ui.openPanel(null);
  ui.setView({ kind: "lab" });
  await wait(60);
  ui.setTransition("none");
}

/** Go back up one level: close a panel first, otherwise leave the building. */
export async function goBack() {
  const ui = useUi.getState();
  if (ui.transition !== "none") return;
  if (ui.panel) {
    ui.openPanel(null);
    if (ui.view.kind === "building") void frame(INTERIOR, true);
    return;
  }
  if (ui.view.kind === "lab") {
    setViewOffset(0, false);
    ui.setTransition("out");
    await wait(FADE_MS);
    ui.setView({ kind: "overview" });
    await wait(30);
    await frame(LAB_APPROACH, false);
    ui.setTransition("none");
    await frame(OVERVIEW, !prefersReducedMotion());
    return;
  }
  if (ui.view.kind !== "building") return;
  const moduleId = ui.view.moduleId;
  ui.setTransition("out");
  await wait(FADE_MS);
  ui.setView({ kind: "overview" });
  await wait(30);
  await frame(approachFraming(moduleId), false);
  ui.setTransition("none");
  if (!prefersReducedMotion()) await frame(OVERVIEW, true);
  else await frame(OVERVIEW, false);
}
