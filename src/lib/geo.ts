import { Vector3 } from "three";

export const DEG = Math.PI / 180;

/**
 * Planetocentric selenographic lat/lon (degrees, east-positive -180..180) -> Three.js Vector3.
 * Matches Three.js SphereGeometry UV mapping when equirectangular texture has:
 * - left edge (u=0) at lon -180 deg
 * - center (u=0.5) at lon 0 deg (sub-Earth point facing +X)
 * - north pole at +Y, east (+90 deg) toward -Z
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius = 1,
  out = new Vector3(),
): Vector3 {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  const cosPhi = Math.cos(phi);
  return out.set(
    radius * cosPhi * Math.cos(lambda),
    radius * Math.sin(phi),
    -radius * cosPhi * Math.sin(lambda),
  );
}

/**
 * Scene Vector3 -> planetocentric lat/lon (degrees, east-positive -180..180).
 */
export function vector3ToLatLon(v: Vector3): { lat: number; lon: number } {
  const r = v.length();
  if (r === 0) return { lat: 0, lon: 0 };
  const clampedY = Math.max(-1, Math.min(1, v.y / r));
  const lat = Math.asin(clampedY) / DEG;
  const lon = Math.atan2(-v.z, v.x) / DEG;
  return { lat, lon };
}

/**
 * Normalize longitude from [0, 360] or arbitrary angle into [-180, 180].
 */
export function normalizeLon(lon: number): number {
  let wrapped = ((lon + 180) % 360 + 360) % 360 - 180;
  if (Object.is(wrapped, -0)) wrapped = 0;
  return wrapped;
}

/**
 * Great-circle central angle in degrees between two selenographic points.
 */
export function angularDistanceDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const p1 = latLonToVector3(lat1, lon1, 1);
  const p2 = latLonToVector3(lat2, lon2, 1);
  const dot = Math.max(-1, Math.min(1, p1.dot(p2)));
  return Math.acos(dot) / DEG;
}

/**
 * Format lat/lon cleanly for mission HUD readouts (e.g. "0.67°N · 23.47°E").
 */
export function formatLatLon(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lon).toFixed(2)}°${ew}`;
}
