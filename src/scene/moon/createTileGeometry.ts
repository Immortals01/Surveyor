import {
  BufferGeometry,
  Float32BufferAttribute,
  Sphere,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  Vector3,
} from "three";
import { DEG, latLonToVector3 } from "@/lib/geo";
import { surfaceNormal, surfaceRadius } from "./heightSampler";

export const TILE_COLS = 8;
export const TILE_ROWS = 4;

const _pos = new Vector3();
const _nrm = new Vector3();

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

  const lonMin = -180 + col * 45;
  const latMax = 90 - row * 45;

  let vIdx = 0;
  for (let iy = 0; iy <= segments; iy++) {
    const v = iy / segments;
    const lat = latMax - v * 45;

    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments;
      const lon = lonMin + u * 45;
      const lambda = lon * DEG;

      const r = surfaceRadius(lat, lon);
      latLonToVector3(lat, lon, r, _pos);
      surfaceNormal(lat, lon, _nrm);

      const p3 = vIdx * 3;
      positions[p3] = _pos.x;
      positions[p3 + 1] = _pos.y;
      positions[p3 + 2] = _pos.z;

      normals[p3] = _nrm.x;
      normals[p3 + 1] = _nrm.y;
      normals[p3 + 2] = _nrm.z;

      const p2 = vIdx * 2;
      uvs[p2] = u;
      uvs[p2 + 1] = 1 - v;

      // Tangent points along +u (east)
      const p4 = vIdx * 4;
      tangents[p4] = -Math.sin(lambda);
      tangents[p4 + 1] = 0;
      tangents[p4 + 2] = -Math.cos(lambda);
      tangents[p4 + 3] = 1;

      vIdx++;
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
  const posAttr = geo.getAttribute("position");
  const nrmAttr = geo.getAttribute("normal");
  if (!posAttr || !nrmAttr) return;

  const posArr = posAttr.array as Float32Array;
  const nrmArr = nrmAttr.array as Float32Array;

  const lonMin = -180 + col * 45;
  const latMax = 90 - row * 45;

  let vIdx = 0;
  for (let iy = 0; iy <= segments; iy++) {
    const v = iy / segments;
    const lat = latMax - v * 45;
    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments;
      const lon = lonMin + u * 45;

      const r = surfaceRadius(lat, lon);
      latLonToVector3(lat, lon, r, _pos);
      surfaceNormal(lat, lon, _nrm);

      const p3 = vIdx * 3;
      posArr[p3] = _pos.x;
      posArr[p3 + 1] = _pos.y;
      posArr[p3 + 2] = _pos.z;

      nrmArr[p3] = _nrm.x;
      nrmArr[p3 + 1] = _nrm.y;
      nrmArr[p3 + 2] = _nrm.z;
      vIdx++;
    }
  }

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
