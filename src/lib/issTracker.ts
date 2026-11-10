import { useEffect, useState } from "react";
import { Vector3 } from "three";
import { DEG, latLonToVector3, normalizeLon, vector3ToLatLon } from "@/lib/geo";

export const ISS_NORAD_ID = 25544;
export const ISS_INCLINATION_DEG = 51.64;
export const ISS_ORBITAL_PERIOD_SEC = 5574;
export const EARTH_SIDEREAL_PERIOD_SEC = 86164;

const ISS_INCLINATION_RAD = ISS_INCLINATION_DEG * DEG;
const ISS_MEAN_MOTION_RAD_S = (2 * Math.PI) / ISS_ORBITAL_PERIOD_SEC;
const EARTH_ROTATION_DEG_S = 360 / EARTH_SIDEREAL_PERIOD_SEC;
const NODAL_REGRESSION_DEG_S = -5.0 / 86400; // ~ -5 deg/day J2 nodal regression
const EPOCH_UNIX_SEC = 1715000000;
const EPOCH_ASCENDING_NODE_LON_DEG = -28.4;

export interface IssTelemetry {
  lat: number;          // -90..90 deg
  lon: number;          // -180..180 deg (East-positive)
  altitudeKm: number;   // ~415 km
  velocityKmh: number;  // ~27600 km/h
  visibility: "daylight" | "eclipsed";
  footprintKm: number;  // ~4480 km
  timestamp: number;    // unix seconds
  source: "live" | "propagated";
  headingDeg: number;   // instantaneous ground-track heading
}

interface WhereTheIssResponse {
  id?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  velocity?: number;
  visibility?: string;
  footprint?: number;
  timestamp?: number;
}

/**
 * Computes instantaneous ground-track heading (degrees clockwise from North, 0..360)
 * for an orbit with inclination `ISS_INCLINATION_DEG` at argument of latitude `uRad`.
 */
function computeGroundTrackHeadingDeg(uRad: number): number {
  const cosI = Math.cos(ISS_INCLINATION_RAD);
  const sinI = Math.sin(ISS_INCLINATION_RAD);
  const cosU = Math.cos(uRad);
  const sinU = Math.sin(uRad);

  const sinLat = Math.max(-1, Math.min(1, sinI * sinU));
  const cosLat = Math.max(1e-5, Math.sqrt(Math.max(0, 1 - sinLat * sinLat)));

  // Northward angular velocity component (rad/s)
  const dLatDt = (ISS_MEAN_MOTION_RAD_S * sinI * cosU) / cosLat;

  // Eastward angular velocity component in inertial frame minus Earth rotation (rad/s)
  const dLonInertialDt = (ISS_MEAN_MOTION_RAD_S * cosI) / (cosLat * cosLat);
  const earthRotRadS = (EARTH_ROTATION_DEG_S - NODAL_REGRESSION_DEG_S) * DEG;
  const dLonGroundDt = (dLonInertialDt - earthRotRadS) * cosLat;

  const headingRad = Math.atan2(dLonGroundDt, dLatDt);
  return ((headingRad / DEG) % 360 + 360) % 360;
}

/**
 * Infers the argument of latitude `u` (radians in [-PI, PI]) from a latitude and
 * ground-track heading so live fixes can be dead-reckoned seamlessly along the
 * 51.64° inclined orbital plane.
 */
function inferArgumentOfLatitudeRad(latDeg: number, headingDeg?: number): number {
  const sinI = Math.sin(ISS_INCLINATION_RAD);
  const ratio = Math.max(-1, Math.min(1, Math.sin(latDeg * DEG) / sinI));
  const uAscending = Math.asin(ratio); // in [-PI/2, PI/2], ascending (northbound)
  if (headingDeg === undefined || Number.isNaN(headingDeg)) {
    return uAscending;
  }
  // Normalize heading into [0, 360): northbound is (-90..90), southbound is (90..270)
  const normHeading = ((headingDeg % 360) + 360) % 360;
  const isSouthbound = normHeading > 90 && normHeading < 270;
  if (!isSouthbound) {
    return uAscending;
  }
  return uAscending >= 0 ? Math.PI - uAscending : -Math.PI - uAscending;
}

