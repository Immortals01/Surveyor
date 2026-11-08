import { useEffect, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { Vector3 } from "three";
import { cameraBus } from "@/engine/camera";
import { CAMERA } from "@/lib/constants";
import { DEG, latLonToVector3 } from "@/lib/geo";
import { useAppStore } from "@/store/useAppStore";
import { surfaceRadius } from "./moon/heightSampler";

const _targetPos = new Vector3();
const _camPos = new Vector3();
const _curCamDir = new Vector3();

export default function CameraRig() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const flightIdRef = useRef(0);
  const { size } = useThree();

  const mode = useAppStore((s) => s.mode);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);
  const setCameraFlying = useAppStore((s) => s.setCameraFlying);

  useEffect(() => {
    const unregister = cameraBus.register({
      flyToLatLon: async (lat, lon, opts) => {
        const c = controlsRef.current;
        if (!c) return;

        const myFlight = ++flightIdRef.current;
        const instant =
          opts?.instant ?? useAppStore.getState().settings.reduceMotion;
        const altitude = opts?.altitude ?? CAMERA.siteAltitude;

        setCameraFlying(true);

        const r = surfaceRadius(lat, lon);
        const sitePoint = latLonToVector3(lat, lon, r);
        const siteDir = sitePoint.clone().normalize();

        c.getPosition(_camPos);
        const curDist = _camPos.length();
        _curCamDir.copy(_camPos).normalize();

        const angleDeg =
          Math.acos(Math.max(-1, Math.min(1, _curCamDir.dot(siteDir)))) / DEG;

        try {
          // Stage 1: swing around the Moon at safe orbital altitude so we never clip through terrain
          if (!instant && angleDeg > 34) {
            const safeRadius = Math.max(curDist, CAMERA.homeDistance * 0.72);
            const orbitStop = siteDir.clone().multiplyScalar(safeRadius);
            c.smoothTime = 0.48;
            await c.setLookAt(
              orbitStop.x,
              orbitStop.y,
              orbitStop.z,
              0,
              0,
              0,
              true,
            );
            if (flightIdRef.current !== myFlight) return;
          }

          // Stage 2: descend to an oblique orbital vantage point over the landing site
          const refVec =
            Math.abs(lat) > 74
              ? new Vector3(1, 0, 0)
              : new Vector3(0, lat > 15 ? -1 : -0.65, 0);
          const tiltAxis = refVec.projectOnPlane(siteDir);
          if (tiltAxis.lengthSq() < 1e-4) {
            tiltAxis.set(0, 0, 1).projectOnPlane(siteDir);
          }
          tiltAxis.normalize();

          const camDest = sitePoint
            .clone()
            .addScaledVector(siteDir, altitude)
            .addScaledVector(tiltAxis, altitude * 0.58);

          c.smoothTime = instant ? 0.01 : 0.55;
          await c.setLookAt(
            camDest.x,
            camDest.y,
            camDest.z,
            sitePoint.x,
            sitePoint.y,
            sitePoint.z,
            !instant,
          );
        } finally {
          if (flightIdRef.current === myFlight) {
            setCameraFlying(false);
          }
        }
      },

      flyOverview: async (lat, lon, distance = CAMERA.homeDistance * 0.88, instantArg) => {
        const c = controlsRef.current;
        if (!c) return;
        const myFlight = ++flightIdRef.current;
        const instant =
          instantArg ?? useAppStore.getState().settings.reduceMotion;

        setCameraFlying(true);
        const dest = latLonToVector3(lat, lon, distance);
        c.smoothTime = instant ? 0.01 : 0.6;
        try {
          await c.setLookAt(dest.x, dest.y, dest.z, 0, 0, 0, !instant);
        } finally {
          if (flightIdRef.current === myFlight) {
            setCameraFlying(false);
          }
        }
      },

      goHome: async (instantArg) => {
        const c = controlsRef.current;
        if (!c) return;
        const myFlight = ++flightIdRef.current;
        const instant =
          instantArg ?? useAppStore.getState().settings.reduceMotion;

        setCameraFlying(true);
        c.getPosition(_camPos);
        const dir =
          _camPos.lengthSq() > 0.01
            ? _camPos.clone().normalize()
            : new Vector3(1, 0.12, 0).normalize();
        const home = dir.multiplyScalar(CAMERA.homeDistance);
        c.smoothTime = instant ? 0.01 : 0.55;
        try {
          await c.setFocalOffset(0, 0, 0, !instant);
          await c.setLookAt(home.x, home.y, home.z, 0, 0, 0, !instant);
        } finally {
          if (flightIdRef.current === myFlight) {
            setCameraFlying(false);
          }
        }
      },
    });

    return unregister;
  }, [setCameraFlying]);

  // Offset camera framing slightly left on desktop when right-side SiteDrawer is open
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    const isDesktop = size.width >= 1024;
    if (selectedSiteId && isDesktop) {
      c.getPosition(_camPos);
      c.getTarget(_targetPos);
      const d = Math.max(0.08, _camPos.distanceTo(_targetPos));
      void c.setFocalOffset(d * 0.16, 0, 0, !reduceMotion);
    } else {
      void c.setFocalOffset(0, 0, 0, !reduceMotion);
    }
  }, [selectedSiteId, size.width, reduceMotion]);

  useFrame((_, delta) => {
    const c = controlsRef.current;
    if (!c) return;

    c.getPosition(_camPos);
    const altitude = Math.max(0.01, _camPos.length() - 1);
    const speed = Math.max(0.035, Math.min(1.0, altitude * 0.85));
    c.azimuthRotateSpeed = speed;
    c.polarRotateSpeed = speed;

    // Gentle orbital drift on the Intro welcome screen
    if (mode === "intro" && !reduceMotion) {
      c.azimuthAngle += delta * 0.045;
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={CAMERA.minDistance}
      maxDistance={CAMERA.maxDistance}
      dollyToCursor={false}
      smoothTime={0.45}
      draggingSmoothTime={0.14}
    />
  );
}
