import { describe, expect, it } from "bun:test";
import { angularDistanceDeg, latLonToVector3 } from "@/lib/geo";
import {
  advanceIssDeadReckoning,
  computeIssOrbitRingPoints,
  getLatestIssTelemetry,
  ISS_INCLINATION_DEG,
  ISS_ORBITAL_PERIOD_SEC,
  propagateIssAnalytical,
} from "./issTracker";

describe("ISS orbital tracker & propagator", () => {
  it("propagates deterministic ISS telemetry within the 51.64° orbital inclination envelope", () => {
    const t0 = 1715000000;
    for (let step = 0; step < 30; step++) {
      const state = propagateIssAnalytical(t0 + step * 185);
      expect(state.lat).toBeGreaterThanOrEqual(-ISS_INCLINATION_DEG - 1e-4);
      expect(state.lat).toBeLessThanOrEqual(ISS_INCLINATION_DEG + 1e-4);
      expect(state.lon).toBeGreaterThanOrEqual(-180);
      expect(state.lon).toBeLessThanOrEqual(180);
      expect(state.altitudeKm).toBeGreaterThan(400);
      expect(state.altitudeKm).toBeLessThan(430);
      expect(state.velocityKmh).toBeGreaterThan(27400);
      expect(state.velocityKmh).toBeLessThan(27800);
      expect(state.headingDeg).toBeGreaterThanOrEqual(0);
      expect(state.headingDeg).toBeLessThan(360);
      expect(state.source).toBe("propagated");
    }
  });

  it("reaches northern and southern inclination apexes (~51.64°) during a full orbit", () => {
    const t0 = 1715000000;
    const quarterPeriod = ISS_ORBITAL_PERIOD_SEC * 0.25;
    const northApex = propagateIssAnalytical(t0 + quarterPeriod);
    const southApex = propagateIssAnalytical(t0 + quarterPeriod * 3);

    expect(northApex.lat).toBeCloseTo(ISS_INCLINATION_DEG, 2);
    expect(southApex.lat).toBeCloseTo(-ISS_INCLINATION_DEG, 2);
  });

  it("advances dead reckoning smoothly along the inclined trajectory for 60 FPS animation", () => {
    const base = propagateIssAnalytical(1715001234);
    const step1 = advanceIssDeadReckoning(base, 0);
    expect(step1.lat).toBeCloseTo(base.lat, 6);
    expect(step1.lon).toBeCloseTo(base.lon, 6);

    const after10s = advanceIssDeadReckoning(base, 10);
    const distDeg = angularDistanceDeg(
      base.lat,
      base.lon,
      after10s.lat,
      after10s.lon,
    );
    // ISS moves ~0.64 deg in 10 seconds
    expect(distDeg).toBeGreaterThan(0.45);
    expect(distDeg).toBeLessThan(0.85);
    expect(after10s.timestamp).toBeCloseTo(base.timestamp + 10, 5);
  });

  it("distinguishes northbound vs southbound ground-track headings when dead reckoning", () => {
    const northboundBase = {
      ...propagateIssAnalytical(1715000400),
      lat: 20,
      lon: 15,
      headingDeg: 45, // North-East
    };
    const southboundBase = {
      ...northboundBase,
      headingDeg: 135, // South-East
    };

    const nextNorth = advanceIssDeadReckoning(northboundBase, 30);
    const nextSouth = advanceIssDeadReckoning(southboundBase, 30);

    expect(nextNorth.lat).toBeGreaterThan(northboundBase.lat);
    expect(nextSouth.lat).toBeLessThan(southboundBase.lat);
    expect(nextNorth.lon).toBeGreaterThan(northboundBase.lon);
    expect(nextSouth.lon).toBeGreaterThan(southboundBase.lon);
  });

  it("computes a closed 3D great-circle orbit ring passing directly through the ISS position", () => {
    const state = propagateIssAnalytical(1715002100);
    const radius = 1.065;
    const segments = 128;
    const ring = computeIssOrbitRingPoints(
      state.lat,
      state.lon,
      state.headingDeg,
      radius,
      segments,
    );

    expect(ring.length).toBe(segments + 1);

    const expectedStart = latLonToVector3(state.lat, state.lon, radius);
    expect(ring[0]!.distanceTo(expectedStart)).toBeLessThan(1e-6);
    expect(ring[ring.length - 1]!.distanceTo(expectedStart)).toBeLessThan(1e-6);

    for (const pt of ring) {
      expect(pt.length()).toBeCloseTo(radius, 5);
    }
  });

  it("returns valid instantaneous telemetry from getLatestIssTelemetry", () => {
    const latest = getLatestIssTelemetry(1715005000 * 1000);
    expect(Number.isFinite(latest.lat)).toBe(true);
    expect(Number.isFinite(latest.lon)).toBe(true);
    expect(latest.altitudeKm).toBeGreaterThan(400);
  });
});