/**
 * Deterministic inclined-orbit propagator (`inclination = 51.64°`, `orbitalPeriodSec = 5574`,
 * Earth sidereal rotation regression) calibrated to a real epoch so that even when offline
 * or before the first API response returns, it yields a realistic, continuously advancing ISS state.
 */
export function propagateIssAnalytical(
  unixSec = Date.now() / 1000,
): IssTelemetry {
  const dt = unixSec - EPOCH_UNIX_SEC;
  const u = dt * ISS_MEAN_MOTION_RAD_S;

  const sinLat = Math.sin(ISS_INCLINATION_RAD) * Math.sin(u);
  const lat = Math.asin(Math.max(-1, Math.min(1, sinLat))) / DEG;

  const orbitalLonOffset =
    Math.atan2(
      Math.cos(ISS_INCLINATION_RAD) * Math.sin(u),
      Math.cos(u),
    ) / DEG;

  const nodeLon =
    EPOCH_ASCENDING_NODE_LON_DEG +
    dt * (NODAL_REGRESSION_DEG_S - EARTH_ROTATION_DEG_S);
  const lon = normalizeLon(nodeLon + orbitalLonOffset);

  // Subtle realistic orbital altitude and speed harmonic variations
  const altitudeKm = 416.5 + 3.2 * Math.cos(u - 0.6);
  const velocityKmh = 27585 - 18 * Math.cos(u - 0.6);
  const footprintKm = 4485 + 16 * Math.cos(u - 0.6);

  // Approximate orbital daylight/eclipse cycle
  const sunPhase = ((u / (2 * Math.PI)) % 1 + 1) % 1;
  const visibility: "daylight" | "eclipsed" =
    sunPhase > 0.34 && sunPhase < 0.66 ? "eclipsed" : "daylight";

  const headingDeg = computeGroundTrackHeadingDeg(u);

  return {
    lat,
    lon,
    altitudeKm,
    velocityKmh,
    visibility,
    footprintKm,
    timestamp: unixSec,
    source: "propagated",
    headingDeg,
  };
}

/**
 * Smoothly advances a live or propagated `IssTelemetry` state forward by `elapsedSec`
 * seconds along its 51.64° inclined orbital trajectory (using `headingDeg` / orbital
 * angular rate `360 / 5574` deg/s and Earth rotation `-360 / 86164` deg/s) so `useFrame`
 * in Three.js can animate the ISS at 60 FPS without stepping.
 */
export function advanceIssDeadReckoning(
  base: IssTelemetry,
  elapsedSec: number,
): IssTelemetry {
  if (!Number.isFinite(elapsedSec) || Math.abs(elapsedSec) < 1e-6) {
    return { ...base };
  }

  const u0 = inferArgumentOfLatitudeRad(base.lat, base.headingDeg);
  const lonOrbital0 =
    Math.atan2(
      Math.cos(ISS_INCLINATION_RAD) * Math.sin(u0),
      Math.cos(u0),
    ) / DEG;
  const ascendingNodeLon0 = normalizeLon(base.lon - lonOrbital0);

  const u1 = u0 + elapsedSec * ISS_MEAN_MOTION_RAD_S;
  const sinLat1 = Math.sin(ISS_INCLINATION_RAD) * Math.sin(u1);
  const lat1 = Math.asin(Math.max(-1, Math.min(1, sinLat1))) / DEG;

  const lonOrbital1 =
    Math.atan2(
      Math.cos(ISS_INCLINATION_RAD) * Math.sin(u1),
      Math.cos(u1),
    ) / DEG;
  const ascendingNodeLon1 =
    ascendingNodeLon0 +
    elapsedSec * (NODAL_REGRESSION_DEG_S - EARTH_ROTATION_DEG_S);
  const lon1 = normalizeLon(ascendingNodeLon1 + lonOrbital1);

  const headingDeg1 = computeGroundTrackHeadingDeg(u1);

  return {
    ...base,
    lat: lat1,
    lon: lon1,
    headingDeg: headingDeg1,
    timestamp: base.timestamp + elapsedSec,
  };
}

