import { useMemo, useRef, useState } from "react";
import { Html, Line } from "@react-three/drei";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  Group,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from "three";
import { cameraBus } from "@/engine/camera";
import { latLonToVector3, normalizeLon } from "@/lib/geo";
import {
  computeIssOrbitRingPoints,
  getLatestIssTelemetry,
} from "@/lib/issTracker";
import { useAppStore } from "@/store/useAppStore";

export const ISS_ORBIT_RADIUS = 1.072; // Visual low-Earth orbit altitude (~415 km scaled)
const SURFACE_TRACK_RADIUS = 1.003;
const NOOP_RAYCAST = () => {};

// Non-blended hit-sphere material: raycastable without transparent draw-list sorting or alpha blending
const ISS_HIT_SPHERE_MAT = new MeshBasicMaterial({
  colorWrite: false,
  depthWrite: false,
});

const _pos = new Vector3();
const _surfacePos = new Vector3();
const _up = new Vector3();
const _east = new Vector3();
const _north = new Vector3();
const _forward = new Vector3();
const _right = new Vector3();
const _rotMat = new Matrix4();
const _quat = new Quaternion();
const _surfaceQuat = new Quaternion();
const WORLD_UP = new Vector3(0, 1, 0);

function IssHudBadge({
  active,
  onSelect,
}: {
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] shadow-lg backdrop-blur-md transition ${
        active
          ? "border-sunlit bg-space-950/95 text-sunlit shadow-[0_0_20px_rgba(255,207,112,0.4)]"
          : "border-loro/65 bg-space-950/90 text-regolith-bright hover:border-loro"
      }`}
      title="Click to inspect live International Space Station telemetry"
    >
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
      <span className="font-bold tracking-wider text-loro">ISS LIVE</span>
    </button>
  );
}

export default function IssOrbit() {
  const issGroupRef = useRef<Group>(null);
  const surfaceFootprintRef = useRef<Group>(null);
  const nadirBeamRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  const issPanelOpen = useAppStore((s) => s.issPanelOpen);

  // Compute the closed great-circle orbital plane once on mount; the ISS travels along this great circle
  const { initialPos, orbitRingPoints } = useMemo(() => {
    const snap = getLatestIssTelemetry();
    return {
      initialPos: latLonToVector3(snap.lat, snap.lon, ISS_ORBIT_RADIUS),
      orbitRingPoints: computeIssOrbitRingPoints(
        snap.lat,
        snap.lon,
        snap.headingDeg,
        ISS_ORBIT_RADIUS,
        160,
      ),
    };
  }, []);

  const nadirBeamPoints = useMemo(
    () => [new Vector3(0, 0, 0), new Vector3(0, -(ISS_ORBIT_RADIUS - 1.0), 0)],
    [],
  );

  useFrame(() => {
    const live = getLatestIssTelemetry();
    latLonToVector3(live.lat, live.lon, ISS_ORBIT_RADIUS, _pos);
    latLonToVector3(live.lat, live.lon, SURFACE_TRACK_RADIUS, _surfacePos);

    _up.copy(_pos).normalize();
    _east.crossVectors(WORLD_UP, _up);
    if (_east.lengthSq() < 1e-6) {
      _east.set(0, 0, -1);
    } else {
      _east.normalize();
    }
    _north.crossVectors(_up, _east).normalize();

    const headingRad = (live.headingDeg * Math.PI) / 180;
    _forward
      .set(0, 0, 0)
      .addScaledVector(_north, Math.cos(headingRad))
      .addScaledVector(_east, Math.sin(headingRad))
      .normalize();
    _right.crossVectors(_forward, _up).normalize();

    _rotMat.makeBasis(_right, _up, _forward);
    _quat.setFromRotationMatrix(_rotMat);

    if (issGroupRef.current) {
      issGroupRef.current.position.copy(_pos);
      issGroupRef.current.quaternion.copy(_quat);
    }

    if (nadirBeamRef.current) {
      nadirBeamRef.current.position.copy(_pos);
      _surfaceQuat.setFromUnitVectors(WORLD_UP, _up);
      nadirBeamRef.current.quaternion.copy(_surfaceQuat);
    }

    if (surfaceFootprintRef.current) {
      surfaceFootprintRef.current.position.copy(_surfacePos);
      _surfaceQuat.setFromUnitVectors(WORLD_UP, _up);
      surfaceFootprintRef.current.quaternion.copy(_surfaceQuat);
    }
  });

  const handleSelectIss = (e?: ThreeEvent<MouseEvent>) => {
    e?.stopPropagation();
    const live = getLatestIssTelemetry();
    const store = useAppStore.getState();
    if (store.mode === "intro") {
      store.enterExplore(true);
    } else if (store.mode === "tour") {
      store.setTourPaused(true);
    }
    store.setSunDirection(normalizeLon(live.lon - 15), 12);
    store.setIssPanelOpen(true);
    void cameraBus.flyToLatLon(live.lat, live.lon, { altitude: 0.44 });
  };

  return (
    <group name="iss-real-orbit">
      {/* 51.64° Inclined Orbital Ground-Track Ring */}
      <Line
        points={orbitRingPoints}
        color="#5ce1ff"
        lineWidth={issPanelOpen || hovered ? 1.8 : 1.15}
        transparent
        opacity={issPanelOpen || hovered ? 0.55 : 0.28}
        raycast={NOOP_RAYCAST}
      />

      {/* Nadir Telemetry Laser Drop-Line from ISS to Sub-Satellite Point on Earth */}
      <group ref={nadirBeamRef} position={initialPos}>
        <Line
          points={nadirBeamPoints}
          color="#5ce1ff"
          lineWidth={1.2}
          transparent
          opacity={0.45}
          raycast={NOOP_RAYCAST}
        />
      </group>

      {/* Sub-Satellite Ground Footprint Reticle on Earth Surface */}
      <group ref={surfaceFootprintRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={NOOP_RAYCAST}>
          <ringGeometry args={[0.016, 0.022, 32]} />
          <meshBasicMaterial
            color="#5ce1ff"
            transparent
            opacity={0.55}
            side={DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={NOOP_RAYCAST}>
          <circleGeometry args={[0.005, 16]} />
          <meshBasicMaterial
            color="#ffcf70"
            transparent
            opacity={0.85}
            side={DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* 3D International Space Station Spacecraft Assembly */}
      <group ref={issGroupRef} position={initialPos}>
        {/* Generous Invisible Hit Sphere for Clicking ISS in Orbit */}
        <mesh
          material={ISS_HIT_SPHERE_MAT}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
            setHovered(true);
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
            setHovered(false);
          }}
          onClick={handleSelectIss}
        >
          <sphereGeometry args={[0.055, 12, 12]} />
        </mesh>

        {/* Integrated Truss Structure (Port-to-Starboard Backbone along X) */}
        <mesh raycast={NOOP_RAYCAST}>
          <boxGeometry args={[0.068, 0.0032, 0.0032]} />
          <meshStandardMaterial color="#d8dee9" metalness={0.65} roughness={0.35} />
        </mesh>

        {/* Pressurized Module Cluster (Destiny, Harmony, Zvezda, Zarya along Z) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} raycast={NOOP_RAYCAST}>
          <cylinderGeometry args={[0.0042, 0.0042, 0.034, 12]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.45} roughness={0.38} />
        </mesh>
        {/* Cross Node Modules (Columbus & Kibo Labs) */}
        <mesh
          position={[0, 0, 0.008]}
          rotation={[0, 0, Math.PI / 2]}
          raycast={NOOP_RAYCAST}
        >
          <cylinderGeometry args={[0.0032, 0.0032, 0.018, 10]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.45} roughness={0.4} />
        </mesh>

        {/* 8 Copper-Gold Solar Array Wings (4 Port, 4 Starboard) */}
        {[-0.028, -0.02, 0.02, 0.028].map((xOffset) => (
          <group key={xOffset} position={[xOffset, 0, 0]}>
            {/* Forward Solar Wing */}
            <mesh
              position={[0, 0, 0.017]}
              rotation={[0.25, 0, 0]}
              raycast={NOOP_RAYCAST}
            >
              <boxGeometry args={[0.0052, 0.0006, 0.026]} />
              <meshStandardMaterial
                color="#e59838"
                emissive="#8a4b08"
                emissiveIntensity={0.45}
                metalness={0.75}
                roughness={0.25}
              />
            </mesh>
            {/* Aft Solar Wing */}
            <mesh
              position={[0, 0, -0.017]}
              rotation={[0.25, 0, 0]}
              raycast={NOOP_RAYCAST}
            >
              <boxGeometry args={[0.0052, 0.0006, 0.026]} />
              <meshStandardMaterial
                color="#e59838"
                emissive="#8a4b08"
                emissiveIntensity={0.45}
                metalness={0.75}
                roughness={0.25}
              />
            </mesh>
          </group>
        ))}

        {/* Thermal Rejection Radiators */}
        {[-0.009, 0.009].map((xRad) => (
          <mesh
            key={xRad}
            position={[xRad, -0.002, -0.008]}
            raycast={NOOP_RAYCAST}
          >
            <boxGeometry args={[0.0038, 0.0004, 0.012]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        ))}

        {/* Orbital Beacon Core & Cyan Halo */}
        <mesh raycast={NOOP_RAYCAST}>
          <sphereGeometry args={[0.0055, 14, 14]} />
          <meshBasicMaterial color="#5ce1ff" toneMapped={false} />
        </mesh>
        <mesh raycast={NOOP_RAYCAST}>
          <sphereGeometry args={[0.014, 16, 16]} />
          <meshBasicMaterial
            color={issPanelOpen || hovered ? "#ffcf70" : "#5ce1ff"}
            transparent
            opacity={issPanelOpen || hovered ? 0.55 : 0.35}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Live Telemetry Floating HUD Badge in Orbit */}
        <Html
          position={[0, 0.032, 0]}
          center
          zIndexRange={[18, 0]}
          style={{ pointerEvents: "auto" }}
        >
          <IssHudBadge
            active={issPanelOpen || hovered}
            onSelect={() => handleSelectIss()}
          />
        </Html>
      </group>
    </group>
  );
}
