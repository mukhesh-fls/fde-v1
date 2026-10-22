import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { makeWalker } from "./actors";

describe("walking", () => {
  it("reaches any station in under two seconds", () => {
    const step = makeWalker();
    const pos = new Vector3(0, 0, 19);
    const target: [number, number] = [-30, -15];
    let t = 0;
    while (step(pos, target, 1 / 60) !== null) t += 1 / 60;
    expect(t).toBeLessThanOrEqual(2);
    expect(pos.x).toBeCloseTo(-30);
    expect(pos.z).toBeCloseTo(-15);
  });

  it("reports arrival when already there", () => {
    expect(makeWalker()(new Vector3(1, 0, 1), [1, 1], 0.016)).toBeNull();
  });
});