/**
 * Computes a closed 3D great-circle ring of `segments + 1` points at `radius`
 * that passes directly through `latLonToVector3(lat, lon, radius)` along the
 * orbital plane defined by `headingDeg` (aligned with the 51.64° orbital inclination).
 */
export function computeIssOrbitRingPoints(
  lat: number,
  lon: number,
  headingDeg: number,
  radius: number,
  segments = 160,
): Vector3[] {
  const count = Math.max(8, Math.floor(segments));
  const p0Unit = latLonToVector3(lat, lon, 1).normalize();

  // Construct local tangent basis at (lat, lon): East and North unit vectors
  const worldUp = new Vector3(0, 1, 0);
  const east = new Vector3().crossVectors(worldUp, p0Unit);
  if (east.lengthSq() < 1e-8) {
    east.set(0, 0, -1);
  } else {
    east.normalize();
  }
  const north = new Vector3().crossVectors(p0Unit, east).normalize();

  // Align tangent direction with headingDeg while ensuring the great circle reaches ~51.64° inclination
  const headingRad = (Number.isFinite(headingDeg) ? headingDeg : 51.64) * DEG;
  const tangent = new Vector3()
    .addScaledVector(north, Math.cos(headingRad))
    .addScaledVector(east, Math.sin(headingRad))
    .normalize();

  const points: Vector3[] = [];
  for (let i = 0; i <= count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const pt = new Vector3()
      .addScaledVector(p0Unit, Math.cos(theta) * radius)
      .addScaledVector(tangent, Math.sin(theta) * radius);
    points.push(pt);
  }
  return points;
}

// Singleton live/propagated state & subscriber management
let baseFix: IssTelemetry = propagateIssAnalytical(Date.now() / 1000);
let baseFixReceivedAtMs = Date.now();
let prevLiveFix: { lat: number; lon: number; timestamp: number } | null = null;
let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let inFlightController: AbortController | null = null;
const subscribers = new Set<(telemetry: IssTelemetry) => void>();

function notifySubscribers(): void {
  const snapshot = getLatestIssTelemetry();
  for (const listener of subscribers) {
    listener(snapshot);
  }
}

function computeSphericalBearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number | null {
  const p1 = latLonToVector3(lat1, lon1, 1);
  const p2 = latLonToVector3(lat2, lon2, 1);
  if (p1.distanceToSquared(p2) < 1e-10) return null;

  const worldUp = new Vector3(0, 1, 0);
  const east = new Vector3().crossVectors(worldUp, p1).normalize();
  const north = new Vector3().crossVectors(p1, east).normalize();
  const delta = new Vector3().subVectors(p2, p1);
  const nComp = delta.dot(north);
  const eComp = delta.dot(east);
  if (Math.abs(nComp) < 1e-9 && Math.abs(eComp) < 1e-9) return null;

  return ((Math.atan2(eComp, nComp) / DEG) % 360 + 360) % 360;
}

