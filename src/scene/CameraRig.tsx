import { useEffect, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { Vector3 } from "three";
import { cameraBus } from "@/engine/camera";
import { CAMERA } from "@/lib/constants";
import { latLonToVector3, vector3ToLatLon } from "@/lib/geo";
import { useAppStore } from "@/store/useAppStore";
import { surfaceRadius } from "./moon/heightSampler";
import { moonTileManager } from "./moon/tileManager";

const _camPos = new Vector3();
const _targetPos = new Vector3();
const _interpDir = new Vector3();
const _interpPos = new Vector3();
const _interpTarget = new Vector3();
const _interpOffset = new Vector3();

type NavAction =
  | "left"
  | "right"
  | "up"
  | "down"
  | "zoomIn"
  | "zoomOut";

interface ActiveFlight {
  id: number;
  startDir: Vector3;
  orthoDir: Vector3;
  centralAngle: number;
  startRadius: number;
  endRadius: number;
  peakRadius: number;
  flightMode: "toSite" | "toOrbit";
  startTarget: Vector3;
  endTarget: Vector3;
  startOffset: Vector3;
  endOffset: Vector3;
  minDistance: number;
  elapsed: number;
  duration: number;
  resolve: () => void;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function buildOrthoBasis(startDir: Vector3, endDir: Vector3): Vector3 {
  const dot = Math.max(-1, Math.min(1, startDir.dot(endDir)));
  const ortho = endDir.clone().addScaledVector(startDir, -dot);
  if (ortho.lengthSq() > 1e-6) {
    return ortho.normalize();
  }
  const fallback =
    Math.abs(startDir.y) < 0.9
      ? new Vector3(0, 1, 0)
      : new Vector3(1, 0, 0);
  return fallback.projectOnPlane(startDir).normalize();
}

function getEndRadius(c: CameraControlsImpl): number {
  const internal = c as unknown as { _sphericalEnd?: { radius: number } };
  if (typeof internal._sphericalEnd?.radius === "number") {
    return internal._sphericalEnd.radius;
  }
  return c.distance;
}

function ensureOriginTarget(c: CameraControlsImpl, enableTransition: boolean) {
  c.getTarget(_targetPos);
  if (_targetPos.lengthSq() > 1e-4) {
    void c.moveTo(0, 0, 0, enableTransition);
  }
}

export default function CameraRig() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const flightIdRef = useRef(0);
  const activeFlightRef = useRef<ActiveFlight | null>(null);
  const pressedActionsRef = useRef<Set<NavAction>>(new Set());
  const { size } = useThree();

  const mode = useAppStore((s) => s.mode);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);
  const setCameraFlying = useAppStore((s) => s.setCameraFlying);

  // Cancel active programmatic flight if the user manually drags or scrolls the globe
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    const onUserControl = () => {
      const active = activeFlightRef.current;
      if (active && active.elapsed > 0.12) {
        activeFlightRef.current = null;
        setCameraFlying(false);
        active.resolve();
      }
    };
    c.addEventListener("control", onUserControl);
    return () => {
      c.removeEventListener("control", onUserControl);
    };
  }, [setCameraFlying]);

  useEffect(() => {
    const cancelActiveFlight = () => {
      if (activeFlightRef.current) {
        const prev = activeFlightRef.current;
        activeFlightRef.current = null;
        setCameraFlying(false);
        prev.resolve();
      }
    };

    const startSmoothFlight = (params: {
      endPos: Vector3;
      endTarget: Vector3;
      endOffset: Vector3;
      minDistance: number;
      flightMode: "toSite" | "toOrbit";
      instant: boolean;
    }): Promise<void> => {
      const c = controlsRef.current;
      if (!c) return Promise.resolve();

      cancelActiveFlight();

      const myFlight = ++flightIdRef.current;
      const { endPos, endTarget, endOffset, minDistance, flightMode, instant } =
        params;

      c.minDistance = minDistance;

      if (instant) {
        setCameraFlying(false);
        void c.setFocalOffset(endOffset.x, endOffset.y, endOffset.z, false);
        void c.setLookAt(
          endPos.x,
          endPos.y,
          endPos.z,
          endTarget.x,
          endTarget.y,
          endTarget.z,
          false,
        );
        c.normalizeRotations();
        c.update(0);
        return Promise.resolve();
      }

      const startPos = new Vector3();
      const startTarget = new Vector3();
      const startOffset = new Vector3();
      c.getPosition(startPos, false);
      c.getTarget(startTarget, false);
      c.getFocalOffset(startOffset, false);

      const startRadius = Math.max(CAMERA.minDistance, startPos.length());
      const endRadius = Math.max(CAMERA.minDistance, endPos.length());
      const startDir =
        startPos.lengthSq() > 1e-6
          ? startPos.clone().normalize()
          : new Vector3(1, 0, 0);
      const endDir =
        endPos.lengthSq() > 1e-6
          ? endPos.clone().normalize()
          : new Vector3(1, 0, 0);

      const dot = Math.max(-1, Math.min(1, startDir.dot(endDir)));
      const centralAngle = Math.acos(dot);
      const orthoDir = buildOrthoBasis(startDir, endDir);

      const midLinear = 0.5 * (startRadius + endRadius);
      const hopBoost = Math.min(
        0.95,
        Math.sin(centralAngle * 0.5) * 0.9 + centralAngle * 0.12,
      );
      const minClearance =
        CAMERA.minDistance + Math.sin(centralAngle * 0.5) * 0.85;
      const peakRadius = Math.max(midLinear + hopBoost, minClearance);

      const posDelta = startPos.distanceTo(endPos);
      const targetDelta = startTarget.distanceTo(endTarget);

      if (posDelta < 1e-3 && targetDelta < 1e-3) {
        void c.setFocalOffset(endOffset.x, endOffset.y, endOffset.z, true);
        return Promise.resolve();
      }

      const duration = Math.min(
        2.6,
        Math.max(
          1.15,
          1.1 +
            (centralAngle / Math.PI) * 1.15 +
            Math.min(0.4, Math.abs(startRadius - endRadius) * 0.18),
        ),
      );

      setCameraFlying(true);

      return new Promise<void>((resolve) => {
        activeFlightRef.current = {
          id: myFlight,
          startDir,
          orthoDir,
          centralAngle,
          startRadius,
          endRadius,
          peakRadius,
          flightMode,
          startTarget,
          endTarget: endTarget.clone(),
          startOffset,
          endOffset: endOffset.clone(),
          minDistance,
          elapsed: 0,
          duration,
          resolve,
        };
      });
    };

    const getLocalSurfaceRadius = (c: CameraControlsImpl) => {
      c.getPosition(_camPos);
      const { lat, lon } = vector3ToLatLon(_camPos);
      return surfaceRadius(lat, lon);
    };

    const stepZoom = (direction: "in" | "out", instantArg?: boolean) => {
      const c = controlsRef.current;
      if (!c) return;
      cancelActiveFlight();
      ++flightIdRef.current;
      setCameraFlying(false);

      const instant = Boolean(instantArg);
      ensureOriginTarget(c, !instant);

      const r = getLocalSurfaceRadius(c);
      const minDist = Math.max(CAMERA.minDistance, r + CAMERA.minAltitude);
      c.minDistance = minDist;

      const curEndRadius = Math.max(minDist, getEndRadius(c));
      const curAltitude = Math.max(CAMERA.minAltitude, curEndRadius - r);
      const factor = direction === "in" ? -0.24 : 0.3;
      const nextRadius = Math.max(
        minDist,
        Math.min(CAMERA.maxDistance, curEndRadius + curAltitude * factor),
      );

      c.smoothTime = instant ? 0.01 : 0.14;
      void c.dollyTo(nextRadius, !instant);
    };

    const stepRotate = (
      dAzimuth: number,
      dPolar: number,
      instantArg?: boolean,
    ) => {
      const c = controlsRef.current;
      if (!c) return;
      cancelActiveFlight();
      ++flightIdRef.current;
      setCameraFlying(false);

      const instant = Boolean(instantArg);
      ensureOriginTarget(c, !instant);

      c.smoothTime = instant ? 0.01 : 0.14;
      void c.rotate(dAzimuth, dPolar, !instant);
    };

    const unregister = cameraBus.register({
      flyToLatLon: async (lat, lon, opts) => {
        const instant = Boolean(opts?.instant);
        const altitude = Math.max(
          CAMERA.minAltitude,
          opts?.altitude ?? CAMERA.siteAltitude,
        );

        // Pre-warm highest-res color & normal tiles for the target site before arrival
        moonTileManager.preloadSite(lat, lon);

        const r = surfaceRadius(lat, lon);
        const minDist = Math.max(CAMERA.minDistance, r + CAMERA.minAltitude);
        const targetDist = Math.max(minDist, r + altitude);
        const camDest = latLonToVector3(lat, lon, targetDist);

        await startSmoothFlight({
          endPos: camDest,
          endTarget: new Vector3(0, 0, 0),
          endOffset: new Vector3(0, 0, 0),
          minDistance: minDist,
          flightMode: "toSite",
          instant,
        });
      },

      flyOverview: async (
        lat,
        lon,
        distance = CAMERA.homeDistance * 0.88,
        instantArg,
      ) => {
        const instant = Boolean(instantArg);
        moonTileManager.preloadSite(lat, lon);
        const dest = latLonToVector3(lat, lon, distance);

        await startSmoothFlight({
          endPos: dest,
          endTarget: new Vector3(0, 0, 0),
          endOffset: new Vector3(0, 0, 0),
          minDistance: CAMERA.minDistance,
          flightMode: "toOrbit",
          instant,
        });
      },

      flyEarthrise: async (instantArg) => {
        const instant = Boolean(instantArg);
        // Position camera over the lunar farside approach looking past the sunlit limb toward Earth
        const camPos = latLonToVector3(-5, -178, 2.55);
        const lookTarget = latLonToVector3(5, 22, 0.45);

        await startSmoothFlight({
          endPos: camPos,
          endTarget: lookTarget,
          endOffset: new Vector3(0, 0, 0),
          minDistance: CAMERA.minDistance,
          flightMode: "toOrbit",
          instant,
        });
      },

      goHome: async (instantArg) => {
        const c = controlsRef.current;
        if (!c) return;
        const instant = Boolean(instantArg);

        c.getPosition(_camPos, false);
        const dir =
          _camPos.lengthSq() > 0.01
            ? _camPos.clone().normalize()
            : new Vector3(1, 0.12, 0).normalize();
        const home = dir.multiplyScalar(CAMERA.homeDistance);

        await startSmoothFlight({
          endPos: home,
          endTarget: new Vector3(0, 0, 0),
          endOffset: new Vector3(0, 0, 0),
          minDistance: CAMERA.minDistance,
          flightMode: "toOrbit",
          instant,
        });
      },

      zoomIn: (instantArg) => {
        stepZoom("in", instantArg);
      },

      zoomOut: (instantArg) => {
        stepZoom("out", instantArg);
      },

      rotateBy: (dAzimuth, dPolar, instantArg) => {
        stepRotate(dAzimuth, dPolar, instantArg);
      },
    });

    return unregister;
  }, [setCameraFlying]);

  // Global keyboard navigation for Moon rotation (Arrow keys / WASD) and Zoom (+ / - / PageUp / PageDown)
  useEffect(() => {
    const mapKeyToAction = (e: KeyboardEvent): NavAction | null => {
      if (e.ctrlKey || e.metaKey || e.altKey) return null;

      if (e.key === "ArrowUp") {
        return e.shiftKey ? "zoomIn" : "up";
      }
      if (e.key === "ArrowDown") {
        return e.shiftKey ? "zoomOut" : "down";
      }
      if (e.key === "ArrowLeft") return "left";
      if (e.key === "ArrowRight") return "right";

      if (
        e.key === "+" ||
        e.key === "=" ||
        e.code === "NumpadAdd" ||
        e.key === "PageUp"
      ) {
        return "zoomIn";
      }
      if (
        e.key === "-" ||
        e.key === "_" ||
        e.code === "NumpadSubtract" ||
        e.key === "PageDown"
      ) {
        return "zoomOut";
      }

      if (!e.shiftKey) {
        const lower = e.key.toLowerCase();
        if (lower === "w") return "up";
        if (lower === "s") return "down";
        if (lower === "a") return "left";
        if (lower === "d") return "right";
        if (lower === "e" || lower === "z") return "zoomIn";
        if (lower === "q" || lower === "x") return "zoomOut";
      }

      return null;
    };

    const isEditableTarget = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
      }
      return Boolean(el.isContentEditable);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const state = useAppStore.getState();
      if (state.sourcesDrawerOpen || state.siteIndexOpen) return;

      const action = mapKeyToAction(e);
      if (!action) return;

      e.preventDefault();

      if (state.mode === "tour" && !state.tourPaused) {
        state.setTourPaused(true);
      }

      const c = controlsRef.current;
      if (!c) return;

      pressedActionsRef.current.add(action);

      // On initial key press, also fire an immediate step so quick single taps feel crisp
      if (!e.repeat) {
        c.getPosition(_camPos);
        const { lat, lon } = vector3ToLatLon(_camPos);
        const r = surfaceRadius(lat, lon);
        const altitude = Math.max(CAMERA.minAltitude, _camPos.length() - r);
        const stepRad = Math.max(0.008, Math.min(0.16, altitude * 0.12));

        if (action === "left") {
          cameraBus.rotateBy(-stepRad, 0);
        } else if (action === "right") {
          cameraBus.rotateBy(stepRad, 0);
        } else if (action === "up") {
          cameraBus.rotateBy(0, -stepRad);
        } else if (action === "down") {
          cameraBus.rotateBy(0, stepRad);
        } else if (action === "zoomIn") {
          cameraBus.zoomIn();
        } else if (action === "zoomOut") {
          cameraBus.zoomOut();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const action = mapKeyToAction(e);
      if (action) {
        pressedActionsRef.current.delete(action);
      }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        pressedActionsRef.current.delete("up");
        pressedActionsRef.current.delete("down");
        pressedActionsRef.current.delete("zoomIn");
        pressedActionsRef.current.delete("zoomOut");
      }
    };

    const onBlur = () => {
      pressedActionsRef.current.clear();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // Offset camera framing on desktop only in "intro" mode so the left editorial column never covers the lunar limb.
  // In explore/tour modes, keep focalOffset at (0, 0, 0) so clicked sites stay centered when zooming in and out.
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    const isDesktop = size.width >= 1024;
    const offsetX = isDesktop && mode === "intro" ? -0.48 : 0;
    if (activeFlightRef.current) {
      activeFlightRef.current.endOffset.set(offsetX, 0, 0);
      return;
    }
    void c.setFocalOffset(offsetX, 0, 0, true);
  }, [mode, size.width]);

  useFrame((_, delta) => {
    const c = controlsRef.current;
    if (!c) return;

    const actions = pressedActionsRef.current;
    if (actions.size > 0 && activeFlightRef.current) {
      const prev = activeFlightRef.current;
      activeFlightRef.current = null;
      setCameraFlying(false);
      prev.resolve();
    }

    const flight = activeFlightRef.current;
    if (flight) {
      flight.elapsed += Math.min(delta, 0.1);
      const rawT = Math.min(1, flight.elapsed / flight.duration);
      const s = easeInOutCubic(rawT);

      // 1. Great-circle spherical direction around the Moon
      const theta = flight.centralAngle * s;
      _interpDir
        .copy(flight.startDir)
        .multiplyScalar(Math.cos(theta))
        .addScaledVector(flight.orthoDir, Math.sin(theta));

      // 2. Smooth orbital altitude profile (arcs over terrain; never clips through Moon)
      let radius: number;
      if (flight.startRadius < 1.85 && flight.endRadius < 1.85) {
        const midLinear = 0.5 * (flight.startRadius + flight.endRadius);
        const linearR =
          flight.startRadius + (flight.endRadius - flight.startRadius) * s;
        radius =
          linearR + (flight.peakRadius - midLinear) * Math.sin(s * Math.PI);
      } else if (flight.flightMode === "toSite" && flight.startRadius >= 1.85) {
        const exponent = 1.0 + (flight.centralAngle / Math.PI) * 0.7;
        const sR = Math.pow(s, exponent);
        radius =
          flight.startRadius + (flight.endRadius - flight.startRadius) * sR;
      } else if (flight.flightMode === "toOrbit" && flight.startRadius < 1.85) {
        const exponent = 1.0 + (flight.centralAngle / Math.PI) * 0.7;
        const sR = 1 - Math.pow(1 - s, exponent);
        radius =
          flight.startRadius + (flight.endRadius - flight.startRadius) * sR;
      } else {
        const midLinear = 0.5 * (flight.startRadius + flight.endRadius);
        const linearR =
          flight.startRadius + (flight.endRadius - flight.startRadius) * s;
        const safetyBoost = Math.max(0, flight.peakRadius - midLinear);
        radius = linearR + safetyBoost * Math.sin(s * Math.PI);
      }

      _interpPos.copy(_interpDir).multiplyScalar(radius);
      _interpTarget.lerpVectors(flight.startTarget, flight.endTarget, s);
      _interpOffset.lerpVectors(flight.startOffset, flight.endOffset, s);

      c.minDistance = flight.minDistance;
      void c.setFocalOffset(
        _interpOffset.x,
        _interpOffset.y,
        _interpOffset.z,
        false,
      );
      void c.setLookAt(
        _interpPos.x,
        _interpPos.y,
        _interpPos.z,
        _interpTarget.x,
        _interpTarget.y,
        _interpTarget.z,
        false,
      );
      c.normalizeRotations();
      c.update(0);

      if (rawT >= 1) {
        activeFlightRef.current = null;
        if (flightIdRef.current === flight.id) {
          c.smoothTime = 0.18;
          setCameraFlying(false);
        }
        flight.resolve();
      }
      return;
    }

    c.getPosition(_camPos);
    const { lat, lon } = vector3ToLatLon(_camPos);
    const localR = surfaceRadius(lat, lon);
    const minDist = Math.max(CAMERA.minDistance, localR + CAMERA.minAltitude);
    c.minDistance = minDist;
    if (getEndRadius(c) < minDist - 1e-4) {
      void c.dollyTo(minDist, false);
    }

    const altitude = Math.max(CAMERA.minAltitude, _camPos.length() - localR);
    const speed = Math.max(0.035, Math.min(1.0, altitude * 0.85));
    c.azimuthRotateSpeed = speed;
    c.polarRotateSpeed = speed;
    c.dollySpeed = Math.max(0.08, Math.min(1.2, altitude * 1.15));

    if (actions.size > 0) {
      ++flightIdRef.current;
      ensureOriginTarget(c, false);
      c.smoothTime = 0.12;

      const clampedDelta = Math.min(delta, 0.05);
      const rotRate = Math.max(0.03, Math.min(1.15, altitude * 0.85));
      let dAz = 0;
      let dPol = 0;
      if (actions.has("left")) dAz -= rotRate * clampedDelta;
      if (actions.has("right")) dAz += rotRate * clampedDelta;
      if (actions.has("up")) dPol -= rotRate * clampedDelta;
      if (actions.has("down")) dPol += rotRate * clampedDelta;
      if (dAz !== 0 || dPol !== 0) {
        void c.rotate(dAz, dPol, true);
      }

      if (actions.has("zoomIn") || actions.has("zoomOut")) {
        const curEndRadius = Math.max(minDist, getEndRadius(c));
        const curAlt = Math.max(CAMERA.minAltitude, curEndRadius - localR);
        const zoomRate = actions.has("zoomIn") ? -1.35 : 1.55;
        const nextRadius = Math.max(
          minDist,
          Math.min(
            CAMERA.maxDistance,
            curEndRadius + curAlt * zoomRate * clampedDelta,
          ),
        );
        void c.dollyTo(nextRadius, true);
      }
      return;
    }

    // Gentle orbital drift on the Intro welcome screen when idle
    if (mode === "intro" && !reduceMotion && !c.active) {
      void c.rotate(delta * 0.045, 0, false);
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={CAMERA.minDistance}
      maxDistance={CAMERA.maxDistance}
      dollyToCursor={false}
      smoothTime={0.18}
      draggingSmoothTime={0.14}
    />
  );
}
