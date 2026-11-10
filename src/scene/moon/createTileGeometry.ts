import {
  BufferGeometry,
  Float32BufferAttribute,
  Sphere,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
} from "three";
import { DEG, latLonToVector3 } from "@/lib/geo";
import { isHeightLoaded, surfaceRadius } from "./heightSampler";

export const TILE_COLS = 8;
export const TILE_ROWS = 4;

const STEP_DEG = 0.25;
const INV_TWO_D_NORTH = 1 / (2 * STEP_DEG * DEG);

function fillPositionsAndNormals(
  positions: Float32Array,
  normals: Float32Array,
  uvs: Float32Array | null,
  tangents: Float32Array | null,
  row: number,
  col: number,
  segments: number,
  hasDem: boolean,
): void {
  const vertsPerSide = segments + 1;
  const lonMin = -180 + col * 45;
  const latMax = 90 - row * 45;

  const lonTable = new Float64Array(vertsPerSide);
  const sinLonTable = new Float64Array(vertsPerSide);
  const cosLonTable = new Float64Array(vertsPerSide);
  const uTable = uvs ? new Float32Array(vertsPerSide) : null;

  for (let ix = 0; ix <= segments; ix++) {
    const u = ix / segments;
    const lon = lonMin + u * 45;
    const lambda = lon * DEG;
    lonTable[ix] = lon;
    sinLonTable[ix] = Math.sin(lambda);
    cosLonTable[ix] = Math.cos(lambda);
    if (uTable) uTable[ix] = u;
  }

  let vIdx = 0;
  for (let iy = 0; iy <= segments; iy++) {
    const v = iy / segments;
    const oneMinusV = 1 - v;
    const lat = latMax - v * 45;
    const phi = lat * DEG;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    if (!hasDem) {
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

        if (uvs && uTable) {
          const p2 = vIdx * 2;
          uvs[p2] = uTable[ix]!;
          uvs[p2 + 1] = oneMinusV;
        }
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

    const clampedLat = Math.max(-89.6, Math.min(89.6, lat));
    const cPhi = clampedLat * DEG;
    const sinCPhi = clampedLat === lat ? sinPhi : Math.sin(cPhi);
    const cosCPhi = clampedLat === lat ? cosPhi : Math.cos(cPhi);
    const invTwoDEast = 1 / (2 * STEP_DEG * DEG * Math.max(cosCPhi, 0.02));
    const latPlus = clampedLat + STEP_DEG;
    const latMinus = clampedLat - STEP_DEG;

    for (let ix = 0; ix <= segments; ix++) {
      const lon = lonTable[ix]!;
      const sinLon = sinLonTable[ix]!;
      const cosLon = cosLonTable[ix]!;

      const ux = cosPhi * cosLon;
      const uy = sinPhi;
      const uz = -cosPhi * sinLon;

      const r = surfaceRadius(lat, lon);
      const p3 = vIdx * 3;
      positions[p3] = ux * r;
      positions[p3 + 1] = uy * r;
      positions[p3 + 2] = uz * r;

      const drdLon =
        (surfaceRadius(clampedLat, lon + STEP_DEG) -
          surfaceRadius(clampedLat, lon - STEP_DEG)) *
        invTwoDEast;
      const drdLat =
        (surfaceRadius(latPlus, lon) - surfaceRadius(latMinus, lon)) *
        INV_TWO_D_NORTH;

      // Unit east = (-sinLon, 0, -cosLon); Unit north = (-sinCPhi*cosLon, cosCPhi, sinCPhi*sinLon)
      const nx = ux + sinLon * drdLon + sinCPhi * cosLon * drdLat;
      const ny = uy - cosCPhi * drdLat;
      const nz = uz + cosLon * drdLon - sinCPhi * sinLon * drdLat;
      const invLen = 1 / (Math.hypot(nx, ny, nz) || 1);

      normals[p3] = nx * invLen;
      normals[p3 + 1] = ny * invLen;
      normals[p3 + 2] = nz * invLen;

      if (uvs && uTable) {
        const p2 = vIdx * 2;
        uvs[p2] = uTable[ix]!;
        uvs[p2 + 1] = oneMinusV;
      }
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
): BufferGeometry {
  const vertsPerSide = segments + 1;
  const vertexCount = vertsPerSide * vertsPerSide;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const tangents = new Float32Array(vertexCount * 4);

  const hasDem = isHeightLoaded();
  fillPositionsAndNormals(
    positions,
    normals,
    uvs,
    tangents,
    row,
    col,
    segments,
    hasDem,
  );

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

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geo.setAttribute("tangent", new Float32BufferAttribute(tangents, 4));
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
    null,
    row,
    col,
    segments,
    true,
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
