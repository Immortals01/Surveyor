import { describe, expect, it } from "bun:test";
import {
  angularDistanceDeg,
  latLonToVector3,
  normalizeLon,
  vector3ToLatLon,
} from "./geo";

describe("geo selenographic coordinate helpers", () => {
  it("maps sub-Earth point (0, 0) to +X", () => {
    const v = latLonToVector3(0, 0, 1);
    expect(v.x).toBeCloseTo(1, 6);
    expect(v.y).toBeCloseTo(0, 6);
    expect(v.z).toBeCloseTo(0, 6);
  });

  it("maps 90E equator to -Z (east is right when viewed from Earth +X)", () => {
    const v = latLonToVector3(0, 90, 1);
    expect(v.x).toBeCloseTo(0, 6);
    expect(v.y).toBeCloseTo(0, 6);
    expect(v.z).toBeCloseTo(-1, 6);
  });

  it("maps North Pole (90N) to +Y regardless of longitude", () => {
    for (const lon of [-180, -45, 0, 73, 180]) {
      const v = latLonToVector3(90, lon, 1);
      expect(v.x).toBeCloseTo(0, 6);
      expect(v.y).toBeCloseTo(1, 6);
      expect(v.z).toBeCloseTo(0, 6);
    }
  });

  it("round-trips arbitrary coordinates accurately", () => {
    const samples = [
      { lat: 0.6742, lon: 23.4731 }, // Apollo 11
      { lat: -2.4745, lon: -43.3398 }, // Surveyor 1
      { lat: 20.1911, lon: 30.7723 }, // Apollo 17
      { lat: -84.678, lon: -48.6937 }, // LCROSS South Pole
      { lat: 11.8494, lon: -93.2493 }, // LADEE farside
    ];

    for (const s of samples) {
      const v = latLonToVector3(s.lat, s.lon, 1.42);
      const back = vector3ToLatLon(v);
      expect(back.lat).toBeCloseTo(s.lat, 5);
      expect(back.lon).toBeCloseTo(s.lon, 5);
    }
  });

  it("normalizes 0..360 east longitudes into -180..180", () => {
    expect(normalizeLon(316.6602)).toBeCloseTo(-43.3398, 4);
    expect(normalizeLon(336.582)).toBeCloseTo(-23.418, 4);
    expect(normalizeLon(23.4731)).toBeCloseTo(23.4731, 4);
  });

  it("computes angular distance along great circles", () => {
    expect(angularDistanceDeg(0, 0, 0, 90)).toBeCloseTo(90, 5);
    expect(angularDistanceDeg(90, 0, -90, 0)).toBeCloseTo(180, 5);
  });
});
