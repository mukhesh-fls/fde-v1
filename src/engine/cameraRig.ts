import type { CameraControls } from "@react-three/drei";
import type { Framing } from "./framings";

type Controls = CameraControls;

/** The one camera controller, registered by <CameraDirector>. Navigation code moves the camera through here. */
let controls: Controls | null = null;
/** A framing asked for before the controller existed; applied as soon as it registers. */
let pending: Framing | null = null;
export const registerControls = (c: Controls | null) => {
  controls = c;
  if (c && pending) {
    const f = pending;
    pending = null;
    void frame(f, false);
  }
  if (import.meta.env.DEV) (window as unknown as { __controls?: Controls | null }).__controls = c;
};

export function frame(f: Framing, smooth: boolean) {
  if (!controls) {
    pending = f;
    return Promise.resolve();
  }
  const [px, py, pz] = f.position;
  const [tx, ty, tz] = f.target;
  return controls.setLookAt(px, py, pz, tx, ty, tz, smooth);
}

/** Shifts the view sideways (in camera space) without moving the orbit, e.g. to clear a side sheet. */
export function setViewOffset(x: number, smooth: boolean) {
  if (!controls) return;
  void controls.setFocalOffset(x, 0, 0, smooth);
}

export const cameraDistance = () => controls?.distance ?? 60;

/** Zoom by a factor (below 1 zooms in), clamped by the controller's distance limits. */
export function zoomBy(factor: number) {
  if (!controls) return;
  const d = Math.min(controls.maxDistance, Math.max(controls.minDistance, controls.distance * factor));
  void controls.dollyTo(d, true);
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
