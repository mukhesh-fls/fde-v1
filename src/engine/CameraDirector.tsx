import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Box3, Vector3 } from "three";
import { useUi } from "../store/ui";
import { frame, registerControls } from "./cameraRig";
import { examFraming, INTERIOR, OVERVIEW, stationFraming } from "./framings";

/** Zoom range, orbit angles and pan bounds per view. The lab allows near front-on views, e.g. for the transformer tower. */
const LIMITS = {
  overview: { min: 45, max: 320, polar: [0.2, 1.18], box: new Box3(new Vector3(-100, 0, -80), new Vector3(130, 20, 70)) },
  building: { min: 10, max: 110, polar: [0.2, 1.25], box: new Box3(new Vector3(-40, 0, -70), new Vector3(40, 10, 30)) },
  lab: { min: 6, max: 140, polar: [0.08, 1.5], box: new Box3(new Vector3(-32, -5, -28), new Vector3(32, 24, 28)) },
} as const;

/** Owns the camera controller: limits per view, and framing when a station or the exam opens. */
export function CameraDirector() {
  const ref = useRef<CameraControls>(null);
  const view = useUi((s) => s.view);
  const panel = useUi((s) => s.panel);

  useEffect(() => {
    // Frame the overview first; a framing requested before this mounted (e.g. the lab's) then replaces it.
    if (useUi.getState().view.kind === "overview") void frame(OVERVIEW, false);
    registerControls(ref.current);
    return () => registerControls(null);
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const l = view.kind === "overview" ? LIMITS.overview : view.kind === "lab" ? LIMITS.lab : LIMITS.building;
    c.minDistance = l.min;
    c.maxDistance = l.max;
    c.minPolarAngle = l.polar[0];
    c.maxPolarAngle = l.polar[1];
    c.setBoundary(l.box);
  }, [view]);

  useEffect(() => {
    if (view.kind !== "building") return;
    if (panel?.kind === "lesson") void frame(stationFraming(view.moduleId, panel.lessonId), true);
    else if (panel?.kind === "exam") void frame(examFraming(view.moduleId), true);
    else if (panel === null) void frame(INTERIOR, true);
  }, [panel, view]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      // Scroll zooms towards what's under the pointer, like a map.
      dollyToCursor
      smoothTime={0.28}
      draggingSmoothTime={0.12}
      dollySpeed={1}
      truckSpeed={1.4}
    />
  );
}
