import type { Vec2 } from "../content/types";

/** A closed or open polyline on the ground, with precomputed segment lengths. */
export type Path = { points: Vec2[]; lengths: number[]; total: number; closed: boolean };

export function makePath(points: Vec2[], closed = false): Path {
  const pts = closed ? [...points, points[0]] : points;
  const lengths: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    lengths.push(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]));
  }
  return { points: pts, lengths, total: lengths.reduce((a, b) => a + b, 0), closed };
}

/** Position and heading (radians, 0 = facing +x) at a distance along the path. Closed paths wrap. */
export function sample(path: Path, distance: number): { x: number; z: number; heading: number } {
  let d = path.closed ? ((distance % path.total) + path.total) % path.total : Math.min(Math.max(distance, 0), path.total);
  for (let i = 0; i < path.lengths.length; i++) {
    const len = path.lengths[i];
    if (d <= len || i === path.lengths.length - 1) {
      const [ax, az] = path.points[i];
      const [bx, bz] = path.points[i + 1];
      const t = len === 0 ? 0 : Math.min(d / len, 1);
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, heading: Math.atan2(bz - az, bx - ax) };
    }
    d -= len;
  }
  const [x, z] = path.points[0];
  return { x, z, heading: 0 };
}
