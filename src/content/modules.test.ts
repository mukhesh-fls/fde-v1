import { describe, expect, it } from "vitest";
import { layout, modules } from "./modules";
import type { Rect, Vec2 } from "./types";

const rectOf = (p: Vec2, f: Vec2): Rect => ({
  min: [p[0] - f[0] / 2, p[1] - f[1] / 2],
  max: [p[0] + f[0] / 2, p[1] + f[1] / 2],
});
const overlaps = (a: Rect, b: Rect) =>
  a.min[0] < b.max[0] && a.max[0] > b.min[0] && a.min[1] < b.max[1] && a.max[1] > b.min[1];

describe("modules content", () => {
  it("has all 17 modules with unique ids and codes", () => {
    expect(modules).toHaveLength(17);
    expect(new Set(modules.map((m) => m.id)).size).toBe(17);
    expect(new Set(modules.map((m) => m.code)).size).toBe(17);
  });

  it("only AI01 is boarding at the start", () => {
    expect(modules.filter((m) => m.status === "boarding").map((m) => m.code)).toEqual(["AI01"]);
  });

  it("Module 01 has eight stations", () => {
    expect(modules[0].stations).toHaveLength(8);
  });
});

describe("airport layout", () => {
  const rects = modules.map((m) => ({ id: m.id, r: rectOf(m.building.position, m.building.footprint) }));

  it("no two buildings overlap", () => {
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++)
        expect(overlaps(rects[i].r, rects[j].r), `${rects[i].id} vs ${rects[j].id}`).toBe(false);
  });

  it("no building sits on the road loop", () => {
    const { min, max, width } = layout.roadLoop;
    const h = width / 2;
    const roads: Rect[] = [
      { min: [min[0] - h, min[1] - h], max: [max[0] + h, min[1] + h] },
      { min: [min[0] - h, max[1] - h], max: [max[0] + h, max[1] + h] },
      { min: [min[0] - h, min[1] - h], max: [min[0] + h, max[1] + h] },
      { min: [max[0] - h, min[1] - h], max: [max[0] + h, max[1] + h] },
    ];
    for (const { id, r } of rects) for (const road of roads) expect(overlaps(r, road), id).toBe(false);
  });

  it("Level 3 buildings sit nearer the runway than Level 1 buildings", () => {
    const avgZ = (level: string) => {
      const zs = modules.filter((m) => m.level === level).map((m) => m.building.position[1]);
      return zs.reduce((a, b) => a + b, 0) / zs.length;
    };
    expect(Math.abs(avgZ("L3") - layout.runway.z)).toBeLessThan(Math.abs(avgZ("L1") - layout.runway.z));
  });

  it("FDE buildings sit in the partner district", () => {
    const d = layout.partnerDistrict;
    for (const m of modules.filter((m) => m.level === "FDE")) {
      const r = rectOf(m.building.position, m.building.footprint);
      expect(r.min[0] >= d.min[0] && r.max[0] <= d.max[0] && r.min[1] >= d.min[1] && r.max[1] <= d.max[1]).toBe(true);
    }
  });
});
