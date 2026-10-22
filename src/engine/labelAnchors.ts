/**
 * World-anchored DOM labels. The UI layer registers one element per anchor id; the projector
 * inside the Canvas moves them every frame. This avoids one React root per label.
 */
export type Vec3 = [number, number, number];
/** `world` is fixed, or a function for anchors that move (like Ravi). */
export type Anchor = { id: string; world: Vec3 | (() => Vec3) };

export const labelElements = new Map<string, HTMLElement>();

export function registerLabel(id: string) {
  return (el: HTMLElement | null) => {
    if (el) labelElements.set(id, el);
    else labelElements.delete(id);
  };
}
