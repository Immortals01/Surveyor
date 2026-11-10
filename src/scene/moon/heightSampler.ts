import { Vector3 } from "three";
import type { CelestialBody } from "@/data/schema";
import {
  HEIGHT_EXAGGERATION,
  MARS_HEIGHT_EXAGGERATION,
  MARS_RADIUS_KM,
  MOON_RADIUS_KM,
} from "@/lib/constants";
import { DEG, latLonToVector3 } from "@/lib/geo";

const DEFAULT_W = 1440;
const DEFAULT_H = 720;

interface DemBufferState {
  samples: Uint16Array | null;
  width: number;
  height: number;
  loadPromise: Promise<boolean> | null;
}

const demByBody: Record<CelestialBody, DemBufferState> = {
  moon: {
    samples: null,
    width: DEFAULT_W,
    height: DEFAULT_H,
    loadPromise: null,
  },
  earth: {
    samples: null,
    width: DEFAULT_W,
    height: DEFAULT_H,
    loadPromise: null,
  },
  mars: {
    samples: null,
    width: DEFAULT_W,
    height: DEFAULT_H,
    loadPromise: null,
  },
};

let activeBodyState: CelestialBody = "moon";

export function setActiveHeightBody(body: CelestialBody): void {
  activeBodyState = body;
}

function getActiveBody(body?: CelestialBody): CelestialBody {
  return body ?? activeBodyState;
}

/**
 * Inject raw Uint16 DEM samples directly (used by unit tests and loader).
 */
export function setHeightSamples(
  samples: Uint16Array | null,
  width = DEFAULT_W,
  height = DEFAULT_H,
  body: CelestialBody = "moon",
): void {
  const entry = demByBody[body];
  entry.samples = samples;
  entry.width = width;
  entry.height = height;
}

export interface DemGridDescriptor {
  samples: Uint16Array;
  width: number;
  height: number;
  rawOffset: number;
  rawScaleToRadius: number;
}

export function isHeightLoaded(body?: CelestialBody): boolean {
  const b = getActiveBody(body);
  return demByBody[b].samples !== null;
}

export function getDemGrid(body?: CelestialBody): DemGridDescriptor | null {
  const b = getActiveBody(body);
  const entry = demByBody[b];
  if (!entry.samples) return null;
  const isMars = b === "mars";
  return {
    samples: entry.samples,
    width: entry.width,
    height: entry.height,
    rawOffset: isMars ? 10000 : 20000,
    rawScaleToRadius: isMars
      ? MARS_HEIGHT_EXAGGERATION / (1000 * MARS_RADIUS_KM)
      : HEIGHT_EXAGGERATION / (2000 * MOON_RADIUS_KM),
  };
}

/**
 * Fetch /textures/moon/height_1440x720.u16 or /textures/mars/height_1440x720.u16 once into memory.
 */
export function loadPlanetaryHeightGrid(
  body: CelestialBody = "moon",
  customUrl?: string,
): Promise<boolean> {
  const entry = demByBody[body];
  if (entry.samples) return Promise.resolve(true);
  if (entry.loadPromise) return entry.loadPromise;

  const url =
    customUrl ??
    (body === "mars"
      ? "/textures/mars/height_1440x720.u16"
      : "/textures/moon/height_1440x720.u16");

  entry.loadPromise = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      if (buf.byteLength < DEFAULT_W * DEFAULT_H * 2) {
        throw new Error(`Unexpected height buffer size: ${buf.byteLength}`);
      }
      entry.samples = new Uint16Array(buf, 0, DEFAULT_W * DEFAULT_H);
      entry.width = DEFAULT_W;
      entry.height = DEFAULT_H;
      return true;
    })
    .catch((err) => {
      console.warn(`[heightSampler:${body}] Falling back to smooth sphere:`, err);
      entry.loadPromise = null;
      return false;
    });

  return entry.loadPromise;
}

