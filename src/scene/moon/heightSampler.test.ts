import { afterEach, describe, expect, it } from "bun:test";
import {
  sampleHeightKm,
  setHeightSamples,
  surfaceNormal,
  surfaceRadius,
} from "./heightSampler";

describe("heightSampler", () => {
  afterEach(() => {
    setHeightSamples(null);
  });

  it("returns 0 km and unit sphere normal when no DEM is loaded", () => {
    expect(sampleHeightKm(0.67, 23.47)).toBe(0);
    expect(surfaceRadius(0.67, 23.47)).toBe(1);
    const n = surfaceNormal(0, 0);
    expect(n.x).toBeCloseTo(1, 5);
    expect(n.y).toBeCloseTo(0, 5);
    expect(n.z).toBeCloseTo(0, 5);
  });

  it("decodes SVS +20,000 half-meter offset and wraps across +-180 seam", () => {
    const w = 36;
    const h = 18;
    const grid = new Uint16Array(w * h).fill(20000); // 0 km baseline
    // Raise +4 km (+8000 half-meters -> 28000) along seam column 0 & w-1
    for (let y = 0; y < h; y++) {
      grid[y * w + 0] = 28000;
      grid[y * w + (w - 1)] = 28000;
    }
    setHeightSamples(grid, w, h);

    expect(sampleHeightKm(0, 0)).toBeCloseTo(0, 4);
    expect(sampleHeightKm(0, -180)).toBeCloseTo(4, 2);
    expect(sampleHeightKm(0, 180)).toBeCloseTo(4, 2);
    expect(surfaceRadius(0, 180)).toBeGreaterThan(1);
  });
});
