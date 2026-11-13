import { afterEach, describe, expect, it } from "bun:test";
import {
  sampleHeightKm,
  setHeightSamples,
  surfaceNormal,
  surfaceRadius,
} from "./heightSampler";

describe("heightSampler", () => {
  afterEach(() => {
    setHeightSamples(null, 1440, 720, "moon");
    setHeightSamples(null, 1440, 720, "mars");
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
    setHeightSamples(grid, w, h, "moon");

    expect(sampleHeightKm(0, 0, "moon")).toBeCloseTo(0, 4);
    expect(sampleHeightKm(0, -180, "moon")).toBeCloseTo(4, 2);
    expect(sampleHeightKm(0, 180, "moon")).toBeCloseTo(4, 2);
    expect(surfaceRadius(0, 180, "moon")).toBeGreaterThan(1);
  });

  it("decodes MGS MOLA +10,000 meter offset for Mars elevations up to Olympus Mons (+21 km)", () => {
    const w = 36;
    const h = 18;
    const grid = new Uint16Array(w * h).fill(10000); // 0 km baseline
    // Raise +21 km (+21000 meters -> 31000) along seam
    for (let y = 0; y < h; y++) {
      grid[y * w + 0] = 31000;
      grid[y * w + (w - 1)] = 31000;
    }
    setHeightSamples(grid, w, h, "mars");

    expect(sampleHeightKm(0, 0, "mars")).toBeCloseTo(0, 4);
    expect(sampleHeightKm(0, -180, "mars")).toBeCloseTo(21, 2);
    expect(surfaceRadius(0, -180, "mars")).toBeGreaterThan(1);
  });

  it("vectorizes tile geometry DEM displacement accurately", async () => {
    const { applyTileDisplacement, createTileGeometry } = await import(
      "./createTileGeometry"
    );

    // Smooth Moon tile before DEM loads
    const moonGeo = createTileGeometry(1, 4, 8, "moon");
    expect(moonGeo.getAttribute("tangent")).toBeDefined();
    expect(moonGeo.userData.displaced).toBe(false);

    // Load synthetic +6 km lunar elevation grid (+12,000 half-meters -> 32,000)
    const w = 36;
    const h = 18;
    const grid = new Uint16Array(w * h).fill(32000);
    setHeightSamples(grid, w, h, "moon");

    applyTileDisplacement(moonGeo, 1, 4, 8, "moon");
    expect(moonGeo.userData.displaced).toBe(true);

    const pos = moonGeo.getAttribute("position")!;
    const r0 = Math.hypot(pos.getX(0), pos.getY(0), pos.getZ(0));
    expect(r0).toBeCloseTo(surfaceRadius(45, 0, "moon"), 5);
  });
});
