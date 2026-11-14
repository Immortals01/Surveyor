import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, MeshBasicMaterial, Quaternion, Vector3 } from "three";
import { getMachinesForBody, type Machine } from "@/data/machines";
import { cameraBus } from "@/engine/camera";
import { latLonToVector3 } from "@/lib/geo";
import { useAppStore } from "@/store/useAppStore";
import { surfaceNormal, surfaceRadius } from "../moon/heightSampler";

const MachineMascot3D = lazy(() => import("@/hud/character/machines/MachineMascot3D"));

const UP = new Vector3(0, 1, 0);

function flyToMachine(machine: Machine) {
  const state = useAppStore.getState();

  // Machines that belong to a verified site open that site's dossier with its
  // character section already expanded. Only "elsewhere" objects such as Dawn
  // still use the standalone machine panel.
  if (machine.siteId) {
    state.selectSite(machine.siteId);
    state.setMachineAutoplay(true);
    void cameraBus.flyToLatLon(machine.placement.lat, machine.placement.lon);
    return;
  }

  state.openMachine(machine.id);
  if (machine.body === "belt") {
    void cameraBus.goHome();
    return;
  }
  void cameraBus.flyToLatLon(machine.placement.lat, machine.placement.lon);
}

function CastFigure({ machine }: { machine: Machine }) {
  const celestialBody = useAppStore((s) => s.celestialBody);
  const selectedMachineId = useAppStore((s) => s.selectedMachineId);
  const [show, setShow] = useState(true);
  const [hovered, setHovered] = useState(false);
  const root = useRef<Group>(null);
  const model = useRef<Group>(null);
  const hitMat = useRef<MeshBasicMaterial>(null);

  const { position, quaternion, normal } = useMemo(() => {
    const body = machine.body === "belt" ? "mars" : machine.body;
    const radius = surfaceRadius(machine.placement.lat, machine.placement.lon, body) + 0.004;
    const pos = latLonToVector3(machine.placement.lat, machine.placement.lon, radius);
    const nrm = surfaceNormal(machine.placement.lat, machine.placement.lon, undefined, body);
    return {
      position: pos,
      quaternion: new Quaternion().setFromUnitVectors(UP, nrm),
      normal: nrm,
    };
  }, [machine.placement.lat, machine.placement.lon, machine.body]);

  const selected = selectedMachineId === machine.id;
  const toCam = useRef(new Vector3());
  const lastVisible = useRef(true);
  const lastScale = useRef(0);

  useFrame(({ camera }) => {
    if (machine.body !== "belt" && machine.body !== celestialBody) {
      if (lastVisible.current) {
        lastVisible.current = false;
        setShow(false);
      }
      return;
    }
    const dist = camera.position.distanceTo(position);
    toCam.current.copy(camera.position).sub(position).normalize();
    const horizon = normal.dot(toCam.current);
    const visible = horizon > 0.015 && dist < 7.2;
    if (visible !== lastVisible.current) {
      lastVisible.current = visible;
      setShow(visible);
    }
    if (model.current) {
      // Keep the little figure readable at every zoom, like the site markers.
      const scale = Math.min(0.048, Math.max(0.014, dist * 0.011));
      if (Math.abs(scale - lastScale.current) > 0.0008) {
        lastScale.current = scale;
        model.current.scale.setScalar(scale);
      }
    }
    if (hitMat.current) {
      hitMat.current.opacity = selected ? 0.18 : 0;
    }
  });

  if (machine.body === "belt") return null;

  return (
    <group ref={root} position={position} quaternion={quaternion} visible={show}>
      <group ref={model} scale={0.03} position={[0, 0.024, 0]}>
        <Suspense fallback={null}>
          <MachineMascot3D
            machine={machine}
            isSpeaking={false}
            reduceMotion={false}
            mood="waving"
            mini
          />
        </Suspense>
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            flyToMachine(machine);
          }}
        >
          <sphereGeometry args={[0.95, 10, 8]} />
          <meshBasicMaterial ref={hitMat} transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>

      {(hovered || selected) && !selected && (
        <Html
          position={[0, 0.062, 0]}
          center
          zIndexRange={[15, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="flex items-center gap-1.5 rounded-full border border-loro/45 bg-space-950/90 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-regolith-bright shadow-lg backdrop-blur-md">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: machine.accent }} />
            <span>{machine.name}</span>
            <span className="font-mono text-[10px] text-regolith/75">{machine.launch.date.slice(-4)}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

/** All 3D machine characters on the current globe. */
export default function MachineCastMarkers() {
  const celestialBody = useAppStore((s) => s.celestialBody);
  const machines = getMachinesForBody(celestialBody);

  return (
    <group name={`${celestialBody}-machine-cast`}>
      {machines
        .filter((machine) => machine.body !== "belt")
        .map((machine) => (
          <CastFigure key={machine.id} machine={machine} />
        ))}
    </group>
  );
}
