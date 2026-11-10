import { Vector3 } from "three";
import { HEIGHT_EXAGGERATION, MOON_RADIUS_KM } from "@/lib/constants";
import { DEG, latLonToVector3 } from "@/lib/geo";

const DEFAULT_W = 1440;
const DEFAULT_H = 720;

let demSamples: Uint16Array | null = null;
let demWidth = DEFAULT_W;
let demHeight = DEFAULT_H;
let loadPromise: Promise<boolean> | null = null;

/**
 * Inject raw Uint16 DEM samples directly (used by unit tests and loader).
 */
export function setHeightSamples(
  samples: Uint16Array | null,
  width = DEFAULT_W,
  height = DEFAULT_H,
): void {
  demSamples = samples;
  demWidth = width;
  demHeight = height;
}

export function isHeightLoaded(): boolean {
  return demSamples !== null;
}

/**
 * Fetch /textures/moon/height_1440x720.u16 once into memory.
 */
export function loadLunarHeightGrid(
  url = "/textures/moon/height_1440x720.u16",
): Promise<boolean> {
  if (demSamples) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      if (buf.byteLength < DEFAULT_W * DEFAULT_H * 2) {
        throw new Error(`Unexpected height buffer size: ${buf.byteLength}`);
      }
      demSamples = new Uint16Array(buf, 0, DEFAULT_W * DEFAULT_H);
      demWidth = DEFAULT_W;
      demHeight = DEFAULT_H;
      return true;
    })
    .catch((err) => {
      console.warn("[heightSampler] Falling back to smooth sphere:", err);
      loadPromise = null;
      return false;
    });

  return loadPromise;
}

function readHeightAtPixel(ix: number, iy: number): number {
  if (!demSamples) return 0;
  const wx = ((ix % demWidth) + demWidth) % demWidth;
  const cy = Math.max(0, Math.min(demHeight - 1, iy));
  const raw = demSamples[cy * demWidth + wx] ?? 20000;
  // NASA SVS ldem_*_uint encoding: half-meters with +20,000 offset (-10 km baseline)
  return raw / 2000 - 10;
}

/**
 * Bilinearly sample LOLA elevation in km relative to the 1737.4 km reference sphere.
 */
export function sampleHeightKm(lat: number, lon: number): number {
  if (!demSamples) return 0;

  const clampedLat = Math.max(-90, Math.min(90, lat));
  const u = ((lon + 180) / 360) * demWidth - 0.5;
  const v = ((90 - clampedLat) / 180) * demHeight - 0.5;

  const x0 = Math.floor(u);
  const y0 = Math.floor(v);
  const fx = u - x0;
  const fy = v - y0;

  const h00 = readHeightAtPixel(x0, y0);
  const h10 = readHeightAtPixel(x0 + 1, y0);
  const h01 = readHeightAtPixel(x0, y0 + 1);
  const h11 = readHeightAtPixel(x0 + 1, y0 + 1);

  const top = h00 * (1 - fx) + h10 * fx;
  const bottom = h01 * (1 - fx) + h11 * fx;
  return top * (1 - fy) + bottom * fy;
}

/**
 * Scene radius at (lat, lon) where 1.0 = 1737.4 km mean lunar radius.
 */
export function surfaceRadius(lat: number, lon: number): number {
  const hKm = sampleHeightKm(lat, lon);
  return 1 + (hKm / MOON_RADIUS_KM) * HEIGHT_EXAGGERATION;
}

const _up = new Vector3();
const _east = new Vector3();
const _north = new Vector3();

/**
 * Analytic surface normal at (lat, lon) via central differences on the height sampler.
 * Produces seamless vertex normals across tile boundaries without creases.
 */
export function surfaceNormal(
  lat: number,
  lon: number,
  out = new Vector3(),
): Vector3 {
  latLonToVector3(lat, lon, 1, _up);
  if (!demSamples) {
    return out.copy(_up);
  }

  const clampedLat = Math.max(-89.6, Math.min(89.6, lat));
  const phi = clampedLat * DEG;
  const lambda = lon * DEG;

  // Unit east (+lambda) and unit north (+phi) in our scene coordinate system:
  // pos = (cosPhi*cosLambda, sinPhi, -cosPhi*sinLambda)
  const sinLambda = Math.sin(lambda);
  const cosLambda = Math.cos(lambda);
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);

  _east.set(-sinLambda, 0, -cosLambda);
  _north.set(-sinPhi * cosLambda, cosPhi, sinPhi * sinLambda);

  const stepDeg = 0.25; // matches 4 px/deg LOLA grid
  const dEastRad = stepDeg * DEG * Math.max(cosPhi, 0.02);
  const dNorthRad = stepDeg * DEG;

  const drdLon =
    (surfaceRadius(clampedLat, lon + stepDeg) -
      surfaceRadius(clampedLat, lon - stepDeg)) /
    (2 * dEastRad);
  const drdLat =
    (surfaceRadius(clampedLat + stepDeg, lon) -
      surfaceRadius(clampedLat - stepDeg, lon)) /
    (2 * dNorthRad);

  return out
    .copy(_up)
    .addScaledVector(_east, -drdLon)
    .addScaledVector(_north, -drdLat)
    .normalize();
}