export function loadLunarHeightGrid(
  url = "/textures/moon/height_1440x720.u16",
): Promise<boolean> {
  return loadPlanetaryHeightGrid("moon", url);
}

function readHeightAtPixel(
  body: CelestialBody,
  ix: number,
  iy: number,
): number {
  const entry = demByBody[body];
  const { samples, width, height } = entry;
  if (!samples) return 0;
  const wx = ((ix % width) + width) % width;
  const cy = Math.max(0, Math.min(height - 1, iy));
  if (body === "mars") {
    // MGS MOLA encoding: 1-meter integers with +10,000 m offset (-10 km baseline)
    const raw = samples[cy * width + wx] ?? 10000;
    return raw / 1000 - 10;
  }
  // NASA SVS ldem_*_uint encoding: half-meters with +20,000 offset (-10 km baseline)
  const raw = samples[cy * width + wx] ?? 20000;
  return raw / 2000 - 10;
}

/**
 * Bilinearly sample LOLA (Moon) or MOLA (Mars) elevation in km relative to the reference sphere.
 */
export function sampleHeightKm(
  lat: number,
  lon: number,
  body?: CelestialBody,
): number {
  const b = getActiveBody(body);
  const entry = demByBody[b];
  if (!entry.samples) return 0;

  const clampedLat = Math.max(-90, Math.min(90, lat));
  const u = ((lon + 180) / 360) * entry.width - 0.5;
  const v = ((90 - clampedLat) / 180) * entry.height - 0.5;

  const x0 = Math.floor(u);
  const y0 = Math.floor(v);
  const fx = u - x0;
  const fy = v - y0;

  const h00 = readHeightAtPixel(b, x0, y0);
  const h10 = readHeightAtPixel(b, x0 + 1, y0);
  const h01 = readHeightAtPixel(b, x0, y0 + 1);
  const h11 = readHeightAtPixel(b, x0 + 1, y0 + 1);

  const top = h00 * (1 - fx) + h10 * fx;
  const bottom = h01 * (1 - fx) + h11 * fx;
  return top * (1 - fy) + bottom * fy;
}

/**
 * Scene radius at (lat, lon) where 1.0 = mean planetary radius (1737.4 km Moon, 3396.2 km Mars).
 */
export function surfaceRadius(
  lat: number,
  lon: number,
  body?: CelestialBody,
): number {
  const b = getActiveBody(body);
  const hKm = sampleHeightKm(lat, lon, b);
  if (b === "mars") {
    return 1 + (hKm / MARS_RADIUS_KM) * MARS_HEIGHT_EXAGGERATION;
  }
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
  body?: CelestialBody,
): Vector3 {
  const b = getActiveBody(body);
  latLonToVector3(lat, lon, 1, _up);
  if (!demByBody[b].samples) {
    return out.copy(_up);
  }

  const clampedLat = Math.max(-89.6, Math.min(89.6, lat));
  const phi = clampedLat * DEG;
  const lambda = lon * DEG;

  const sinLambda = Math.sin(lambda);
  const cosLambda = Math.cos(lambda);
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);

  _east.set(-sinLambda, 0, -cosLambda);
  _north.set(-sinPhi * cosLambda, cosPhi, sinPhi * sinLambda);

  const stepDeg = 0.25; // matches 4 px/deg LOLA & MOLA grid
  const dEastRad = stepDeg * DEG * Math.max(cosPhi, 0.02);
  const dNorthRad = stepDeg * DEG;

  const drdLon =
    (surfaceRadius(clampedLat, lon + stepDeg, b) -
      surfaceRadius(clampedLat, lon - stepDeg, b)) /
    (2 * dEastRad);
  const drdLat =
    (surfaceRadius(clampedLat + stepDeg, lon, b) -
      surfaceRadius(clampedLat - stepDeg, lon, b)) /
    (2 * dNorthRad);

  return out
    .copy(_up)
    .addScaledVector(_east, -drdLon)
    .addScaledVector(_north, -drdLat)
    .normalize();
}
