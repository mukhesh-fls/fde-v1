import { describe, expect, it } from "vitest";
import { makePath, sample } from "./path";

describe("path sampling", () => {
  const square = makePath([[0, 0], [10, 0], [10, 10], [0, 10]], true);

  it("measures a closed square", () => {
    expect(square.total).toBe(40);
  });

  it("interpolates along segments and reports heading", () => {
    expect(sample(square, 5)).toMatchObject({ x: 5, z: 0, heading: 0 });
    const p = sample(square, 15);
    expect(p.x).toBe(10);
    expect(p.z).toBe(5);
    expect(p.heading).toBeCloseTo(Math.PI / 2);
  });

  it("wraps closed paths and clamps open ones", () => {
    expect(sample(square, 45)).toMatchObject({ x: 5, z: 0 });
    const open = makePath([[0, 0], [4, 0]]);
    expect(sample(open, 99)).toMatchObject({ x: 4, z: 0 });
    expect(sample(open, -3)).toMatchObject({ x: 0, z: 0 });
  });
});