async function pollWhereTheIssOnce(): Promise<void> {
  if (typeof fetch !== "function") return;
  inFlightController?.abort();
  const controller = new AbortController();
  inFlightController = controller;

  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(4500)
      : undefined;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  if (!timeoutSignal) {
    timeoutId = setTimeout(() => controller.abort(), 4500);
  }

  try {
    const res = await fetch(
      `https://api.wheretheiss.at/v1/satellites/${ISS_NORAD_ID}`,
      {
        signal: timeoutSignal ?? controller.signal,
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok) return;
    const data = (await res.json()) as WhereTheIssResponse;
    if (
      typeof data.latitude !== "number" ||
      typeof data.longitude !== "number" ||
      !Number.isFinite(data.latitude) ||
      !Number.isFinite(data.longitude)
    ) {
      return;
    }

    const lat = Math.max(-90, Math.min(90, data.latitude));
    const lon = normalizeLon(data.longitude);
    const timestamp =
      typeof data.timestamp === "number" && Number.isFinite(data.timestamp)
        ? data.timestamp
        : Date.now() / 1000;

    let headingDeg: number | null = null;
    if (
      prevLiveFix &&
      timestamp > prevLiveFix.timestamp &&
      timestamp - prevLiveFix.timestamp < 120
    ) {
      headingDeg = computeSphericalBearingDeg(
        prevLiveFix.lat,
        prevLiveFix.lon,
        lat,
        lon,
      );
    }
    if (headingDeg === null) {
      const uEst = inferArgumentOfLatitudeRad(lat, baseFix.headingDeg);
      headingDeg = computeGroundTrackHeadingDeg(uEst);
    }

    prevLiveFix = { lat, lon, timestamp };
    baseFix = {
      lat,
      lon,
      altitudeKm:
        typeof data.altitude === "number" && Number.isFinite(data.altitude)
          ? data.altitude
          : 416.5,
      velocityKmh:
        typeof data.velocity === "number" && Number.isFinite(data.velocity)
          ? data.velocity
          : 27585,
      visibility: data.visibility === "eclipsed" ? "eclipsed" : "daylight",
      footprintKm:
        typeof data.footprint === "number" && Number.isFinite(data.footprint)
          ? data.footprint
          : 4485,
      timestamp,
      source: "live",
      headingDeg,
    };
    baseFixReceivedAtMs = Date.now();
    notifySubscribers();
  } catch {
    // Keep dead-reckoning from the most recent fix or analytical propagator
    if (baseFix.source === "propagated") {
      baseFix = propagateIssAnalytical(Date.now() / 1000);
      baseFixReceivedAtMs = Date.now();
      notifySubscribers();
    }
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
  }
}

function startPollingIfNeeded(): void {
  if (pollIntervalId !== null || !("window" in globalThis)) return;
  void pollWhereTheIssOnce();
  pollIntervalId = setInterval(() => {
    void pollWhereTheIssOnce();
  }, 6000);
}

function stopPollingIfIdle(): void {
  if (subscribers.size > 0) return;
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  inFlightController?.abort();
  inFlightController = null;
}

/**
 * Returns the instantaneous ISS telemetry, dead-reckoned smoothly from the last
 * fix to `Date.now() / 1000` so both React HUD components and Three.js `useFrame`
 * loops can read the exact instantaneous position without re-render overhead.
 */
export function getLatestIssTelemetry(nowMs = Date.now()): IssTelemetry {
  if (baseFix.source === "live") {
    const elapsedSec = Math.max(0, (nowMs - baseFixReceivedAtMs) / 1000);
    // If live fix is fresh (< 90 s), dead-reckon from it; otherwise fall back to analytical
    if (elapsedSec <= 90) {
      return advanceIssDeadReckoning(baseFix, elapsedSec);
    }
  }
  return propagateIssAnalytical(nowMs / 1000);
}

/**
 * Subscribes to ISS telemetry updates and starts polling when at least one subscriber is active.
 */
export function subscribeIssTracker(
  listener: (telemetry: IssTelemetry) => void,
): () => void {
  subscribers.add(listener);
  startPollingIfNeeded();
  return () => {
    subscribers.delete(listener);
    stopPollingIfIdle();
  };
}

/**
 * React hook that tracks real-time ISS telemetry (polling every 6 s + local 1 s HUD refresh).
 */
export function useIssTracker(enabled = true): IssTelemetry {
  const [telemetry, setTelemetry] = useState<IssTelemetry>(() =>
    getLatestIssTelemetry(),
  );

  useEffect(() => {
    if (!enabled) return;
    setTelemetry(getLatestIssTelemetry());
    const unsubscribe = subscribeIssTracker((next) => {
      setTelemetry(next);
    });
    const hudTick = setInterval(() => {
      setTelemetry(getLatestIssTelemetry());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(hudTick);
    };
  }, [enabled]);

  return telemetry;
}

// Re-export vector3ToLatLon helper for callers that inspect orbit ring points
export { vector3ToLatLon };
