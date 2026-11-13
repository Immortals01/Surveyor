import {
  BufferGeometry,
  Float32BufferAttribute,
  Sphere,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
} from "three";
import type { CelestialBody } from "@/data/schema";
import { DEG, latLonToVector3 } from "@/lib/geo";
import { getDemGrid, isHeightLoaded } from "./heightSampler";

export const TILE_COLS = 8;
export const TILE_ROWS = 4;

const STEP_DEG = 0.25;
const INV_TWO_D_NORTH = 1 / (2 * STEP_DEG * DEG);

interface CachedGridTopology {
  uvs: Float32Array;
  indices: Uint16Array | Uint32Array;
}

const topologyCache = new Map<number, CachedGridTopology>();

function getGridTopology(segments: number): CachedGridTopology {
  const cached = topologyCache.get(segments);
  if (cached) return cached;

  const vertsPerSide = segments + 1;
  const vertexCount = vertsPerSide * vertsPerSide;
  const uvs = new Float32Array(vertexCount * 2);

  let uvIdx = 0;
  for (let iy = 0; iy <= segments; iy++) {
    const oneMinusV = 1 - iy / segments;
    for (let ix = 0; ix <= segments; ix++) {
      uvs[uvIdx++] = ix / segments;
      uvs[uvIdx++] = oneMinusV;
    }
  }

  const indexCount = segments * segments * 6;
  const indices =
    vertexCount > 65535
      ? new Uint32Array(indexCount)
      : new Uint16Array(indexCount);

  let iIdx = 0;
  for (let iy = 0; iy < segments; iy++) {
    for (let ix = 0; ix < segments; ix++) {
      const a = iy * vertsPerSide + ix;
      const b = (iy + 1) * vertsPerSide + ix;
      const c = (iy + 1) * vertsPerSide + (ix + 1);
      const d = iy * vertsPerSide + (ix + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const entry: CachedGridTopology = { uvs, indices };
  topologyCache.set(segments, entry);
  return entry;
}

function fillPositionsAndNormals(
  positions: Float32Array,
  normals: Float32Array,
  tangents: Float32Array | null,
  row: number,
  col: number,
  segments: number,
  hasDem: boolean,
  body: CelestialBody = "moon",
): void {
  const vertsPerSide = segments + 1;
  const lonMin = -180 + col * 45;
  const latMax = 90 - row * 45;

  const sinLonTable = new Float64Array(vertsPerSide);
  const cosLonTable = new Float64Array(vertsPerSide);

  const dem = hasDem ? getDemGrid(body) : null;

  // Precomputed horizontal DEM bilinear tap tables for center, +STEP_DEG, and -STEP_DEG
  const x0Table = dem ? new Int32Array(vertsPerSide) : null;
  const x1Table = dem ? new Int32Array(vertsPerSide) : null;
  const fxTable = dem ? new Float64Array(vertsPerSide) : null;

  const x0ETable = dem ? new Int32Array(vertsPerSide) : null;
  const x1ETable = dem ? new Int32Array(vertsPerSide) : null;
  const fxETable = dem ? new Float64Array(vertsPerSide) : null;

  const x0WTable = dem ? new Int32Array(vertsPerSide) : null;
  const x1WTable = dem ? new Int32Array(vertsPerSide) : null;
  const fxWTable = dem ? new Float64Array(vertsPerSide) : null;

  for (let ix = 0; ix <= segments; ix++) {
    const u = ix / segments;
    const lon = lonMin + u * 45;
    const lambda = lon * DEG;
    sinLonTable[ix] = Math.sin(lambda);
    cosLonTable[ix] = Math.cos(lambda);

    if (dem) {
      const w = dem.width;
      const uPx = ((lon + 180) / 360) * w - 0.5;
      const x0 = Math.floor(uPx);
      x0Table![ix] = ((x0 % w) + w) % w;
      x1Table![ix] = (((x0 + 1) % w) + w) % w;
      fxTable![ix] = uPx - x0;

      const uPxE = ((lon + STEP_DEG + 180) / 360) * w - 0.5;
      const x0E = Math.floor(uPxE);
      x0ETable![ix] = ((x0E % w) + w) % w;
      x1ETable![ix] = (((x0E + 1) % w) + w) % w;
      fxETable![ix] = uPxE - x0E;

      const uPxW = ((lon - STEP_DEG + 180) / 360) * w - 0.5;
      const x0W = Math.floor(uPxW);
      x0WTable![ix] = ((x0W % w) + w) % w;
      x1WTable![ix] = (((x0W + 1) % w) + w) % w;
      fxWTable![ix] = uPxW - x0W;
    }
  }

  let vIdx = 0;
  for (let iy = 0; iy <= segments; iy++) {
    const v = iy / segments;
    const lat = latMax - v * 45;
    const phi = lat * DEG;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    if (!dem) {
      for (let ix = 0; ix <= segments; ix++) {
        const sinLon = sinLonTable[ix]!;
        const cosLon = cosLonTable[ix]!;
        const ux = cosPhi * cosLon;
        const uy = sinPhi;
        const uz = -cosPhi * sinLon;

        const p3 = vIdx * 3;
        positions[p3] = ux;
        positions[p3 + 1] = uy;
        positions[p3 + 2] = uz;

        normals[p3] = ux;
        normals[p3 + 1] = uy;
        normals[p3 + 2] = uz;

        if (tangents) {
          const p4 = vIdx * 4;
          tangents[p4] = -sinLon;
          tangents[p4 + 1] = 0;
          tangents[p4 + 2] = -cosLon;
          tangents[p4 + 3] = 1;
        }
        vIdx++;
      }
      continue;
    }

    const { samples, width, height, rawOffset, rawScaleToRadius } = dem;
    const maxY = height - 1;

    // Row bilinear taps for center latitude
    const latClamped90 = Math.max(-90, Math.min(90, lat));
    const vPx = ((90 - latClamped90) / 180) * height - 0.5;
    const y0 = Math.floor(vPx);
    const fy = vPx - y0;
    const oneMinusFy = 1 - fy;
    const row0 = Math.max(0, Math.min(maxY, y0)) * width;
    const row1 = Math.max(0, Math.min(maxY, y0 + 1)) * width;

    // Row bilinear taps for central-difference normal latitudes
    const clampedLat = Math.max(-89.6, Math.min(89.6, lat));
    const cPhi = clampedLat * DEG;
    const sinCPhi = clampedLat === lat ? sinPhi : Math.sin(cPhi);
    const cosCPhi = clampedLat === lat ? cosPhi : Math.cos(cPhi);
    const invTwoDEast =
      rawScaleToRadius / (2 * STEP_DEG * DEG * Math.max(cosCPhi, 0.02));
    const invTwoDNorth = rawScaleToRadius * INV_TWO_D_NORTH;

    const vPxC = ((90 - clampedLat) / 180) * height - 0.5;
    const y0C = Math.floor(vPxC);
    const fyC = vPxC - y0C;
    const oneMinusFyC = 1 - fyC;
    const row0C = Math.max(0, Math.min(maxY, y0C)) * width;
    const row1C = Math.max(0, Math.min(maxY, y0C + 1)) * width;

    const latPlus = Math.max(-90, Math.min(90, clampedLat + STEP_DEG));
    const vPxN = ((90 - latPlus) / 180) * height - 0.5;
    const y0N = Math.floor(vPxN);
    const fyN = vPxN - y0N;
    const oneMinusFyN = 1 - fyN;
    const row0N = Math.max(0, Math.min(maxY, y0N)) * width;
    const row1N = Math.max(0, Math.min(maxY, y0N + 1)) * width;

    const latMinus = Math.max(-90, Math.min(90, clampedLat - STEP_DEG));
    const vPxS = ((90 - latMinus) / 180) * height - 0.5;
    const y0S = Math.floor(vPxS);
    const fyS = vPxS - y0S;
    const oneMinusFyS = 1 - fyS;
    const row0S = Math.max(0, Math.min(maxY, y0S)) * width;
    const row1S = Math.max(0, Math.min(maxY, y0S + 1)) * width;

    for (let ix = 0; ix <= segments; ix++) {
      const sinLon = sinLonTable[ix]!;
      const cosLon = cosLonTable[ix]!;

      const ux = cosPhi * cosLon;
      const uy = sinPhi;
      const uz = -cosPhi * sinLon;

      const x0 = x0Table![ix]!;
      const x1 = x1Table![ix]!;
      const fx = fxTable![ix]!;
      const oneMinusFx = 1 - fx;

      // Center elevation sample
      const rawCenter =
        (samples[row0 + x0]! * oneMinusFx + samples[row0 + x1]! * fx) *
          oneMinusFy +
        (samples[row1 + x0]! * oneMinusFx + samples[row1 + x1]! * fx) * fy;
      const r = 1 + (rawCenter - rawOffset) * rawScaleToRadius;

      const p3 = vIdx * 3;
      positions[p3] = ux * r;
      positions[p3 + 1] = uy * r;
      positions[p3 + 2] = uz * r;

      // East & West elevation samples at clampedLat
      const x0E = x0ETable![ix]!;
      const x1E = x1ETable![ix]!;
      const fxE = fxETable![ix]!;
      const oneMinusFxE = 1 - fxE;
      const rawEast =
        (samples[row0C + x0E]! * oneMinusFxE + samples[row0C + x1E]! * fxE) *
          oneMinusFyC +
        (samples[row1C + x0E]! * oneMinusFxE + samples[row1C + x1E]! * fxE) *
          fyC;

      const x0W = x0WTable![ix]!;
      const x1W = x1WTable![ix]!;
      const fxW = fxWTable![ix]!;
      const oneMinusFxW = 1 - fxW;
      const rawWest =
        (samples[row0C + x0W]! * oneMinusFxW + samples[row0C + x1W]! * fxW) *
          oneMinusFyC +
        (samples[row1C + x0W]! * oneMinusFxW + samples[row1C + x1W]! * fxW) *
          fyC;

      // North & South elevation samples at center lon
      const rawNorth =
        (samples[row0N + x0]! * oneMinusFx + samples[row0N + x1]! * fx) *
          oneMinusFyN +
        (samples[row1N + x0]! * oneMinusFx + samples[row1N + x1]! * fx) * fyN;
      const rawSouth =
        (samples[row0S + x0]! * oneMinusFx + samples[row0S + x1]! * fx) *
          oneMinusFyS +
        (samples[row1S + x0]! * oneMinusFx + samples[row1S + x1]! * fx) * fyS;

      const drdLon = (rawEast - rawWest) * invTwoDEast;
      const drdLat = (rawNorth - rawSouth) * invTwoDNorth;

      // Unit east = (-sinLon, 0, -cosLon); Unit north = (-sinCPhi*cosLon, cosCPhi, sinCPhi*sinLon)
      const nx = ux + sinLon * drdLon + sinCPhi * cosLon * drdLat;
      const ny = uy - cosCPhi * drdLat;
      const nz = uz + cosLon * drdLon - sinCPhi * sinLon * drdLat;
      const invLen = 1 / (Math.hypot(nx, ny, nz) || 1);

      normals[p3] = nx * invLen;
      normals[p3 + 1] = ny * invLen;
      normals[p3 + 2] = nz * invLen;

      if (tangents) {
        const p4 = vIdx * 4;
        tangents[p4] = -sinLon;
        tangents[p4 + 1] = 0;
        tangents[p4 + 2] = -cosLon;
        tangents[p4 + 3] = 1;
      }
      vIdx++;
    }
  }
}

/**
 * Create a seamless spherical patch for tile (row 0..3, col 0..7).
 * Shared boundary (lat, lon) coordinates are identical across neighboring tiles,
 * guaranteeing watertight edges and crease-free analytic normals.
 */
export function createTileGeometry(
  row: number,
  col: number,
  segments: number,
  body: CelestialBody = "moon",
): BufferGeometry {
  const vertsPerSide = segments + 1;
  const vertexCount = vertsPerSide * vertsPerSide;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  // Earth's custom ShaderMaterial constructs its tangent basis analytically in fragment shader
  const tangents = new Float32Array(vertexCount * 4);

  const hasDem = isHeightLoaded(body);
  fillPositionsAndNormals(
    positions,
    normals,
    tangents,
    row,
    col,
    segments,
    hasDem,
    body,
  );

  const { uvs, indices } = getGridTopology(segments);

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  if (tangents) {
    geo.setAttribute("tangent", new Float32BufferAttribute(tangents, 4));
  }
  geo.setIndex(
    indices instanceof Uint32Array
      ? new Uint32BufferAttribute(indices, 1)
      : new Uint16BufferAttribute(indices, 1),
  );
  geo.userData.displaced = hasDem;
  geo.computeBoundingSphere();

  return geo;
}

/**
 * Update positions and analytic normals in-place once LOLA elevation finishes loading.
 */
export function applyTileDisplacement(
  geo: BufferGeometry,
  row: number,
  col: number,
  segments: number,
  body: CelestialBody = "moon",
): void {
  if (geo.userData.displaced) return;
  const posAttr = geo.getAttribute("position");
  const nrmAttr = geo.getAttribute("normal");
  if (!posAttr || !nrmAttr) return;

  const posArr = posAttr.array as Float32Array;
  const nrmArr = nrmAttr.array as Float32Array;

  fillPositionsAndNormals(
    posArr,
    nrmArr,
    null,
    row,
    col,
    segments,
    true,
    body,
  );

  geo.userData.displaced = true;
  posAttr.needsUpdate = true;
  nrmAttr.needsUpdate = true;
  geo.computeBoundingSphere();
}

export function getTileCenterSphere(row: number, col: number): Sphere {
  const centerLon = -180 + (col + 0.5) * 45;
  const centerLat = 90 - (row + 0.5) * 45;
  const center = latLonToVector3(centerLat, centerLon, 1);
  // 45 deg x 45 deg diagonal half-chord is <= 0.56 on a unit sphere
  return new Sphere(center, 0.62);
}
